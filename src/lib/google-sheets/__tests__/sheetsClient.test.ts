import { describe, it, expect } from 'vitest';
import { 
  SHEETS_HEADERS, 
  formatTransactionRow, 
  filterNewTransactions,
  extractSpreadsheetId,
  formatTransactionsToCsv,
  formatTransactionsToTsv
} from '../sheetsClient';
import { Transaction } from '@/types';

describe('Google Sheets Synchronization Engine', () => {
  const sampleTx: Transaction = {
    id: 'tx-100',
    user_id: 'user-abc',
    type: 'expense',
    amount: 1450.50,
    currency: 'INR',
    title: 'Grocery Store Run',
    transaction_date: '2026-10-24',
    payment_method: 'UPI',
    notes: 'Bought organic items',
    created_at: '2026-10-24T12:00:00Z',
    updated_at: '2026-10-24T12:00:00Z',
    category: {
      id: 'cat-groceries',
      name: 'Groceries',
      type: 'expense',
      icon: 'ShoppingBag',
      color: '#84cc16'
    }
  };

  it('contains expected standard columns in SHEETS_HEADERS', () => {
    expect(SHEETS_HEADERS).toContain('Transaction ID');
    expect(SHEETS_HEADERS).toContain('Date');
    expect(SHEETS_HEADERS).toContain('Type');
    expect(SHEETS_HEADERS).toContain('Title');
    expect(SHEETS_HEADERS).toContain('Category');
    expect(SHEETS_HEADERS).toContain('Amount (INR)');
    expect(SHEETS_HEADERS).toContain('Payment Method');
    expect(SHEETS_HEADERS).toContain('Notes');
  });

  it('formats a transaction into an ordered spreadsheet row', () => {
    const row = formatTransactionRow(sampleTx);
    expect(row[0]).toBe('tx-100');
    expect(row[1]).toBe('2026-10-24');
    expect(row[2]).toBe('EXPENSE');
    expect(row[3]).toBe('Grocery Store Run');
    expect(row[4]).toBe('Groceries');
    expect(row[5]).toBe(1450.5);
    expect(row[6]).toBe('UPI');
    expect(row[7]).toBe('Bought organic items');
  });

  it('handles uncategorized transactions without crashing', () => {
    const uncatTx: Transaction = { ...sampleTx, category: undefined };
    const row = formatTransactionRow(uncatTx);
    expect(row[4]).toBe('Uncategorized');
  });

  it('prevents duplicates by filtering out transactions already on the sheet', () => {
    const txList: Transaction[] = [
      { ...sampleTx, id: 'tx-1' },
      { ...sampleTx, id: 'tx-2' },
      { ...sampleTx, id: 'tx-3' }
    ];

    const existingIds = new Set(['tx-1', 'tx-2']);
    const newOnes = filterNewTransactions(txList, existingIds);

    expect(newOnes.length).toBe(1);
    expect(newOnes[0].id).toBe('tx-3');
  });

  it('returns all transactions when sheet is empty', () => {
    const txList: Transaction[] = [
      { ...sampleTx, id: 'tx-1' },
      { ...sampleTx, id: 'tx-2' }
    ];
    const existingIds = new Set<string>();
    const newOnes = filterNewTransactions(txList, existingIds);
    expect(newOnes.length).toBe(2);
  });

  it('extracts spreadsheet ID from a full Google Sheets URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA/edit?gid=0#gid=0';
    const id = extractSpreadsheetId(url);
    expect(id).toBe('1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA');

    // Also supports raw ID input
    expect(extractSpreadsheetId('1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA')).toBe('1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA');
  });

  it('formats transactions as valid CSV with headers', () => {
    const csv = formatTransactionsToCsv([sampleTx]);
    expect(csv).toContain('Transaction ID,Date,Type,Title,Category,Amount (INR),Payment Method,Notes');
    expect(csv).toContain('tx-100,2026-10-24,EXPENSE,Grocery Store Run,Groceries,1450.5,UPI,Bought organic items');
  });

  it('formats transactions as valid TSV with headers for clipboard paste', () => {
    const tsv = formatTransactionsToTsv([sampleTx]);
    expect(tsv).toContain('Transaction ID\tDate\tType\tTitle\tCategory\tAmount (INR)\tPayment Method\tNotes');
    expect(tsv).toContain('tx-100\t2026-10-24\tEXPENSE\tGrocery Store Run\tGroceries\t1450.5\tUPI\tBought organic items');
  });
});
