import { Transaction } from '@/types';

export interface GoogleSyncResult {
  success: boolean;
  syncedCount: number;
  duplicateCount: number;
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  timestamp: string;
  error?: string;
}

export const SHEETS_HEADERS = [
  'Transaction ID',
  'Date',
  'Type',
  'Title',
  'Category',
  'Amount (INR)',
  'Payment Method',
  'Notes'
];

/**
 * Format a single transaction into a row array for Google Sheets
 */
export function formatTransactionRow(tx: Transaction): (string | number)[] {
  return [
    tx.id,
    tx.transaction_date,
    tx.type.toUpperCase(),
    tx.title,
    tx.category?.name || 'Uncategorized',
    Number(tx.amount),
    tx.payment_method,
    tx.notes || ''
  ];
}

/**
 * Filter transactions to find only those not already present in existing sheet rows
 */
export function filterNewTransactions(
  transactions: Transaction[],
  existingTransactionIds: Set<string>
): Transaction[] {
  return transactions.filter(tx => !existingTransactionIds.has(tx.id));
}

/**
 * Google Sheets API v4 Client
 */
export class GoogleSheetsClient {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Create a new spreadsheet with the standard PaisaWise header
   */
  async createSpreadsheet(title: string = 'PaisaWise Financial Ledger'): Promise<{ spreadsheetId: string; url: string }> {
    if (!this.accessToken) {
      // Return simulated spreadsheet ID for demo/offline test
      const mockId = `demo_sheet_${Date.now()}`;
      return {
        spreadsheetId: mockId,
        url: `https://docs.google.com/spreadsheets/d/${mockId}/edit`
      };
    }

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          {
            properties: { title: 'PaisaWise_Transactions' },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: SHEETS_HEADERS.map(header => ({
                      userEnteredValue: { stringValue: header },
                      userEnteredFormat: {
                        backgroundColor: { red: 0.06, green: 0.72, blue: 0.50 }, // Brand Emerald
                        textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                      }
                    }))
                  }
                ]
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const data = await response.json();
    return {
      spreadsheetId: data.spreadsheetId,
      url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
    };
  }

  /**
   * Fetch existing transaction IDs from column A to ensure idempotency and prevent duplicates
   */
  async getExistingTransactionIds(spreadsheetId: string, sheetName: string = 'PaisaWise_Transactions'): Promise<Set<string>> {
    if (!this.accessToken || spreadsheetId.startsWith('demo_sheet_')) {
      return new Set<string>();
    }

    try {
      const range = `${sheetName}!A2:A`;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );

      if (!response.ok) {
        return new Set<string>();
      }

      const data = await response.json();
      const ids = new Set<string>();
      if (data.values && Array.isArray(data.values)) {
        for (const row of data.values) {
          if (row[0]) {
            ids.add(String(row[0]).trim());
          }
        }
      }
      return ids;
    } catch (e) {
      console.warn('Could not read existing transaction IDs:', e);
      return new Set<string>();
    }
  }

  /**
   * Export transactions into Google Sheets with duplicate prevention
   */
  async syncTransactions(
    spreadsheetId: string,
    transactions: Transaction[],
    sheetName: string = 'PaisaWise_Transactions'
  ): Promise<GoogleSyncResult> {
    const timestamp = new Date().toISOString();
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 1. Fetch existing IDs from Google Sheets
    const existingIds = await this.getExistingTransactionIds(spreadsheetId, sheetName);

    // 2. Filter out already synced transactions
    const newTransactions = filterNewTransactions(transactions, existingIds);
    const duplicateCount = transactions.length - newTransactions.length;

    // If all are already synced, return early successfully
    if (newTransactions.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        duplicateCount,
        spreadsheetId,
        spreadsheetUrl,
        sheetName,
        timestamp
      };
    }

    // 3. If in demo/test mode without live Google token, simulate successful sync
    if (!this.accessToken || spreadsheetId.startsWith('demo_sheet_')) {
      return {
        success: true,
        syncedCount: newTransactions.length,
        duplicateCount,
        spreadsheetId,
        spreadsheetUrl,
        sheetName,
        timestamp
      };
    }

    // 4. Batch append rows
    const rows = newTransactions.map(formatTransactionRow);
    const range = `${sheetName}!A1`;
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to append transactions to Google Sheets');
    }

    return {
      success: true,
      syncedCount: newTransactions.length,
      duplicateCount,
      spreadsheetId,
      spreadsheetUrl,
      sheetName,
      timestamp
    };
  }
}

export const googleSheetsService = new GoogleSheetsClient();
