import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { initializeDatabase } from '../db';
import { createApp } from '../app';
import { DatabaseSync } from 'node:sqlite';
import { Express } from 'express';

describe('PaisaWise Backend API & Local Recovery E2E Test Suite', () => {
  let db: DatabaseSync;
  let app: Express;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    app = createApp(db) as any;
  });

  // ==========================================================================
  // SCENARIO 1: New User Registration and OTP Verification
  // ==========================================================================
  describe('Scenario 1: New User Registration and OTP Verification', () => {
    it('registers a new user, issues expiring OTP, and verifies correctly', async () => {
      // 1. Register new user
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Arjun Verma',
          email: 'arjun.verma@example.com',
          password: 'Password@123'
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.requiresVerification).toBe(true);
      expect(regRes.body.email).toBe('arjun.verma@example.com');

      // Verify user is in DB but email_verified is 0
      const userRecord = db.prepare('SELECT email_verified, password_hash FROM users WHERE email = ?').get('arjun.verma@example.com') as any;
      expect(userRecord.email_verified).toBe(0);
      expect(userRecord.password_hash).not.toBe('Password@123'); // Must be hashed!

      // 2. Fetch OTP via dev-active-otp (test adapter)
      const otpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=arjun.verma@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');

      expect(otpRes.status).toBe(200);
      expect(otpRes.body.otp).toMatch(/^\d{6}$/);
      const activeOtp = otpRes.body.otp;

      // 3. Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'arjun.verma@example.com',
          otpCode: activeOtp
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.token).toBeDefined();
      expect(verifyRes.body.user.email).toBe('arjun.verma@example.com');

      // Verify user is now verified in DB
      const updatedUser = db.prepare('SELECT email_verified FROM users WHERE email = ?').get('arjun.verma@example.com') as any;
      expect(updatedUser.email_verified).toBe(1);

      // Verify OTP is marked verified and cannot be reused
      const reuseRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'arjun.verma@example.com',
          otpCode: activeOtp
        });
      expect(reuseRes.status).toBe(400);
    });

    it('enforces maximum attempts on OTP entry', async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'Password@123'
      });

      // 3 wrong attempts
      const res1 = await request(app).post('/api/auth/verify-otp').send({ email: 'priya.patel@example.com', otpCode: '000000' });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('2 attempts remaining');

      const res2 = await request(app).post('/api/auth/verify-otp').send({ email: 'priya.patel@example.com', otpCode: '000001' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('1 attempt remaining');

      const res3 = await request(app).post('/api/auth/verify-otp').send({ email: 'priya.patel@example.com', otpCode: '000002' });
      expect(res3.status).toBe(400);
      expect(res3.body.error).toContain('locked');

      // Even correct OTP fails once locked
      const otpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=priya.patel@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');

      const res4 = await request(app).post('/api/auth/verify-otp').send({ email: 'priya.patel@example.com', otpCode: otpRes.body.otp });
      expect(res4.status).toBe(400);
    });

    it('rate limits consecutive OTP requests within the 30-second window', async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'Kavita Joshi',
        email: 'kavita@example.com',
        password: 'Password123'
      });

      // Immediate second request must trigger rate limit
      const rateLimitRes = await request(app).post('/api/auth/request-otp').send({
        email: 'kavita@example.com'
      });
      expect(rateLimitRes.status).toBe(429);
      expect(rateLimitRes.body.error).toContain('Please wait');
    });
  });

  // ==========================================================================
  // SCENARIO 2: Login, Session Persistence, and Logout
  // ==========================================================================
  describe('Scenario 2: Login, Session Persistence, and Logout', () => {
    it('authenticates verified user, returns JWT token, and accesses protected /me route', async () => {
      // Register & verify
      await request(app).post('/api/auth/register').send({
        fullName: 'Rahul Sen',
        email: 'rahul.sen@example.com',
        password: 'SecurePassword123!'
      });
      const otpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=rahul.sen@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      await request(app).post('/api/auth/verify-otp').send({ email: 'rahul.sen@example.com', otpCode: otpRes.body.otp });

      // Sign in
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'rahul.sen@example.com',
        password: 'SecurePassword123!'
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
      const token = loginRes.body.token;

      // Access protected route /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('rahul.sen@example.com');
      expect(meRes.body.profile.currency).toBe('INR');

      // Logout
      const logoutRes = await request(app).post('/api/auth/logout');
      expect(logoutRes.status).toBe(200);
    });
  });

  // ==========================================================================
  // SCENARIO 3: Invalid Authentication Attempts
  // ==========================================================================
  describe('Scenario 3: Invalid Authentication Attempts', () => {
    it('rejects invalid email formats, short passwords, duplicate accounts, and wrong credentials', async () => {
      // 1. Invalid email format
      const badEmailRes = await request(app).post('/api/auth/register').send({
        fullName: 'Test User',
        email: 'not-an-email',
        password: 'ValidPassword123'
      });
      expect(badEmailRes.status).toBe(400);
      expect(badEmailRes.body.error).toContain('format');

      // 2. Short password (< 6 chars)
      const shortPassRes = await request(app).post('/api/auth/register').send({
        fullName: 'Test User',
        email: 'valid@example.com',
        password: '123'
      });
      expect(shortPassRes.status).toBe(400);
      expect(shortPassRes.body.error).toContain('6 characters');

      // 3. Register valid user
      await request(app).post('/api/auth/register').send({
        fullName: 'Original User',
        email: 'original@example.com',
        password: 'Password123'
      });

      // 4. Duplicate account registration
      const dupRes = await request(app).post('/api/auth/register').send({
        fullName: 'Imposter User',
        email: 'original@example.com',
        password: 'AnotherPassword123'
      });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error).toContain('already exists');

      // 5. Login with incorrect password
      const wrongPassRes = await request(app).post('/api/auth/login').send({
        email: 'original@example.com',
        password: 'WrongPassword'
      });
      expect(wrongPassRes.status).toBe(401);
      expect(wrongPassRes.body.error).toBe('Invalid email or password.');

      // 6. Access protected route without token
      const noTokenRes = await request(app).get('/api/transactions');
      expect(noTokenRes.status).toBe(401);
    });
  });

  // ==========================================================================
  // SCENARIO 4: Complete Financial Workflow
  // ==========================================================================
  describe('Scenario 4: Complete Financial Workflow', () => {
    it('executes full transaction, budget, goal, and dashboard metrics lifecycle', async () => {
      // Setup user
      await request(app).post('/api/auth/register').send({
        fullName: 'Vikram Seth',
        email: 'vikram@example.com',
        password: 'Password123'
      });
      const otpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=vikram@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      const verifyRes = await request(app).post('/api/auth/verify-otp').send({
        email: 'vikram@example.com',
        otpCode: otpRes.body.otp
      });
      const token = verifyRes.body.token;

      // 1. Record Income (Salary: ₹85,000)
      const incomeRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'income',
          amount: 85000,
          title: 'Monthly Tech Salary',
          category_id: 'cat-salary',
          transaction_date: '2026-10-01',
          payment_method: 'Net Banking'
        });
      expect(incomeRes.status).toBe(201);
      expect(incomeRes.body.amount).toBe(85000);
      expect(incomeRes.body.category.name).toBe('Salary');

      // 2. Record Expenses (Groceries: ₹4,500, Housing: ₹25,000)
      const exp1Res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'expense',
          amount: 4500,
          title: 'Supermarket Groceries',
          category_id: 'cat-groceries',
          transaction_date: '2026-10-05',
          payment_method: 'UPI'
        });
      expect(exp1Res.status).toBe(201);

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'expense',
          amount: 25000,
          title: 'Apartment Rent',
          category_id: 'cat-housing',
          transaction_date: '2026-10-02',
          payment_method: 'Net Banking'
        });

      // 3. Create Budget for Groceries (₹10,000 limit)
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Monthly Groceries Budget',
          category_id: 'cat-groceries',
          amount: 10000,
          start_date: '2026-10-01',
          end_date: '2026-10-31',
          alert_threshold: 80
        });
      expect(budgetRes.status).toBe(201);

      // Verify dynamic spent calculation in GET /api/budgets
      const listBudgetsRes = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token}`);
      expect(listBudgetsRes.status).toBe(200);
      const groceryBudget = listBudgetsRes.body.find((b: any) => b.category_id === 'cat-groceries');
      expect(groceryBudget).toBeDefined();
      expect(groceryBudget.spent).toBe(4500); // 4500 spent
      expect(groceryBudget.remaining).toBe(5500); // 10000 - 4500 = 5500
      expect(groceryBudget.percentage).toBe(45); // 45%

      // 4. Create Savings Goal & Contribute
      const goalRes = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Emergency Fund',
          target_amount: 100000,
          current_amount: 20000,
          target_date: '2026-12-31'
        });
      expect(goalRes.status).toBe(201);
      const goalId = goalRes.body.id;

      // Contribute ₹15,000
      const contribRes = await request(app)
        .post(`/api/goals/${goalId}/contribute`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 15000 });
      expect(contribRes.status).toBe(200);
      expect(contribRes.body.current_amount).toBe(35000);

      // 5. Fetch Dashboard Metrics
      const dashRes = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(dashRes.status).toBe(200);
      expect(dashRes.body.summary.totalIncome).toBe(85000);
      expect(dashRes.body.summary.totalExpense).toBe(29500); // 4500 + 25000
      expect(dashRes.body.summary.netSavings).toBe(55500); // 85000 - 29500
      expect(dashRes.body.summary.savingsRate).toBe(65);
      expect(dashRes.body.recentTransactions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // SCENARIO 5: Multi-User Data Isolation
  // ==========================================================================
  describe('Scenario 5: Multi-User Data Isolation', () => {
    it('strictly isolates data between User A and User B and rejects cross-user operations with 403', async () => {
      // User A
      await request(app).post('/api/auth/register').send({
        fullName: 'User Alpha',
        email: 'alpha@example.com',
        password: 'Password123'
      });
      const otpA = await request(app)
        .get('/api/auth/dev-active-otp?email=alpha@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      const authA = await request(app).post('/api/auth/verify-otp').send({ email: 'alpha@example.com', otpCode: otpA.body.otp });
      const tokenA = authA.body.token;

      // User B
      await request(app).post('/api/auth/register').send({
        fullName: 'User Beta',
        email: 'beta@example.com',
        password: 'Password123'
      });
      const otpB = await request(app)
        .get('/api/auth/dev-active-otp?email=beta@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      const authB = await request(app).post('/api/auth/verify-otp').send({ email: 'beta@example.com', otpCode: otpB.body.otp });
      const tokenB = authB.body.token;

      // User A creates a transaction
      const txA = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'expense',
          amount: 5000,
          title: 'Secret Alpha Transaction',
          category_id: 'cat-shopping',
          transaction_date: '2026-10-10'
        });
      const txAId = txA.body.id;

      // User A creates a budget
      const bgA = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Alpha Budget',
          amount: 20000,
          start_date: '2026-10-01',
          end_date: '2026-10-31'
        });
      const bgAId = bgA.body.id;

      // User A creates a savings goal
      const goalA = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Alpha Island Trip',
          target_amount: 500000,
          target_date: '2027-01-01'
        });
      const goalAId = goalA.body.id;

      // 1. User B lists transactions: MUST NOT see User A's transaction
      const bTxs = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(bTxs.body.some((t: any) => t.id === txAId)).toBe(false);

      // 2. User B attempts to edit User A's transaction: MUST return 403 Forbidden
      const editTxRes = await request(app)
        .put(`/api/transactions/${txAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ amount: 1 });
      expect(editTxRes.status).toBe(403);

      // 3. User B attempts to delete User A's transaction: MUST return 403 Forbidden
      const delTxRes = await request(app)
        .delete(`/api/transactions/${txAId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(delTxRes.status).toBe(403);

      // 4. User B attempts to modify User A's budget: MUST return 403 Forbidden
      const editBgRes = await request(app)
        .put(`/api/budgets/${bgAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ amount: 999 });
      expect(editBgRes.status).toBe(403);

      // 5. User B attempts to delete User A's budget: MUST return 403 Forbidden
      const delBgRes = await request(app)
        .delete(`/api/budgets/${bgAId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(delBgRes.status).toBe(403);

      // 6. User B attempts to contribute to User A's goal: MUST return 403 Forbidden
      const contribGoalRes = await request(app)
        .post(`/api/goals/${goalAId}/contribute`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ amount: 100 });
      expect(contribGoalRes.status).toBe(403);

      // Verify User A's transaction is still intact with original amount
      const aTxs = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${tokenA}`);
      const checkedTx = aTxs.body.find((t: any) => t.id === txAId);
      expect(checkedTx).toBeDefined();
      expect(checkedTx.amount).toBe(5000);
    });
  });

  // ==========================================================================
  // SCENARIO 6: Edge Cases and Failure Handling
  // ==========================================================================
  describe('Scenario 6: Edge Cases and Failure Handling', () => {
    it('handles negative amounts, missing fields, nonexistent resources, and expired OTPs cleanly', async () => {
      // Setup user
      await request(app).post('/api/auth/register').send({
        fullName: 'Edge Tester',
        email: 'edge@example.com',
        password: 'Password123'
      });
      const otpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=edge@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      const verifyRes = await request(app).post('/api/auth/verify-otp').send({ email: 'edge@example.com', otpCode: otpRes.body.otp });
      const token = verifyRes.body.token;

      // Negative amount transaction
      const negTxRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'expense',
          amount: -500,
          title: 'Negative Amount Tx'
        });
      expect(negTxRes.status).toBe(400);

      // Nonexistent transaction modification
      const notFoundTxRes = await request(app)
        .put('/api/transactions/nonexistent-id-999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title' });
      expect(notFoundTxRes.status).toBe(404);

      // Nonexistent budget deletion
      const notFoundBgRes = await request(app)
        .delete('/api/budgets/nonexistent-id-999')
        .set('Authorization', `Bearer ${token}`);
      expect(notFoundBgRes.status).toBe(404);

      // Simulating expired OTP
      db.prepare(`
        UPDATE otps 
        SET expires_at = '2020-01-01T00:00:00.000Z', verified_at = NULL 
        WHERE email = 'edge@example.com'
      `).run();

      const expiredVerifyRes = await request(app).post('/api/auth/verify-otp').send({
        email: 'edge@example.com',
        otpCode: '123456'
      });
      expect(expiredVerifyRes.status).toBe(400);
      expect(expiredVerifyRes.body.error).toContain('expired');
    });
  });

  // ==========================================================================
  // SCENARIO 7: Password Reset Flow
  // ==========================================================================
  describe('Scenario 7: Password Reset Flow', () => {
    it('generates recovery OTP and resets password cleanly', async () => {
      // Register & verify
      await request(app).post('/api/auth/register').send({
        fullName: 'Recovery User',
        email: 'recovery@example.com',
        password: 'OldPassword123'
      });
      const otpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=recovery@example.com')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      await request(app).post('/api/auth/verify-otp').send({ email: 'recovery@example.com', otpCode: otpRes.body.otp });

      // Request forgot-password
      const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email: 'recovery@example.com' });
      expect(forgotRes.status).toBe(200);

      // Retrieve reset OTP
      const resetOtpRes = await request(app)
        .get('/api/auth/dev-active-otp?email=recovery@example.com&purpose=password_reset')
        .set('x-dev-test-token', 'paisawise-internal-test-key');
      expect(resetOtpRes.status).toBe(200);

      // Reset password
      const resetRes = await request(app).post('/api/auth/reset-password').send({
        email: 'recovery@example.com',
        otpCode: resetOtpRes.body.otp,
        newPassword: 'BrandNewSecurePassword456!'
      });
      expect(resetRes.status).toBe(200);

      // Old password must fail
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: 'recovery@example.com',
        password: 'OldPassword123'
      });
      expect(oldLoginRes.status).toBe(401);

      // New password must succeed
      const newLoginRes = await request(app).post('/api/auth/login').send({
        email: 'recovery@example.com',
        password: 'BrandNewSecurePassword456!'
      });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.token).toBeDefined();
    });
  });
});
