import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/calculations/currency';
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

export const Reports: React.FC = () => {
  const { 
    financialSummary, 
    filteredTransactions, 
    categorySpending, 
    dateRange,
    categories 
  } = useFinance();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Top 5 largest transactions
  const topTransactions = [...filteredTransactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);

  // Daily average burn
  const daysInPeriod = Math.max(1, Math.round(
    (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const dailyAverageSpending = financialSummary.totalExpenses / daysInPeriod;

  // Generate Professional PDF Report
  const generatePdfReport = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();

      // Title & Header
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(0, 0, 210, 28, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PaisaWise Financial Statement', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reporting Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 25);
      doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 130, 25);

      // Financial Summary Block
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Cashflow Summary', 14, 40);

      autoTable(doc, {
        startY: 44,
        head: [['Metric', 'Amount (INR)', 'Analysis']],
        body: [
          ['Total Inflow (Income)', `INR ${financialSummary.totalIncome.toLocaleString('en-IN')}`, `${financialSummary.momIncomeChangePct}% vs prior period`],
          ['Total Outflow (Expenses)', `INR ${financialSummary.totalExpenses.toLocaleString('en-IN')}`, `${financialSummary.momExpenseChangePct}% vs prior period`],
          ['Net Cash Flow', `INR ${financialSummary.netCashFlow.toLocaleString('en-IN')}`, financialSummary.netCashFlow >= 0 ? 'Surplus (+)' : 'Deficit (-)'],
          ['Net Savings Rate', `${financialSummary.savingsRate}%`, 'Target benchmark: 20%+'],
          ['Daily Average Outflow', `INR ${Math.round(dailyAverageSpending).toLocaleString('en-IN')} / day`, `Calculated over ${daysInPeriod} active days`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110] },
      });

      // Category Breakdown Table
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Category Spending Breakdown', 14, finalY);

      const categoryRows = categorySpending.map(c => [
        c.categoryName,
        `INR ${c.amount.toLocaleString('en-IN')}`,
        `${c.percentage}%`,
        String(c.transactionCount)
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Category Name', 'Total Amount', 'Percentage Share', 'Orders/Txns']],
        body: categoryRows.length > 0 ? categoryRows : [['No data', '0', '0%', '0']],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Top Transactions
      const finalY2 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Top Major Expense Outflows', 14, finalY2);

      const topRows = topTransactions.map(t => [
        t.transaction_date,
        t.title,
        t.category?.name || 'Uncategorized',
        t.payment_method,
        `INR ${Number(t.amount).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: finalY2 + 4,
        head: [['Date', 'Transaction Title', 'Category', 'Mode', 'Amount']],
        body: topRows.length > 0 ? topRows : [['No records', '-', '-', '-', '0']],
        theme: 'striped',
        headStyles: { fillColor: [225, 29, 72] },
      });

      // Footer disclaimer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'PaisaWise Platform Statement • Certified accurate based on recorded transactions in Supabase PostgreSQL ledger.',
        14,
        285
      );

      doc.save(`PaisaWise_Report_${dateRange.startDate}_${dateRange.endDate}.pdf`);
    } catch (err) {
      console.error('Failed generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Statements & Month-End Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-grade summaries, category variance, and professional downloadable reports.
          </p>
        </div>

        <Button
          onClick={generatePdfReport}
          variant="primary"
          size="sm"
          isLoading={isGeneratingPdf}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Download PDF Statement
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Net Cash Flow
          </span>
          <h3 className={`text-2xl font-extrabold mt-1 font-mono ${financialSummary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(financialSummary.netCashFlow)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {financialSummary.netCashFlow >= 0 ? 'Cash surplus preserved' : 'Operating cash deficit'}
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Savings Rate
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {financialSummary.savingsRate}%
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            {financialSummary.savingsRate >= 20 ? 'Target achieved (≥20%)' : 'Below 20% target guideline'}
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Daily Burn Rate
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(dailyAverageSpending)} / day
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Averaged across {daysInPeriod} calendar days
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Largest Single Expense
          </span>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">
            {topTransactions.length > 0 ? formatCurrency(topTransactions[0].amount) : '₹0'}
          </h3>
          <span className="text-[11px] text-slate-400 truncate mt-1 block">
            {topTransactions.length > 0 ? topTransactions[0].title : 'None recorded'}
          </span>
        </Card>
      </div>

      {/* Month-over-Month Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Month-over-Month Variance</CardTitle>
          <span className="text-xs text-slate-400">Prior Period vs Current Period</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Financial Stream</th>
                <th className="py-3 px-4 text-right">Prior Period</th>
                <th className="py-3 px-4 text-right">Current Period</th>
                <th className="py-3 px-4 text-right">Absolute Difference</th>
                <th className="py-3 px-4 text-right">Variance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">Total Income</td>
                <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(financialSummary.previousMonthIncome)}</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(financialSummary.totalIncome)}</td>
                <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(financialSummary.totalIncome - financialSummary.previousMonthIncome)}</td>
                <td className="py-3.5 px-4 text-right">
                  <Badge variant={financialSummary.momIncomeChangePct >= 0 ? 'success' : 'warning'}>
                    {financialSummary.momIncomeChangePct > 0 ? '+' : ''}{financialSummary.momIncomeChangePct}%
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">Total Expenses</td>
                <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(financialSummary.previousMonthExpense)}</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">{formatCurrency(financialSummary.totalExpenses)}</td>
                <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(financialSummary.totalExpenses - financialSummary.previousMonthExpense)}</td>
                <td className="py-3.5 px-4 text-right">
                  <Badge variant={financialSummary.momExpenseChangePct <= 0 ? 'success' : 'danger'}>
                    {financialSummary.momExpenseChangePct > 0 ? '+' : ''}{financialSummary.momExpenseChangePct}%
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Breakdown</CardTitle>
          <span className="text-xs text-slate-400">{categorySpending.length} Active Categories</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Outflow Amount</th>
                <th className="py-3 px-4 text-right">Share of Outflow</th>
                <th className="py-3 px-4 text-right">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categorySpending.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-slate-900 dark:text-white">{cat.categoryName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-600 dark:text-slate-300">
                    {cat.percentage}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {cat.transactionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
