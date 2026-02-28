import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

// Define interfaces for different report types
export interface ContributionReportData {
  id: string;
  member_id: string;
  member_name: string;
  tns_number?: string;
  amount: number;
  contribution_date: string;
  contribution_type: string;
  status: string;
}

export interface DisbursementReportData {
  id: string;
  member_id: string;
  member_name: string;
  tns_number?: string;
  amount: number;
  disbursement_date: string;
  reason?: string;
  status: string;
}

export interface BalanceReportData {
  id: string;
  member_id: string;
  member_name: string;
  tns_number?: string;
  current_balance: number;
  total_contributions: number;
  total_disbursements: number;
  last_updated: string;
}

export interface ExpenseReportData {
  id: string;
  amount: number;
  expense_date: string;
  expense_category: string;
  description?: string;
  month_year: string;
}

export interface AuditTrailData {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
  user_id?: string;
  user_email?: string;
  timestamp: string;
  ip_address?: string;
}

// Excel Export Functions
export class ReportGenerator {
  private static addLogo(worksheet: XLSX.WorkSheet) {
    // Add organization header
    worksheet['A1'] = { v: 'TEAM NO STRUGGLE WELFARE GROUP', t: 's' };
    worksheet['A2'] = { v: 'Financial Management System', t: 's' };
    worksheet['A3'] = { v: `Generated on: ${format(new Date(), 'PPpp')}`, t: 's' };
  }

