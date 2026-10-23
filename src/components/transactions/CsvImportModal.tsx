import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { TransactionType, PaymentMethod } from '@/types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  date: string;
  type: TransactionType;
  title: string;
  categoryName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, categories, createTransaction } = useFinance();
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      parseCsvFile(selected);
    }
  };

  const parseCsvFile = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setImportSummary('CSV file must have a header row and at least one data row.');
        return;
      }

      const rows: ParsedRow[] = [];
      // Existing transaction signatures for duplicate detection
      const existingSignatures = new Set(
        transactions.map(t => `${t.transaction_date}_${t.title.toLowerCase().trim()}_${t.amount}`)
      );

      // Simple CSV split handling quotes
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 4) continue;

        const date = parts[0] || new Date().toISOString().split('T')[0];
        const rawType = (parts[1] || 'expense').toLowerCase();
        const type: TransactionType = rawType.includes('inc') ? 'income' : 'expense';
        const title = parts[2] || 'Imported Transaction';
        const categoryName = parts[3] || 'Other';
        const amount = parseFloat(parts[4]) || 0;
        const paymentMethod: PaymentMethod = (parts[5] as PaymentMethod) || 'UPI';
        const notes = parts[6] || '';

        const isValid = amount > 0 && title.length > 0;
        const sig = `${date}_${title.toLowerCase().trim()}_${amount}`;
        const isDuplicate = existingSignatures.has(sig);

        rows.push({
          date,
          type,
          title,
          categoryName,
          amount,
          paymentMethod,
          notes,
          isValid,
          isDuplicate,
          error: !isValid ? 'Invalid amount or missing title' : undefined
        });
      }

      setParsedRows(rows);
    };
    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid && !r.isDuplicate);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    let importedCount = 0;

    for (const r of validRows) {
      // Find category or assign first match
      const matchedCat = categories.find(
        c => c.name.toLowerCase() === r.categoryName.toLowerCase() && c.type === r.type
      );

      try {
        await createTransaction({
          user_id: user?.id || 'demo',
          type: r.type,
          amount: r.amount,
          currency: 'INR',
          title: r.title,
          category_id: matchedCat?.id,
          payment_method: r.paymentMethod,
          transaction_date: r.date,
          notes: r.notes
        });
        importedCount++;
      } catch (err) {
        console.error('Failed importing row:', r, err);
      }
    }

    setIsProcessing(false);
    setImportSummary(`Successfully imported ${importedCount} transactions.`);
    setTimeout(() => {
      onClose();
      setParsedRows([]);
      setFile(null);
      setImportSummary(null);
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Transactions via CSV"
      description="Upload a CSV ledger to batch import expenses and income."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Upload Dropzone */}
        {!file ? (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-emerald-500 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40">
            <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Click to choose CSV file
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Expected headers: Date, Type, Title, Category, Amount, Payment Method, Notes
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{file.name}</span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setParsedRows([]);
                setImportSummary(null);
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Change file
            </button>
          </div>
        )}

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Preview ({parsedRows.length} rows parsed)</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {parsedRows.filter(r => r.isValid && !r.isDuplicate).length} Ready
                </span>
                {parsedRows.some(r => r.isDuplicate) && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {parsedRows.filter(r => r.isDuplicate).length} Duplicates Ignored
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {parsedRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 flex items-center justify-between ${
                    row.isDuplicate
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 opacity-60'
                      : !row.isValid
                      ? 'bg-rose-50/50 dark:bg-rose-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{row.date}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {row.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${row.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                      {row.type === 'income' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
                    </span>
                    {row.isDuplicate && (
                      <span className="text-[10px] text-amber-600 font-bold">Duplicate</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {importSummary && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{importSummary}</p>
        )}

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleImport}
            disabled={parsedRows.filter(r => r.isValid && !r.isDuplicate).length === 0 || isProcessing}
            isLoading={isProcessing}
          >
            Import {parsedRows.filter(r => r.isValid && !r.isDuplicate).length} Records
          </Button>
        </div>
      </div>
    </Modal>
  );
};
