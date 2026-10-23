import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { googleSheetsService } from '@/lib/google-sheets/sheetsClient';
import { 
  Sheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Unlink, 
  FileSpreadsheet, 
  HelpCircle,
  ShieldCheck,
  Zap
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

  const [spreadsheetId, setSpreadsheetId] = useState(sheetConnection?.spreadsheet_id || '');
  const [sheetTitle, setSheetTitle] = useState('PaisaWise Financial Ledger');
  const [sheetName, setSheetName] = useState(sheetConnection?.selected_sheet_name || 'PaisaWise_Transactions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Trigger Sync Now
  const handleSyncNow = async () => {
    const targetSpreadsheetId = spreadsheetId.trim() || sheetConnection?.spreadsheet_id;
    if (!targetSpreadsheetId) {
      setSyncStatusMsg({
        type: 'error',
        text: 'Please connect or create a Google Spreadsheet before syncing.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const result = await googleSheetsService.syncTransactions(
        targetSpreadsheetId,
        transactions,
        sheetName
      );

      // Save or update connection record
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
        text: `Sync Complete: ${result.syncedCount} new transaction(s) appended. ${result.duplicateCount} duplicates safely prevented!`
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
      const { spreadsheetId: newId, url } = await googleSheetsService.createSpreadsheet(sheetTitle);
      setSpreadsheetId(newId);

      // Initial sync with all existing transactions
      const result = await googleSheetsService.syncTransactions(
        newId,
        transactions,
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
        text: `Spreadsheet created and initialized with ${result.syncedCount} transactions!`
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
      setSpreadsheetId('');
      setSyncStatusMsg(null);
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
            <Badge variant="warning">Not Connected</Badge>
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
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Worksheet Tab</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {sheetConnection.selected_sheet_name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold">Last Successful Sync</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {sheetConnection.last_sync_at
                      ? format(new Date(sheetConnection.last_sync_at), 'dd MMM yyyy, hh:mm a')
                      : 'Never'}
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
                Connect PaisaWise to your Google Drive to maintain a mirrored spreadsheet ledger. Every sync checks existing Transaction IDs in Column A so existing entries are never duplicated.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Spreadsheet Title"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="PaisaWise Financial Ledger"
                />

                <Input
                  label="Existing Google Spreadsheet ID (Optional)"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="Leave empty to auto-create a new sheet"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleCreateNewSpreadsheet}
                  variant="primary"
                  size="sm"
                  isLoading={isSyncing}
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Create & Connect New Sheet
                </Button>

                {spreadsheetId && (
                  <Button
                    onClick={handleSyncNow}
                    variant="secondary"
                    size="sm"
                    isLoading={isSyncing}
                  >
                    Connect Existing ID
                  </Button>
                )}
              </div>
            </div>
          )}
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
