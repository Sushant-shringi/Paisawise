import { initializeDatabase } from '../server/db.ts';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const transactions = [
  {
    id: 'tx-001',
    user_id: 'usr-demo',
    amount: 110000.00,
    currency: 'INR',
    type: 'income',
    title: 'Monthly Tech Salary Credit',
    payment_method: 'Net Banking',
    transaction_date: '2026-10-01',
    notes: 'Direct corporate deposit for October'
  },
  {
    id: 'tx-002',
    user_id: 'usr-demo',
    amount: 32000.00,
    currency: 'INR',
    type: 'expense',
    title: 'Apartment Rent (2BHK Koramangala)',
    payment_method: 'UPI',
    transaction_date: '2026-10-02',
    notes: 'Paid to landlord via UPI'
  },
  {
    id: 'tx-003',
    user_id: 'usr-demo',
    amount: 4850.00,
    currency: 'INR',
    type: 'expense',
    title: 'Nature Basket Organic Groceries',
    payment_method: 'Credit Card',
    transaction_date: '2026-10-05',
    notes: 'Weekly pantry replenishment'
  },
  {
    id: 'tx-004',
    user_id: 'usr-demo',
    amount: 2450.00,
    currency: 'INR',
    type: 'expense',
    title: 'Reliance Smart Supermarket',
    payment_method: 'UPI',
    transaction_date: '2026-10-08',
    notes: 'Grocery staples & household supplies'
  },
  {
    id: 'tx-005',
    user_id: 'usr-demo',
    amount: 2200.00,
    currency: 'INR',
    type: 'expense',
    title: 'Shell Petrol Pump Fuel',
    payment_method: 'UPI',
    transaction_date: '2026-10-10',
    notes: 'Car fuel refill'
  },
  {
    id: 'tx-006',
    user_id: 'usr-demo',
    amount: 35000.00,
    currency: 'INR',
    type: 'income',
    title: 'Fintech Freelance Advisory Milestone',
    payment_method: 'Net Banking',
    transaction_date: '2026-10-12',
    notes: 'Design review & security consultation'
  },
  {
    id: 'tx-007',
    user_id: 'usr-demo',
    amount: 3500.00,
    currency: 'INR',
    type: 'expense',
    title: 'HDFC Ergo Health Insurance EMI',
    payment_method: 'Net Banking',
    transaction_date: '2026-10-15',
    notes: 'Family floater insurance auto-debit'
  },
  {
    id: 'tx-008',
    user_id: 'usr-demo',
    amount: 1450.00,
    currency: 'INR',
    type: 'expense',
    title: 'Punjab Grill Family Dinner',
    payment_method: 'Credit Card',
    transaction_date: '2026-10-18',
    notes: 'Weekend dinner with family'
  },
  {
    id: 'tx-009',
    user_id: 'usr-demo',
    amount: 999.00,
    currency: 'INR',
    type: 'expense',
    title: 'Airtel Xstream Fiber Broadband',
    payment_method: 'UPI',
    transaction_date: '2026-10-20',
    notes: '300 Mbps unlimited home internet'
  },
  {
    id: 'tx-010',
    user_id: 'usr-demo',
    amount: 649.00,
    currency: 'INR',
    type: 'expense',
    title: 'Netflix Premium 4K Plan',
    payment_method: 'Credit Card',
    transaction_date: '2026-10-21',
    notes: 'Monthly recurring entertainment'
  },
  {
    id: 'tx-011',
    user_id: 'usr-demo',
    amount: 1500.00,
    currency: 'INR',
    type: 'income',
    title: 'Cred UPI Credit Card Cashback',
    payment_method: 'UPI',
    transaction_date: '2026-10-22',
    notes: 'Promotional milestone reward'
  },
  {
    id: 'tx-012',
    user_id: 'usr-demo',
    amount: 5000.00,
    currency: 'INR',
    type: 'expense',
    title: 'Emergency Fund Savings Contribution',
    payment_method: 'UPI',
    transaction_date: '2026-10-24',
    notes: 'Monthly milestone savings deposit'
  }
];

async function seed() {
  const db = initializeDatabase();
  const now = new Date().toISOString();

  console.log('Seeding transactions into database...');

  // Ensure user usr-demo exists
  try {
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').get('usr-demo');
    if (!user) {
      await db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, email_verified, created_at, updated_at)
        VALUES ('usr-demo', 'demo@paisawise.in', 'hash', 'Demo User', TRUE, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).run(now, now);
    }
  } catch (e) {
    console.warn('User insert warning:', e.message);
  }

  let count = 0;
  for (const t of transactions) {
    try {
      const existing = await db.prepare('SELECT id FROM transactions WHERE id = ?').get(t.id);
      if (!existing) {
        await db.prepare(`
          INSERT INTO transactions (id, user_id, amount, currency, type, title, payment_method, transaction_date, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `).run(t.id, t.user_id, t.amount, t.currency, t.type, t.title, t.payment_method, t.transaction_date, t.notes, now, now);
        count++;
      }
    } catch (err) {
      console.error(`Error inserting ${t.id}:`, err.message);
    }
  }

  console.log(`✔ Successfully seeded ${count} transactions into Supabase PostgreSQL database!`);
  await db.close();
}

seed().catch(console.error);
