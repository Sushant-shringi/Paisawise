import { describe, it, expect } from 'vitest';
import { filterTransactionsByDate } from '../financeCalculations';
import { Transaction } from '@/types';

describe('Date Boundary Handling', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'u1',
      type: 'expense',
      amount: 1000,
      currency: 'INR',
      title: 'Beginning of Month',
      transaction_date: '2026-10-01',
      payment_method: 'UPI',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z'
    },
    {
      id: 'tx-2',
      user_id: 'u1',
      type: 'expense',
      amount: 2000,
      currency: 'INR',
      title: 'End of Month',
      transaction_date: '2026-10-31',
      payment_method: 'UPI',
      created_at: '2026-10-31T23:59:59Z',
      updated_at: '2026-10-31T23:59:59Z'
    },
    {
      id: 'tx-3',
      user_id: 'u1',
      type: 'expense',
      amount: 3000,
      currency: 'INR',
      title: 'Next Month Item',
      transaction_date: '2026-11-01',
      payment_method: 'UPI',
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z'
    }
  ];

  it('accurately captures both inclusive start and end day boundaries', () => {
    const res = filterTransactionsByDate(transactions, '2026-10-01', '2026-10-31');
    expect(res.length).toBe(2);
    expect(res.map(t => t.id)).toEqual(['tx-1', 'tx-2']);
  });

  it('excludes records outside interval', () => {
    const res = filterTransactionsByDate(transactions, '2026-11-01', '2026-11-30');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('tx-3');
  });

  it('handles single-day interval correctly', () => {
    const res = filterTransactionsByDate(transactions, '2026-10-01', '2026-10-01');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('tx-1');
  });
});