  private static autoSizeColumns(worksheet: XLSX.WorkSheet, data: any[]) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
    const columnWidths: any[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10; // minimum width
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          maxWidth = Math.max(maxWidth, cellLength + 2);
        }
      }
      
      columnWidths[col] = { width: Math.min(maxWidth, 50) }; // cap at 50
    }
    
    worksheet['!cols'] = columnWidths;
  }

  // Contributions Report
  static generateContributionsExcel(data: ContributionReportData[], filters?: { startDate?: string; endDate?: string; memberName?: string }) {
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for worksheet
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Contributions Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [], // Empty row
      ['TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Type', 'Status'], // Headers
      ...data.map(item => [
        item.tns_number || 'N/A',
        item.member_name,
        item.amount,
        format(new Date(item.contribution_date), 'PP'),
        item.contribution_type,
        item.status
      ])
    ];
    
    // Add summary
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    worksheetData.push(
      [], // Empty row
      ['SUMMARY'],
      ['Total Contributions:', totalAmount],
      ['Number of Contributors:', uniqueMembers],
      ['Average per Member:', uniqueMembers > 0 ? (totalAmount / uniqueMembers).toFixed(2) : 0],
      ['Total Records:', data.length]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    // Style the header rows
    worksheet['A1'].s = { font: { bold: true, sz: 16 } };
    worksheet['A2'].s = { font: { bold: true, sz: 14 } };
    worksheet['A6'].s = { font: { bold: true }, fill: { fgColor: { rgb: "D3D3D3" } } };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contributions');
    return workbook;
  }

  // Disbursements Report
  static generateDisbursementsExcel(data: DisbursementReportData[], filters?: { startDate?: string; endDate?: string; memberName?: string }) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Disbursements Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [],
      ['TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Reason', 'Status'],
      ...data.map(item => [
        item.tns_number || 'N/A',
        item.member_name,
        item.amount,
        format(new Date(item.disbursement_date), 'PP'),
        item.reason || 'N/A',
        item.status
      ])
    ];
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Disbursements:', totalAmount],
      ['Number of Recipients:', uniqueMembers],
      ['Average per Recipient:', uniqueMembers > 0 ? (totalAmount / uniqueMembers).toFixed(2) : 0],
      ['Total Records:', data.length]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Disbursements');
    return workbook;
  }

  // Balance Report
  static generateBalancesExcel(data: BalanceReportData[]) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Member Balances Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      [],
      ['TNS Number', 'Member Name', 'Current Balance (KES)', 'Total Contributions (KES)', 'Total Disbursements (KES)', 'Last Updated'],
      ...data.map(item => [
        item.tns_number || 'N/A',
        item.member_name,
        item.current_balance,
        item.total_contributions,
        item.total_disbursements,
        format(new Date(item.last_updated), 'PPp')
      ])
    ];
    
    const totalBalance = data.reduce((sum, item) => sum + item.current_balance, 0);
    const totalContributions = data.reduce((sum, item) => sum + item.total_contributions, 0);
    const totalDisbursements = data.reduce((sum, item) => sum + item.total_disbursements, 0);
    const negativeBalances = data.filter(item => item.current_balance < 0).length;
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Current Balance:', totalBalance],
      ['Total All Contributions:', totalContributions],
      ['Total All Disbursements:', totalDisbursements],
      ['Members with Negative Balance:', negativeBalances],
      ['Total Members:', data.length]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balances');
    return workbook;
  }

  // Expenses Report
  static generateExpensesExcel(data: ExpenseReportData[], filters?: { startDate?: string; endDate?: string; category?: string }) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Monthly Expenses Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [],
      ['Amount (KES)', 'Date', 'Category', 'Description', 'Month-Year'],
      ...data.map(item => [
        item.amount,
        format(new Date(item.expense_date), 'PP'),
        item.expense_category,
        item.description || 'N/A',
        item.month_year
      ])
    ];
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const categories = new Set(data.map(item => item.expense_category));
    const monthlyBreakdown = data.reduce((acc, item) => {
      acc[item.month_year] = (acc[item.month_year] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Expenses:', totalAmount],
      ['Number of Categories:', categories.size],
      ['Average per Entry:', data.length > 0 ? (totalAmount / data.length).toFixed(2) : 0],
      ['Total Records:', data.length],
      [],
      ['MONTHLY BREAKDOWN'],
      ['Month-Year', 'Amount (KES)'],
      ...Object.entries(monthlyBreakdown).map(([month, amount]) => [month, amount])
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
    return workbook;
  }

  // Audit Trail Report
  static generateAuditTrailExcel(data: AuditTrailData[], filters?: { startDate?: string; endDate?: string; action?: string }) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Audit Trail Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [],
      ['Timestamp', 'Action', 'Table', 'Record ID', 'User', 'IP Address'],
      ...data.map(item => [
        format(new Date(item.timestamp), 'PPp'),
        item.action,
        item.table_name,
        item.record_id,
        item.user_email || 'System',
        item.ip_address || 'N/A'
      ])
    ];
    
    const uniqueActions = new Set(data.map(item => item.action));
    const uniqueTables = new Set(data.map(item => item.table_name));
    const uniqueUsers = new Set(data.map(item => item.user_email).filter(Boolean));
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Audit Records:', data.length.toString()],
      ['Unique Actions:', uniqueActions.size.toString()],
      ['Tables Affected:', uniqueTables.size.toString()],
      ['Active Users:', uniqueUsers.size.toString()]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');
    return workbook;
  }

  // Download Excel file
  static downloadExcel(workbook: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  // PDF Generation Functions
  static generateContributionsPDF(data: ContributionReportData[], filters?: { startDate?: string; endDate?: string }) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Contributions Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    if (filters?.startDate || filters?.endDate) {
      doc.text(`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('TNS#', 10, yPosition);
    doc.text('Member Name', 30, yPosition);
    doc.text('Amount', 100, yPosition);
    doc.text('Date', 130, yPosition);
    doc.text('Type', 160, yPosition);
    doc.text('Status', 185, yPosition);
    yPosition += 7;
    
    // Draw line under headers
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.tns_number || 'N/A', 10, yPosition);
      doc.text(item.member_name.substring(0, 25), 30, yPosition);
      doc.text(`KES ${item.amount.toLocaleString()}`, 100, yPosition);
      doc.text(format(new Date(item.contribution_date), 'PP'), 130, yPosition);
      doc.text(item.contribution_type.substring(0, 10), 160, yPosition);
      doc.text(item.status, 185, yPosition);
      yPosition += 6;
    });
    
    // Summary
    yPosition += 10;
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Contributions: KES ${totalAmount.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Number of Contributors: ${uniqueMembers}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Records: ${data.length}`, 10, yPosition);
    
    return doc;
  }

  static generateDisbursementsPDF(data: DisbursementReportData[], filters?: { startDate?: string; endDate?: string }) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Disbursements Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    if (filters?.startDate || filters?.endDate) {
      doc.text(`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('TNS#', 10, yPosition);
    doc.text('Member Name', 30, yPosition);
    doc.text('Amount', 90, yPosition);
    doc.text('Date', 120, yPosition);
    doc.text('Reason', 150, yPosition);
    doc.text('Status', 185, yPosition);
    yPosition += 7;
    
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.tns_number || 'N/A', 10, yPosition);
      doc.text(item.member_name.substring(0, 20), 30, yPosition);
      doc.text(`KES ${item.amount.toLocaleString()}`, 90, yPosition);
      doc.text(format(new Date(item.disbursement_date), 'PP'), 120, yPosition);
      doc.text((item.reason || 'N/A').substring(0, 15), 150, yPosition);
      doc.text(item.status, 185, yPosition);
      yPosition += 6;
    });
    
    // Summary
    yPosition += 10;
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Disbursements: KES ${totalAmount.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Number of Recipients: ${uniqueMembers}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Records: ${data.length}`, 10, yPosition);
    
    return doc;
  }

  static generateBalancesPDF(data: BalanceReportData[]) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Member Balances Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('TNS#', 10, yPosition);
    doc.text('Member Name', 30, yPosition);
    doc.text('Balance', 80, yPosition);
    doc.text('Contributions', 110, yPosition);
    doc.text('Disbursements', 150, yPosition);
    yPosition += 7;
    
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.tns_number || 'N/A', 10, yPosition);
      doc.text(item.member_name.substring(0, 20), 30, yPosition);
      doc.text(`${item.current_balance.toLocaleString()}`, 80, yPosition);
      doc.text(`${item.total_contributions.toLocaleString()}`, 110, yPosition);
      doc.text(`${item.total_disbursements.toLocaleString()}`, 150, yPosition);
      yPosition += 6;
    });
    
    // Summary
    yPosition += 10;
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    const totalBalance = data.reduce((sum, item) => sum + item.current_balance, 0);
    const totalContributions = data.reduce((sum, item) => sum + item.total_contributions, 0);
    const totalDisbursements = data.reduce((sum, item) => sum + item.total_disbursements, 0);
    const negativeBalances = data.filter(item => item.current_balance < 0).length;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Balance: KES ${totalBalance.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Contributions: KES ${totalContributions.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Disbursements: KES ${totalDisbursements.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Members with Negative Balance: ${negativeBalances}`, 10, yPosition);
    
    return doc;
  }

  // Download PDF file
  static downloadPDF(doc: jsPDF, filename: string) {
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // Expenses Report PDF
  static generateExpensesPDF(data: any[], options: { startDate?: string; endDate?: string } = {}) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Expense Audit Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    if (options.startDate || options.endDate) {
      doc.text(`Period: ${options.startDate || 'Start'} to ${options.endDate || 'Present'}`, 105, yPosition, { align: 'center' });
      yPosition += 10;
    }
    
    // Summary Statistics
    const totalExpenses = data.length;
    const totalAmount = data.reduce((sum, e) => sum + e.amount, 0);
    const approvedCount = data.filter(e => e.approved_by).length;
    const pendingAmount = data.filter(e => !e.approved_by).reduce((sum, e) => sum + e.amount, 0);
    
    // Category breakdown
    const categoryTotals = data.reduce((acc, e) => {
      acc[e.expense_category] = (acc[e.expense_category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Expenses: ${totalExpenses}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Total Amount: KES ${totalAmount.toLocaleString()}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Approved: ${approvedCount} (${((approvedCount/totalExpenses)*100).toFixed(1)}%)`, 14, yPosition);
    yPosition += 6;
    doc.text(`Pending Amount: KES ${pendingAmount.toLocaleString()}`, 14, yPosition);
    yPosition += 10;
    
    // Category breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      doc.text(`${category}: KES ${amount.toLocaleString()}`, 14, yPosition);
      yPosition += 6;
    });
    
    // Table headers
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 14, yPosition);
    doc.text('Amount', 90, yPosition);
    doc.text('Category', 130, yPosition);
    doc.text('Status', 180, yPosition);
    yPosition += 7;
    
    doc.line(14, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((expense) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const desc = (expense.description || 'N/A').substring(0, 30);
      doc.text(desc, 14, yPosition);
      doc.text(`KES ${expense.amount.toLocaleString()}`, 90, yPosition);
      doc.text(expense.expense_category.substring(0, 15), 130, yPosition);
      doc.text(expense.approved_by ? 'Approved' : 'Pending', 180, yPosition);
      yPosition += 6;
    });
    
    return doc;
  }

  // Anomalies Detection PDF
  static generateAnomaliesPDF(anomalies: any[], metrics: any) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Audit Anomalies Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 8;
    doc.text(`Risk Score: ${metrics.riskScore}% | Compliance: ${metrics.complianceScore}%`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Executive Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Anomalies Detected: ${anomalies.length}`, 14, yPosition);
    yPosition += 6;
    
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;
    const infoCount = anomalies.filter(a => a.severity === 'info').length;
    
    doc.text(`Critical: ${criticalCount} | Warning: ${warningCount} | Info: ${infoCount}`, 14, yPosition);
    yPosition += 12;
    
    // Financial Health Indicators
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Health', 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Net Position: KES ${metrics.netPosition.toLocaleString()}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Discrepancies Found: ${metrics.discrepanciesFound}`, 14, yPosition);
    yPosition += 6;
    
    const disbursementRatio = ((metrics.totalDisbursements / metrics.totalContributions) * 100).toFixed(1);
    const expenseRatio = ((metrics.totalExpenses / metrics.totalContributions) * 100).toFixed(1);
    
    doc.text(`Disbursement Ratio: ${disbursementRatio}%`, 14, yPosition);
    yPosition += 6;
    doc.text(`Expense Ratio: ${expenseRatio}%`, 14, yPosition);
    yPosition += 12;
    
    // Anomalies Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detected Anomalies', 14, yPosition);
    yPosition += 10;
    
    // Table headers
    doc.setFontSize(9);
    doc.text('Type', 14, yPosition);
    doc.text('Severity', 50, yPosition);
    doc.text('Description', 80, yPosition);
    yPosition += 7;
    
    doc.line(14, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    anomalies.forEach((anomaly) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(anomaly.type.substring(0, 20), 14, yPosition);
      doc.text(anomaly.severity, 50, yPosition);
      
      const desc = (anomaly.description || 'N/A').substring(0, 60);
      doc.text(desc, 80, yPosition);
      yPosition += 6;
      
      if (anomaly.recommendation) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Rec: ${anomaly.recommendation.substring(0, 80)}`, 80, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 6;
      }
    });
    
    return doc;
  }

  // Dashboard Summary PDF
  static generateDashboardPDF(metrics: any, trends: any[], risks: any[]) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Audit Dashboard Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Key Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Financial Metrics', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const metricsData = [
      ['Total Contributions', `KES ${metrics.totalContributions.toLocaleString()}`],
      ['Total Disbursements', `KES ${metrics.totalDisbursements.toLocaleString()}`],
      ['Total Expenses', `KES ${metrics.totalExpenses.toLocaleString()}`],
      ['Net Position', `KES ${metrics.netPosition.toLocaleString()}`],
      ['Member Count', metrics.memberCount.toString()],
      ['Active Members', metrics.activeMembers.toString()],
      ['Risk Score', `${metrics.riskScore}%`],
      ['Compliance Score', `${metrics.complianceScore}%`]
    ];
    
    metricsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, yPosition);
      yPosition += 6;
    });
    
    // Risk Areas
    if (risks.length > 0) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Areas', 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      risks.forEach((risk) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${risk.type} (${risk.impact}):`, 14, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        const desc = (risk.description || 'N/A').substring(0, 80);
        doc.text(desc, 14, yPosition);
        yPosition += 6;
        
        if (risk.recommendation) {
          doc.setFont('helvetica', 'italic');
          doc.text(`→ ${risk.recommendation.substring(0, 80)}`, 14, yPosition);
          doc.setFont('helvetica', 'normal');
          yPosition += 8;
        }
      });
    }
    
    // Monthly Trends
    if (trends.length > 0) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Trends', 14, yPosition);
      yPosition += 10;
      
      // Table headers
      doc.setFontSize(9);
      doc.text('Month', 14, yPosition);
      doc.text('Contributions', 50, yPosition);
      doc.text('Disbursements', 100, yPosition);
      doc.text('Expenses', 150, yPosition);
      doc.text('Net', 180, yPosition);
      yPosition += 7;
      
      doc.line(14, yPosition, 200, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      trends.forEach((trend) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(trend.month, 14, yPosition);
        doc.text(trend.contributions.toLocaleString(), 50, yPosition);
        doc.text(trend.disbursements.toLocaleString(), 100, yPosition);
        doc.text(trend.expenses.toLocaleString(), 150, yPosition);
        doc.text(trend.net.toLocaleString(), 180, yPosition);
        yPosition += 6;
      });
    }
    
    return doc;
  }

  // Audit Trail PDF
  static generateAuditTrailPDF(data: AuditTrailData[], filters?: { startDate?: string; endDate?: string; action?: string }) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Audit Trail Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    if (filters?.startDate || filters?.endDate) {
      doc.text(`Period: ${filters?.startDate || 'Start'} to ${filters?.endDate || 'Present'}`, 105, yPosition, { align: 'center' });
      yPosition += 10;
    }
    
    // Summary Statistics
    const uniqueActions = new Set(data.map(item => item.action));
    const uniqueTables = new Set(data.map(item => item.table_name));
    const uniqueUsers = new Set(data.map(item => item.user_email).filter(Boolean));
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Audit Records: ${data.length}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Unique Actions: ${uniqueActions.size}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Tables Affected: ${uniqueTables.size}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Active Users: ${uniqueUsers.size}`, 14, yPosition);
    yPosition += 12;
    
    // Action Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Breakdown', 14, yPosition);
    yPosition += 8;
    
    const actionCounts: Record<string, number> = {};
    data.forEach(item => {
      actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
    });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    Object.entries(actionCounts).slice(0, 5).forEach(([action, count]) => {
      doc.text(`${action}: ${count} actions`, 14, yPosition);
      yPosition += 5;
    });
    
    yPosition += 8;
    
    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Timestamp', 14, yPosition);
    doc.text('Action', 55, yPosition);
    doc.text('Table', 90, yPosition);
    doc.text('User', 120, yPosition);
    doc.text('IP Address', 165, yPosition);
    yPosition += 7;
    
    doc.line(14, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    data.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const timestamp = format(new Date(item.timestamp), 'MM/dd HH:mm');
      doc.text(timestamp, 14, yPosition);
      doc.text(item.action.substring(0, 15), 55, yPosition);
      doc.text(item.table_name.substring(0, 12), 90, yPosition);
      doc.text((item.user_email || 'System').substring(0, 20), 120, yPosition);
      doc.text((item.ip_address || 'N/A').substring(0, 15), 165, yPosition);
      yPosition += 6;
    });
    
    // Footer
    yPosition += 10;
    doc.line(14, yPosition, 200, yPosition);
    yPosition += 8;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This report contains sensitive audit information - Handle with care', 105, yPosition, { align: 'center' });
    
    return doc;
  }

  // Comprehensive Financial Summary Report
  static generateFinancialSummaryPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    expenses: ExpenseReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('COMPREHENSIVE FINANCIAL SUMMARY REPORT', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 8;
    
    if (data.period.startDate || data.period.endDate) {
      doc.text(`Period: ${data.period.startDate || 'All'} to ${data.period.endDate || 'All'}`, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Executive Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EXECUTIVE SUMMARY', 10, yPosition);
    yPosition += 10;
    
    const totalContributions = data.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalDisbursements = data.disbursements.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netPosition = totalContributions - totalDisbursements - totalExpenses;
    const totalBalance = data.balances.reduce((sum, b) => sum + b.current_balance, 0);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Contributions: KES ${totalContributions.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Total Disbursements: KES ${totalDisbursements.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Total Expenses: KES ${totalExpenses.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Net Financial Position: KES ${netPosition.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Total Member Balances: KES ${totalBalance.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Active Members: ${new Set(data.contributions.map(c => c.member_id)).size}`, 15, yPosition);
    yPosition += 15;

    // Financial Health Indicators
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FINANCIAL HEALTH INDICATORS', 10, yPosition);
    yPosition += 8;
    
    const disbursementRatio = totalContributions > 0 ? (totalDisbursements / totalContributions * 100) : 0;
    const expenseRatio = totalContributions > 0 ? (totalExpenses / totalContributions * 100) : 0;
    const participationRate = data.balances.length > 0 ? (new Set(data.contributions.map(c => c.member_id)).size / data.balances.length * 100) : 0;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Disbursement Ratio: ${disbursementRatio.toFixed(1)}%`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Expense Ratio: ${expenseRatio.toFixed(1)}%`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Member Participation Rate: ${participationRate.toFixed(1)}%`, 15, yPosition);
    yPosition += 6;
    
    const negativeBalances = data.balances.filter(b => b.current_balance < 0).length;
    doc.text(`• Members with Negative Balances: ${negativeBalances}`, 15, yPosition);
    yPosition += 15;

    // Risk Assessment
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RISK ASSESSMENT', 10, yPosition);
    yPosition += 8;
    
    let riskScore = 100;
    if (disbursementRatio > 80) riskScore -= 20;
    if (expenseRatio > 10) riskScore -= 15;
    if (negativeBalances > data.balances.length * 0.1) riskScore -= 25;
    if (participationRate < 70) riskScore -= 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Overall Risk Score: ${riskScore}/100`, 15, yPosition);
    yPosition += 6;
    
    let riskLevel = 'Low';
    if (riskScore < 50) riskLevel = 'High';
    else if (riskScore < 70) riskLevel = 'Medium';
    
    doc.text(`• Risk Level: ${riskLevel}`, 15, yPosition);
    yPosition += 15;

    // Recommendations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RECOMMENDATIONS', 10, yPosition);
    yPosition += 8;
    
    const recommendations = [];
    if (disbursementRatio > 80) recommendations.push('Monitor high disbursement ratio');
    if (expenseRatio > 10) recommendations.push('Review and optimize expenses');
    if (negativeBalances > 0) recommendations.push('Address negative member balances');
    if (participationRate < 80) recommendations.push('Improve member participation');
    if (recommendations.length === 0) recommendations.push('Continue current practices');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    recommendations.forEach(rec => {
      doc.text(`• ${rec}`, 15, yPosition);
      yPosition += 6;
    });

    return doc;
  }

  // Member Activity Report
  static generateMemberActivityPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('MEMBER ACTIVITY REPORT', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Member Statistics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MEMBER STATISTICS', 10, yPosition);
    yPosition += 10;
    
    const activeMembers = new Set(data.contributions.map(c => c.member_id)).size;
    const totalMembers = data.balances.length;
    const avgContribution = data.contributions.length > 0 ? data.contributions.reduce((sum, c) => sum + c.amount, 0) / data.contributions.length : 0;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Registered Members: ${totalMembers}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Active Contributors: ${activeMembers}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Participation Rate: ${totalMembers > 0 ? (activeMembers / totalMembers * 100).toFixed(1) : 0}%`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Average Contribution per Transaction: KES ${avgContribution.toFixed(0)}`, 15, yPosition);
    yPosition += 15;

    // Activity Analysis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ACTIVITY ANALYSIS', 10, yPosition);
    yPosition += 8;
    
    const contributorActivity = new Map();
    data.contributions.forEach(c => {
      const key = c.member_name;
      if (!contributorActivity.has(key)) {
        contributorActivity.set(key, { contributions: 0, amount: 0 });
      }
      const current = contributorActivity.get(key);
      contributorActivity.set(key, {
        contributions: current.contributions + 1,
        amount: current.amount + c.amount
      });
    });
    
    const topContributors = Array.from(contributorActivity.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Top 5 Contributors by Amount:', 15, yPosition);
    yPosition += 6;
    
    topContributors.forEach(([name, stats], index) => {
      doc.text(`${index + 1}. ${name}: KES ${stats.amount.toLocaleString()} (${stats.contributions} transactions)`, 20, yPosition);
      yPosition += 5;
    });

    return doc;
  }

  // Compliance Audit Report
  static generateCompliancePDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    auditTrail: AuditTrailData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('COMPLIANCE AUDIT REPORT', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Compliance Checklist
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('COMPLIANCE ASSESSMENT', 10, yPosition);
    yPosition += 10;
    
    const confirmedContributions = data.contributions.filter(c => c.status === 'confirmed').length;
    const approvedDisbursements = data.disbursements.filter(d => d.status === 'approved').length;
    
    const complianceScore = (
      (confirmedContributions / data.contributions.length * 25) +
      (approvedDisbursements / data.disbursements.length * 25) +
      (data.auditTrail.length > 0 ? 25 : 0) +
      25 // Base compliance score
    );
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Overall Compliance Score: ${complianceScore.toFixed(0)}/100`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Confirmed Contributions: ${confirmedContributions}/${data.contributions.length}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Approved Disbursements: ${approvedDisbursements}/${data.disbursements.length}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Audit Trail Records: ${data.auditTrail.length}`, 15, yPosition);
    yPosition += 15;

    // Risk Factors
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('IDENTIFIED RISKS', 10, yPosition);
    yPosition += 8;
    
    const pendingContributions = data.contributions.filter(c => c.status === 'pending').length;
    const pendingDisbursements = data.disbursements.filter(d => d.status === 'pending').length;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (pendingContributions > 0) {
      doc.text(`• ${pendingContributions} pending contributions require attention`, 15, yPosition);
      yPosition += 6;
    }
    
    if (pendingDisbursements > 0) {
      doc.text(`• ${pendingDisbursements} pending disbursements require approval`, 15, yPosition);
      yPosition += 6;
    }
    
    if (pendingContributions === 0 && pendingDisbursements === 0) {
      doc.text('• No immediate compliance risks identified', 15, yPosition);
      yPosition += 6;
    }

    return doc;
  }

  // Risk Assessment Report
  static generateRiskAssessmentPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    expenses: ExpenseReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('RISK ASSESSMENT REPORT', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Risk Analysis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RISK ANALYSIS', 10, yPosition);
    yPosition += 10;
    
    const totalContributions = data.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalDisbursements = data.disbursements.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const negativeBalances = data.balances.filter(b => b.current_balance < 0);
    
    // Calculate risk factors
    const riskFactors = {
      financialRatio: totalContributions > 0 ? (totalDisbursements + totalExpenses) / totalContributions : 0,
      negativeBalanceRatio: data.balances.length > 0 ? negativeBalances.length / data.balances.length : 0,
      largeTransactions: data.disbursements.filter(d => d.amount > 50000).length,
      pendingItems: data.contributions.filter(c => c.status === 'pending').length + data.disbursements.filter(d => d.status === 'pending').length
    };
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Financial Outflow Ratio: ${(riskFactors.financialRatio * 100).toFixed(1)}%`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Negative Balance Rate: ${(riskFactors.negativeBalanceRatio * 100).toFixed(1)}%`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Large Transactions (>50k): ${riskFactors.largeTransactions}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Pending Items: ${riskFactors.pendingItems}`, 15, yPosition);
    yPosition += 15;

    // Risk Score Calculation
    let riskScore = 0;
    if (riskFactors.financialRatio > 0.9) riskScore += 30;
    else if (riskFactors.financialRatio > 0.7) riskScore += 15;
    
    if (riskFactors.negativeBalanceRatio > 0.2) riskScore += 25;
    else if (riskFactors.negativeBalanceRatio > 0.1) riskScore += 10;
    
    if (riskFactors.largeTransactions > 5) riskScore += 20;
    if (riskFactors.pendingItems > 10) riskScore += 15;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RISK LEVEL ASSESSMENT', 10, yPosition);
    yPosition += 8;
    
    let riskLevel = 'Low';
    let riskColor = 'Green';
    if (riskScore > 60) {
      riskLevel = 'High';
      riskColor = 'Red';
    } else if (riskScore > 30) {
      riskLevel = 'Medium';
      riskColor = 'Yellow';
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Risk Score: ${riskScore}/100`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Risk Level: ${riskLevel} (${riskColor})`, 15, yPosition);
    yPosition += 15;

    // Recommendations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RISK MITIGATION RECOMMENDATIONS', 10, yPosition);
    yPosition += 8;
    
    const recommendations = [];
    if (riskFactors.financialRatio > 0.8) recommendations.push('Monitor cash flow closely');
    if (riskFactors.negativeBalanceRatio > 0.1) recommendations.push('Address negative member balances');
    if (riskFactors.largeTransactions > 3) recommendations.push('Review large transaction approvals');
    if (riskFactors.pendingItems > 5) recommendations.push('Clear pending items promptly');
    if (recommendations.length === 0) recommendations.push('Continue monitoring current risk levels');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    recommendations.forEach(rec => {
      doc.text(`• ${rec}`, 15, yPosition);
      yPosition += 6;
    });

    return doc;
  }

  // Treasury Summary Report
  static generateTreasurySummaryPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    expenses: ExpenseReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('TREASURY SUMMARY REPORT', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prepared for: Treasurer Review`, 105, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Financial Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FINANCIAL POSITION', 10, yPosition);
    yPosition += 10;
    
    const totalContributions = data.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalDisbursements = data.disbursements.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netCashFlow = totalContributions - totalDisbursements - totalExpenses;
    const totalMemberBalances = data.balances.reduce((sum, b) => sum + b.current_balance, 0);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Contributions Received: KES ${totalContributions.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Total Disbursements Made: KES ${totalDisbursements.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Total Operating Expenses: KES ${totalExpenses.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Net Cash Flow: KES ${netCashFlow.toLocaleString()}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Total Member Account Balances: KES ${totalMemberBalances.toLocaleString()}`, 15, yPosition);
    yPosition += 15;

    // Key Performance Indicators
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KEY PERFORMANCE INDICATORS', 10, yPosition);
    yPosition += 8;
    
    const activeMembers = new Set(data.contributions.map(c => c.member_id)).size;
    const avgContribution = activeMembers > 0 ? totalContributions / activeMembers : 0;
    const expenseRatio = totalContributions > 0 ? (totalExpenses / totalContributions * 100) : 0;
    const liquidityRatio = totalMemberBalances > 0 ? (netCashFlow / totalMemberBalances * 100) : 0;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Active Contributing Members: ${activeMembers}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Average Contribution per Member: KES ${avgContribution.toFixed(0)}`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Operating Expense Ratio: ${expenseRatio.toFixed(1)}%`, 15, yPosition);
    yPosition += 6;
    doc.text(`• Liquidity Ratio: ${liquidityRatio.toFixed(1)}%`, 15, yPosition);
    yPosition += 15;

    // Treasury Recommendations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TREASURER RECOMMENDATIONS', 10, yPosition);
    yPosition += 8;
    
    const recommendations = [];
    if (netCashFlow < 0) recommendations.push('Address negative cash flow situation');
    if (expenseRatio > 15) recommendations.push('Review and optimize operating expenses');
    if (liquidityRatio < 20) recommendations.push('Improve liquidity position');
    if (activeMembers < data.balances.length * 0.8) recommendations.push('Encourage member participation');
    if (recommendations.length === 0) recommendations.push('Maintain current financial management practices');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    recommendations.forEach(rec => {
      doc.text(`• ${rec}`, 15, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('This report is confidential and intended for treasury use only.', 105, yPosition, { align: 'center' });

    return doc;
  }
}
