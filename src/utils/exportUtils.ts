import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  tns_number?: string;
  maturity_status: string;
  days_to_maturity?: number;
  profile_picture_url?: string;
  address: string;
  zip_code: string;
  alternative_phone?: string;
  id_number?: string;
  sex?: string;
  marital_status?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  membership_type: string;
  registration_status: string;
  payment_status: string;
  registration_date?: string;
  probation_end_date?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemberBalance {
  current_balance: number;
  total_contributions: number;
  total_disbursements: number;
}

export interface Contribution {
  amount: number;
  contribution_date: string;
  contribution_type: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  includeFinancialData: boolean;
  includeContributions: boolean;
  includeSummary: boolean;
  filterByArea?: string;
  customFileName?: string;
  reportTitle?: string;
}

export interface ExportData {
  members: Member[];
  balances: Record<string, MemberBalance>;
  contributions: Record<string, Contribution[]>;
  coordinatorName: string;
  assignedArea: string;
  exportDate: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const generatePDFReport = (data: ExportData, options: ExportOptions): void => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Title and Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const title = options.reportTitle || 'Team No Struggle - Members Report';
  doc.text(title, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Coordinator: ${data.coordinatorName}`, margin, 45);
  doc.text(`Area: ${data.assignedArea}`, margin, 52);
  doc.text(`Generated: ${data.exportDate}`, margin, 59);
  doc.text(`Total Members: ${data.members.length}`, pageWidth - margin - 50, 45);
  
  // Filter information
  if (options.filterByArea && options.filterByArea !== 'all') {
    doc.text(`Filtered by: ${options.filterByArea}`, pageWidth - margin - 50, 52);
  }
  
  let yPosition = 75;
  
  // Summary Section
  if (options.includeSummary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', margin, yPosition);
    yPosition += 10;
    
    const totalContributions = data.members.reduce((sum, member) => 
      sum + (data.balances[member.id]?.total_contributions || 0), 0
    );
    const averageContribution = data.members.length > 0 ? totalContributions / data.members.length : 0;
    const approvedMembers = data.members.filter(m => m.registration_status === 'approved').length;
    const matureMembers = data.members.filter(m => m.maturity_status === 'mature').length;
    const paidMembers = data.members.filter(m => m.payment_status === 'paid').length;
    
    const summaryData = [
      ['Total Members', data.members.length.toString()],
      ['Approved Members', approvedMembers.toString()],
      ['Mature Members', matureMembers.toString()],
      ['Paid Members', paidMembers.toString()],
      ['Total Contributions', formatCurrency(totalContributions)],
      ['Average Contribution', formatCurrency(averageContribution)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { left: margin, right: margin },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Members Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = 30;
  }
  
  doc.text('Members List', margin, yPosition);
  yPosition += 10;
  
  // Prepare member data
  const memberTableData = data.members.map(member => {
    const balance = data.balances[member.id];
    const row = [
      member.tns_number || 'N/A',
      `${member.first_name} ${member.last_name}`,
      `${member.city}, ${member.state}`,
      member.phone,
      member.registration_status,
      member.maturity_status,
      member.payment_status
    ];
    
    if (options.includeFinancialData && balance) {
      row.push(
        formatCurrency(balance.current_balance),
        formatCurrency(balance.total_contributions)
      );
    }
    
    return row;
  });
  
  const memberHeaders = [
    'TNS #',
    'Name',
    'Location',
    'Phone',
    'Status',
    'Maturity',
    'Payment'
  ];
  
  if (options.includeFinancialData) {
    memberHeaders.push('Balance', 'Total Contributions');
  }
  
  autoTable(doc, {
    startY: yPosition,
    head: [memberHeaders],
    body: memberTableData,
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 20 }
    }
  });
  
  // Area-wise Summary (if not filtered by specific area)
  if (!options.filterByArea || options.filterByArea === 'all') {
    const areaStats = new Map<string, {
      members: number;
      totalContributions: number;
      averageContribution: number;
      approvedMembers: number;
    }>();
    
    data.members.forEach(member => {
      const area = `${member.city}, ${member.state}`;
      const balance = data.balances[member.id];
      
      if (!areaStats.has(area)) {
        areaStats.set(area, {
          members: 0,
          totalContributions: 0,
          averageContribution: 0,
          approvedMembers: 0
        });
      }
      
      const stats = areaStats.get(area)!;
      stats.members++;
      stats.totalContributions += balance?.total_contributions || 0;
      if (member.registration_status === 'approved') stats.approvedMembers++;
    });
    
    // Calculate averages
    areaStats.forEach(stats => {
      stats.averageContribution = stats.members > 0 ? stats.totalContributions / stats.members : 0;
    });
    
    if (areaStats.size > 1) {
      doc.addPage();
      yPosition = 30;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Area-wise Summary', margin, yPosition);
      yPosition += 10;
      
      const areaTableData = Array.from(areaStats.entries()).map(([area, stats]) => [
        area,
        stats.members.toString(),
        stats.approvedMembers.toString(),
        formatCurrency(stats.totalContributions),
        formatCurrency(stats.averageContribution)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Area', 'Total Members', 'Approved', 'Total Contributions', 'Avg Contribution']],
        body: areaTableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: margin, right: margin }
      });
    }
  }
  
  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages} | Generated by Team No Struggle System`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = options.customFileName || 
    `TNS_Members_Report_${data.assignedArea.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

export const generateExcelReport = (data: ExportData, options: ExportOptions): void => {
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  if (options.includeSummary) {
    const totalContributions = data.members.reduce((sum, member) => 
      sum + (data.balances[member.id]?.total_contributions || 0), 0
    );
    const averageContribution = data.members.length > 0 ? totalContributions / data.members.length : 0;
    const approvedMembers = data.members.filter(m => m.registration_status === 'approved').length;
    const matureMembers = data.members.filter(m => m.maturity_status === 'mature').length;
    const paidMembers = data.members.filter(m => m.payment_status === 'paid').length;
    
    const summaryData = [
      ['Team No Struggle - Members Report'],
      [''],
      ['Report Details', ''],
      ['Coordinator', data.coordinatorName],
      ['Area', data.assignedArea],
      ['Generated', data.exportDate],
      ['Filter Applied', options.filterByArea && options.filterByArea !== 'all' ? options.filterByArea : 'None'],
      [''],
      ['Summary Statistics', ''],
      ['Total Members', data.members.length],
      ['Approved Members', approvedMembers],
      ['Pending Members', data.members.length - approvedMembers],
      ['Mature Members', matureMembers],
      ['Paid Members', paidMembers],
      ['Total Contributions (KES)', totalContributions],
      ['Average Contribution (KES)', averageContribution]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet['!cols'] = [
      { width: 25 },
      { width: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
  
  // Members Sheet
  const memberData: (string | number)[][] = [
    [
      'TNS Number',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Alternative Phone',
      'City',
      'State',
      'Address',
      'Zip Code',
      'ID Number',
      'Sex',
      'Marital Status',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Membership Type',
      'Registration Status',
      'Payment Status',
      'Maturity Status',
      'Days to Maturity',
      'Registration Date',
      ...(options.includeFinancialData ? ['Current Balance (KES)', 'Total Contributions (KES)', 'Total Disbursements (KES)'] : [])
    ]
  ];
  
  data.members.forEach(member => {
    const balance = data.balances[member.id];
    const row: (string | number)[] = [
      member.tns_number || '',
      member.first_name,
      member.last_name,
      member.email,
      member.phone,
      member.alternative_phone || '',
      member.city,
      member.state,
      member.address,
      member.zip_code,
      member.id_number || '',
      member.sex || '',
      member.marital_status || '',
      member.emergency_contact_name,
      member.emergency_contact_phone,
      member.membership_type,
      member.registration_status,
      member.payment_status,
      member.maturity_status,
      member.days_to_maturity?.toString() || '',
      member.registration_date ? formatDate(member.registration_date) : ''
    ];
    
    if (options.includeFinancialData && balance) {
      row.push(
        balance.current_balance,
        balance.total_contributions,
        balance.total_disbursements
      );
    }
    
    memberData.push(row);
  });
  
  const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
  
  // Set column widths
  const memberCols = [
    { width: 15 }, // TNS Number
    { width: 15 }, // First Name
    { width: 15 }, // Last Name
    { width: 25 }, // Email
    { width: 15 }, // Phone
    { width: 15 }, // Alt Phone
    { width: 15 }, // City
    { width: 15 }, // State
    { width: 30 }, // Address
    { width: 10 }, // Zip Code
    { width: 15 }, // ID Number
    { width: 10 }, // Sex
    { width: 15 }, // Marital Status
    { width: 20 }, // Emergency Contact Name
    { width: 15 }, // Emergency Contact Phone
    { width: 15 }, // Membership Type
    { width: 15 }, // Registration Status
    { width: 15 }, // Payment Status
    { width: 15 }, // Maturity Status
    { width: 15 }, // Days to Maturity
    { width: 15 }, // Registration Date
  ];
  
  if (options.includeFinancialData) {
    memberCols.push(
      { width: 15 }, // Current Balance
      { width: 18 }, // Total Contributions
      { width: 18 }  // Total Disbursements
    );
  }
  
  memberSheet['!cols'] = memberCols;
  XLSX.utils.book_append_sheet(workbook, memberSheet, 'Members');
  
  // Contributions Sheet
  if (options.includeContributions && Object.keys(data.contributions).length > 0) {
    const contributionsData = [
      ['TNS Number', 'Member Name', 'Contribution Date', 'Amount (KES)', 'Contribution Type']
    ];
    
    data.members.forEach(member => {
      const memberContributions = data.contributions[member.id] || [];
      memberContributions.forEach(contribution => {
        contributionsData.push([
          member.tns_number || '',
          `${member.first_name} ${member.last_name}`,
          formatDate(contribution.contribution_date),
          contribution.amount.toString(),
          contribution.contribution_type
        ]);
      });
    });
    
    const contributionsSheet = XLSX.utils.aoa_to_sheet(contributionsData);
    contributionsSheet['!cols'] = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, contributionsSheet, 'Contributions');
  }
  
  // Area Summary Sheet (if not filtered by specific area)
  if (!options.filterByArea || options.filterByArea === 'all') {
    const areaStats = new Map<string, {
      members: number;
      totalContributions: number;
      averageContribution: number;
      approvedMembers: number;
      matureMembers: number;
      paidMembers: number;
    }>();
    
    data.members.forEach(member => {
      const area = `${member.city}, ${member.state}`;
      const balance = data.balances[member.id];
      
      if (!areaStats.has(area)) {
        areaStats.set(area, {
          members: 0,
          totalContributions: 0,
          averageContribution: 0,
          approvedMembers: 0,
          matureMembers: 0,
          paidMembers: 0
        });
      }
      
      const stats = areaStats.get(area)!;
      stats.members++;
      stats.totalContributions += balance?.total_contributions || 0;
      if (member.registration_status === 'approved') stats.approvedMembers++;
      if (member.maturity_status === 'mature') stats.matureMembers++;
      if (member.payment_status === 'paid') stats.paidMembers++;
    });
    
    // Calculate averages
    areaStats.forEach(stats => {
      stats.averageContribution = stats.members > 0 ? stats.totalContributions / stats.members : 0;
    });
    
    const areaData = [
      ['Area', 'Total Members', 'Approved', 'Mature', 'Paid', 'Total Contributions (KES)', 'Average Contribution (KES)']
    ];
    
    Array.from(areaStats.entries()).forEach(([area, stats]) => {
      areaData.push([
        area,
        stats.members.toString(),
        stats.approvedMembers.toString(),
        stats.matureMembers.toString(),
        stats.paidMembers.toString(),
        stats.totalContributions.toString(),
        stats.averageContribution.toString()
      ]);
    });
    
    const areaSheet = XLSX.utils.aoa_to_sheet(areaData);
    areaSheet['!cols'] = [
      { width: 20 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 20 },
      { width: 20 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, areaSheet, 'Area Summary');
  }
  
  // Save the Excel file
  const fileName = options.customFileName || 
    `TNS_Members_Report_${data.assignedArea.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportMembersData = (
  members: Member[],
  balances: Record<string, MemberBalance>,
  contributions: Record<string, Contribution[]>,
  coordinatorName: string,
  assignedArea: string,
  options: ExportOptions
): void => {
  const exportData: ExportData = {
    members,
    balances,
    contributions,
    coordinatorName,
    assignedArea,
    exportDate: format(new Date(), 'MMMM dd, yyyy HH:mm')
  };
  
  if (options.format === 'pdf') {
    generatePDFReport(exportData, options);
  } else {
    generateExcelReport(exportData, options);
  }
};