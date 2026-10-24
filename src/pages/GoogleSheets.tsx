import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { 
  googleSheetsService, 
  extractSpreadsheetId, 
  formatTransactionsToCsv, 
  formatTransactionsToTsv,
  copyToClipboard
} from '@/lib/google-sheets/sheetsClient';
import { INITIAL_TRANSACTIONS } from '@/lib/mockData';
import { 
  Sheet, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  Unlink, 
  FileSpreadsheet, 
  HelpCircle,
  ShieldCheck,
  Zap,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { format } from 'date-fns';

export const GoogleSheets: React.FC = () => {
  const { 
    transactions, 
    sheetConnection, 
    saveSheetConnection, 
    disconnectSheet 
  } = useFinance();
  const { user } = useAuth();

  // Default pre-fill to user's provided Google Sheet URL if not already connected
  const defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA/edit?gid=0#gid=0';
  const initialInput = sheetConnection?.spreadsheet_id 
    ? sheetConnection.spreadsheet_id 
    : defaultSheetUrl;

  const [inputUrlOrId, setInputUrlOrId] = useState(initialInput);
  const [sheetTitle, setSheetTitle] = useState(sheetConnection?.spreadsheet_name || 'PaisaWise Financial Ledger');
  const [sheetName, setSheetName] = useState(sheetConnection?.selected_sheet_name || 'PaisaWise_Transactions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showTsvPreview, setShowTsvPreview] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // If user has zero transactions in their account, fall back to rich sample data (12 transactions)
  // so they can immediately test and see the Google Sheet populated!
  const effectiveTransactions = transactions && transactions.length > 0 
    ? transactions 
    : INITIAL_TRANSACTIONS;
  const isSampleData = !transactions || transactions.length === 0;

  // Extracted clean spreadsheet ID
  const resolvedSpreadsheetId = extractSpreadsheetId(inputUrlOrId) || sheetConnection?.spreadsheet_id || '';

  // Trigger Sync Now
  const handleSyncNow = async () => {
    const targetSpreadsheetId = resolvedSpreadsheetId.trim();
    if (!targetSpreadsheetId) {
      setSyncStatusMsg({
        type: 'error',
        text: 'Please provide a valid Google Spreadsheet URL or ID.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const result = await googleSheetsService.syncTransactions(
        targetSpreadsheetId,
        effectiveTransactions,
        sheetName
      );

      // Save connection record to Supabase database
      await saveSheetConnection({
        user_id: user?.id || 'demo',
        spreadsheet_id: result.spreadsheetId,
        spreadsheet_name: sheetTitle,
        selected_sheet_name: result.sheetName,
        sync_status: 'success',
        last_sync_at: result.timestamp,
        row_count: result.syncedCount,
      });

      setSyncStatusMsg({
        type: 'success',
        text: `Sync Complete: Connected to Google Sheet (${result.spreadsheetId}). ${result.syncedCount} new transaction(s) synchronized. ${result.duplicateCount} duplicates prevented.`
      });
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to sync with Google Sheets'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Create new ledger spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const { spreadsheetId: newId } = await googleSheetsService.createSpreadsheet(sheetTitle);
      setInputUrlOrId(newId);

      // Initial sync with all existing transactions
      const result = await googleSheetsService.syncTransactions(
        newId,
        effectiveTransactions,
        sheetName
      );

      await saveSheetConnection({
        user_id: user?.id || 'demo',
        spreadsheet_id: newId,
        spreadsheet_name: sheetTitle,
        selected_sheet_name: sheetName,
        sync_status: 'success',
        last_sync_at: result.timestamp,
        row_count: result.syncedCount,
      });

      setSyncStatusMsg({
        type: 'success',
        text: `New Spreadsheet created and initialized with ${result.syncedCount} transactions!`
      });
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to initialize Google Spreadsheet'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect Google Sheets ledger? Existing data in Google Sheets will remain intact.')) {
      await disconnectSheet();
      setInputUrlOrId('');
      setSyncStatusMsg(null);
    }
  };

  // Download CSV formatted specifically for Google Sheets
  const handleDownloadCsv = () => {
    const csvContent = formatTransactionsToCsv(effectiveTransactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PaisaWise_GoogleSheets_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Tab-Separated Values for direct paste into Google Sheets (Ctrl+V)
  const handleCopyTsv = async () => {
    const tsvContent = formatTransactionsToTsv(effectiveTransactions);
    const success = await copyToClipboard(tsvContent);
    if (success) {
      setIsCopied(true);
      setCopyFeedback(
        `✓ Copied ${effectiveTransactions.length} rows to clipboard! In your Google Sheet: Click cell A1 once (do NOT double-click), then press Ctrl+V.`
      );
      setTimeout(() => {
        setIsCopied(false);
      }, 3500);
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: 'Direct clipboard copy was restricted by your browser. Please use the "Manual Copy Box" below to select and copy.'
      });
      setShowTsvPreview(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sheet className="w-6 h-6 text-emerald-600" />
            <span>Google Sheets Live Integration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Idempotent cloud synchronization with automated deduplication & formatting.
          </p>
        </div>

        <Button
          onClick={() => setShowConfigGuide(!showConfigGuide)}
          variant="outline"
          size="sm"
          leftIcon={<HelpCircle className="w-4 h-4 text-emerald-600" />}
        >
          {showConfigGuide ? 'Hide Cloud Setup Guide' : 'Google Cloud Setup Guide'}
        </Button>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <Alert
          type={syncStatusMsg.type}
          title={syncStatusMsg.type === 'success' ? 'Synchronization Successful' : 'Sync Notice'}
          onClose={() => setSyncStatusMsg(null)}
        >
          {syncStatusMsg.text}
        </Alert>
      )}

      {/* Main Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <CardTitle>Connected Spreadsheet Ledger</CardTitle>
          </div>
          {sheetConnection ? (
            <Badge variant="success">Connected & Active</Badge>
          ) : (
            <Badge variant="warning">Ready to Connect</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {sheetConnection ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Spreadsheet Title</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {sheetConnection.spreadsheet_name || 'PaisaWise Financial Ledger'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 block truncate mt-0.5">
                    ID: {sheetConnection.spreadsheet_id}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Worksheet Tab</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {sheetConnection.selected_sheet_name}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Synced entries: {sheetConnection.row_count || transactions.length}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Last Successful Sync</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {sheetConnection.last_sync_at
                      ? format(new Date(sheetConnection.last_sync_at), 'dd MMM yyyy, hh:mm a')
                      : 'Never'}
                  </span>
                  <span className="text-[11px] text-emerald-600/80 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Idempotent (Zero Duplicates)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetConnection.spreadsheet_id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSyncNow}
                    variant="primary"
                    size="sm"
                    isLoading={isSyncing}
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
                  >
                    Sync Now ({transactions.length} total)
                  </Button>

                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    leftIcon={<Unlink className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect PaisaWise to your Google Spreadsheet to mirror your financial ledger. Every sync checks existing Transaction IDs in Column A so existing entries are never duplicated.
              </p>

              <div className="space-y-4">
                <Input
                  label="Google Spreadsheet URL or ID"
                  value={inputUrlOrId}
                  onChange={(e) => setInputUrlOrId(e.target.value)}
                  placeholder="Paste your Google Sheet URL (https://docs.google.com/spreadsheets/d/...)"
                  helperText={resolvedSpreadsheetId ? `Detected ID: ${resolvedSpreadsheetId}` : undefined}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Ledger Title"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    placeholder="PaisaWise Financial Ledger"
                  />

                  <Input
                    label="Sheet Tab Name"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="PaisaWise_Transactions"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={handleSyncNow}
                  variant="primary"
                  size="sm"
                  isLoading={isSyncing}
                  leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
                >
                  Connect & Sync with Google Sheet
                </Button>

                <Button
                  onClick={handleCreateNewSpreadsheet}
                  variant="outline"
                  size="sm"
                  isLoading={isSyncing}
                  leftIcon={<Zap className="w-4 h-4 text-emerald-600" />}
                >
                  Auto-Create New Sheet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instant Export & Copy Tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sheet className="w-5 h-5 text-emerald-600" />
            <CardTitle>Google Sheets Direct Export & Paste Tools</CardTitle>
          </div>
          <span className="text-xs text-slate-400">
            {effectiveTransactions.length} transactions {isSampleData ? '(sample ledger)' : ''} ready
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Export your entire transaction ledger into Google Sheets with 100% formatted columns, headers, and decimal precision:
          </p>

          {/* Step-by-Step Paste Guidance Callout */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>How to Paste into Google Sheets without Issues:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
              <li>Click the <strong>"Copy All Data for Google Sheets (Ctrl+V)"</strong> button below.</li>
              <li>
                Switch to your Google Sheet (
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${resolvedSpreadsheetId || '1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA'}/edit`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-600 dark:text-emerald-400 font-semibold underline"
                >
                  open your spreadsheet here
                </a>
                ).
              </li>
              <li>
                <strong>Click cell A1 ONCE</strong> so the single blue boundary outline is on A1 (
                <strong className="text-amber-700 dark:text-amber-400">Important: Do NOT double-click into cell A1</strong>, 
                as double-clicking enters text-editing mode inside the single cell).
              </li>
              <li>
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] font-bold">Ctrl + V</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] font-bold">Cmd + V</kbd>). Google Sheets will automatically distribute all data across columns A through H!
              </li>
            </ol>
          </div>

          {/* Copy Confirmation Feedback */}
          {copyFeedback && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{copyFeedback}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleCopyTsv}
              variant="primary"
              size="sm"
              leftIcon={isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {isCopied ? 'Copied to Clipboard! (Paste with Ctrl+V)' : 'Copy All Data for Google Sheets (Ctrl+V)'}
            </Button>

            <Button
              onClick={handleDownloadCsv}
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Google Sheets CSV
            </Button>

            {resolvedSpreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${resolvedSpreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
              >
                <span>Open Google Sheet ({resolvedSpreadsheetId.substring(0, 8)}...)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Manual Copy / TSV Preview Box */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTsvPreview(!showTsvPreview)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{showTsvPreview ? '▼ Hide Direct TSV Data Box' : '▶ Show Direct TSV Data Box (Manual Copy Option)'}</span>
              </button>
            </div>
            {showTsvPreview && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Tab-Separated Values ({effectiveTransactions.length} rows ready):
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await copyToClipboard(formatTransactionsToTsv(effectiveTransactions));
                      setIsCopied(true);
                      setCopyFeedback(`✓ Copied ${effectiveTransactions.length} rows! Now click A1 in Google Sheets and press Ctrl+V.`);
                      setTimeout(() => setIsCopied(false), 3000);
                    }}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Select All & Copy
                  </Button>
                </div>
                <textarea
                  readOnly
                  rows={5}
                  value={formatTransactionsToTsv(effectiveTransactions)}
                  onFocus={(e) => e.target.select()}
                  className="w-full font-mono text-[11px] p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 selection:bg-emerald-500 selection:text-white"
                />
                <p className="text-[11px] text-slate-500">
                  Manual Tip: Click inside the box above, press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">Ctrl+A</kbd> then <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">Ctrl+C</kbd>. Then in your Google Sheet, click cell A1 once and press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">Ctrl+V</kbd>.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheet Schema Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Spreadsheet Column Hierarchy</CardTitle>
          <span className="text-xs text-slate-400">Standardized Headers</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-semibold">
            {[
              { col: 'A', name: 'Transaction ID' },
              { col: 'B', name: 'Date' },
              { col: 'C', name: 'Type' },
              { col: 'D', name: 'Title' },
              { col: 'E', name: 'Category' },
              { col: 'F', name: 'Amount (INR)' },
              { col: 'G', name: 'Payment Method' },
              { col: 'H', name: 'Notes' },
            ].map((header) => (
              <div key={header.col} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <span className="text-[10px] text-emerald-600 block font-mono font-bold">Col {header.col}</span>
                <span className="text-slate-800 dark:text-slate-200 truncate block mt-0.5">{header.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Google Cloud Configuration Guide Drawer */}
      {showConfigGuide && (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900/60 border-emerald-500/30">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Cloud OAuth 2.0 Credentials Setup Guide</span>
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>Go to <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">console.cloud.google.com</a>) and create or select a project.</li>
            <li>In <strong>APIs & Services &gt; Library</strong>, enable <strong>Google Sheets API</strong> and <strong>Google Drive API</strong>.</li>
            <li>Go to <strong>OAuth consent screen</strong>, select "External", fill App Name ("PaisaWise"), and add your contact email.</li>
            <li>Add Scopes: <code>https://www.googleapis.com/auth/spreadsheets</code> and <code>https://www.googleapis.com/auth/drive.file</code>.</li>
            <li>In <strong>Credentials</strong>, click <strong>Create Credentials &gt; OAuth client ID</strong> (Application type: Web application).</li>
            <li>Under <strong>Authorized JavaScript origins</strong>, add: <code>http://localhost:5173</code> and your Vercel production domain.</li>
            <li>Copy your <strong>Client ID</strong> into <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>.env</code> file.</li>
          </ol>
        </Card>
      )}
    </div>
  );
};
