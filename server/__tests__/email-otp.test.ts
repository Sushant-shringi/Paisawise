import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { initializeDatabase } from '../db';
import { createApp } from '../app';
import { DatabaseSync } from 'node:sqlite';
import { Express } from 'express';
import { getDevActiveOtp } from '../auth';

describe('Real Email OTP Verification Flow', () => {
  let db: DatabaseSync;
  let app: Express;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    app = createApp(db) as any;
  });

  it('1 & 2. generates secure 6-digit OTP for email and does NOT expose it in response', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('OTP sent');
    // Security: Must never expose OTP in response body
    expect(res.body.otp).toBeUndefined();
    expect(res.body.devOtp).toBeUndefined();

    // Verify 6-digit OTP exists in database
    const otp = getDevActiveOtp(db, 'user@example.com', 'email_verification');
    expect(otp).toBeDefined();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('5. displays "Email verified successfully" when OTP is correct and valid', async () => {
    // Send OTP
    await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'test.verify@example.com' });

    const activeOtp = getDevActiveOtp(db, 'test.verify@example.com', 'email_verification')!;

    // Verify OTP
    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        email: 'test.verify@example.com',
        otp: activeOtp,
        purpose: 'email_verification'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.message).toBe('Email verified successfully');
  });

  it('6. displays "Invalid OTP" when OTP is incorrect', async () => {
    await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'test.invalid@example.com' });

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        email: 'test.invalid@example.com',
        otp: '000000',
        purpose: 'email_verification'
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.error).toContain('Invalid OTP');
  });

  it('7. displays "OTP expired. Please request a new one" when OTP has expired', async () => {
    await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'test.expired@example.com' });

    // Manually expire the OTP in database
    db.prepare(`
      UPDATE otps 
      SET expires_at = '2020-01-01T00:00:00.000Z' 
      WHERE email = 'test.expired@example.com'
    `).run();

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        email: 'test.expired@example.com',
        otp: '123456',
        purpose: 'email_verification'
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.error).toBe('OTP expired. Please request a new one');
  });

  it('8. a successfully verified OTP must not be reusable', async () => {
    await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'test.reuse@example.com' });

    const activeOtp = getDevActiveOtp(db, 'test.reuse@example.com', 'email_verification')!;

    // First verification: Success
    const firstVerify = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        email: 'test.reuse@example.com',
        otp: activeOtp,
        purpose: 'email_verification'
      });
    expect(firstVerify.status).toBe(200);
    expect(firstVerify.body.message).toBe('Email verified successfully');

    // Second verification attempt with same OTP: Must fail with Invalid OTP
    const secondVerify = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        email: 'test.reuse@example.com',
        otp: activeOtp,
        purpose: 'email_verification'
      });
    expect(secondVerify.status).toBe(400);
    expect(secondVerify.body.error).toBe('Invalid OTP');
  });
});
