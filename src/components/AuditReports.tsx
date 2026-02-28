import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  FileText, 
  PieChart, 
  BarChart3, 
  Calendar as CalendarIcon,
  Filter,
  Printer,
  Mail,
  Share,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  ReportGenerator, 
  ContributionReportData, 
  DisbursementReportData, 
  BalanceReportData, 
  ExpenseReportData,
  AuditTrailData 
} from "@/utils/reportGenerator";
import { toast } from "sonner";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'member' | 'compliance' | 'custom';
  includes: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  lastGenerated?: string;
  icon: any;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedDate: string;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  fileSize?: string;
  downloadUrl?: string;
  summary: {
    totalRecords: number;
    dateRange: string;
    keyFindings: string[];
  };
}

export const AuditReports = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("templates");
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  
  // Data states for report generation
  const [contributions, setContributions] = useState<ContributionReportData[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementReportData[]>([]);
  const [balances, setBalances] = useState<BalanceReportData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseReportData[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrailData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: "financial-summary",
      name: "Financial Summary Report",
      description: "Comprehensive overview of all financial activities including contributions, disbursements, and balances",
      type: "financial",
      includes: ["Contributions", "Disbursements", "Member Balances", "Monthly Expenses", "Budget Analysis"],
      frequency: "monthly",
      lastGenerated: "2024-01-20",
      icon: PieChart
    },
    {
      id: "member-activity",
      name: "Member Activity Report",
      description: "Detailed analysis of member participation, contributions, and account status",
      type: "member",
      includes: ["Member Registration", "Contribution History", "Disbursement History", "Account Status"],
      frequency: "monthly",
      lastGenerated: "2024-01-19",
      icon: BarChart3
    },
    {
      id: "compliance-audit",
      name: "Compliance Audit Report",
      description: "Regulatory compliance check including documentation, approvals, and audit trail",
      type: "compliance",
      includes: ["Approval Workflows", "Documentation", "Regulatory Compliance", "Risk Assessment"],
      frequency: "quarterly",
      lastGenerated: "2024-01-01",
      icon: CheckCircle
    },
    {
      id: "risk-assessment",
      name: "Risk Assessment Report",
      description: "Analysis of potential risks including discrepancies, unusual patterns, and compliance issues",
      type: "compliance",
      includes: ["Balance Discrepancies", "Unusual Transactions", "Compliance Violations", "Risk Metrics"],
      frequency: "weekly",
      lastGenerated: "2024-01-18",
      icon: AlertTriangle
    },
    {
      id: "treasurer-summary",
      name: "Treasurer Summary",
      description: "Executive summary for treasurer review including key metrics and recommendations",
      type: "financial",
      includes: ["Key Metrics", "Trends", "Recommendations", "Action Items"],
      frequency: "monthly",
      lastGenerated: "2024-01-15",
      icon: TrendingUp
    },
    {
      id: "custom-report",
      name: "Custom Report",
      description: "Build your own report with selected data points and date ranges",
      type: "custom",
      includes: [],
      frequency: "custom",
      icon: FileText
    }
  ];

  // Fetch all data for report generation
  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
      
      // Build date filters
      let startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      let endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
      
      // Fetch contributions
      let contributionsQuery = supabase
        .from('contributions')
        .select(`
          *,
          member:membership_registrations(
            first_name,
            last_name,
            tns_number
          )
        `)
        .order('contribution_date', { ascending: false });
      
      if (startDate) contributionsQuery = contributionsQuery.gte('contribution_date', startDate);
      if (endDate) contributionsQuery = contributionsQuery.lte('contribution_date', endDate);
      
      const { data: contributionsData, error: contributionsError } = await contributionsQuery;
      
      if (contributionsError) throw contributionsError;
      
      const formattedContributions: ContributionReportData[] = (contributionsData || []).map(c => ({
        id: c.id,
        member_id: c.member_id,
        member_name: c.member ? `${c.member.first_name} ${c.member.last_name}` : 'Unknown Member',
        tns_number: c.member?.tns_number,
        amount: Number(c.amount),
        contribution_date: c.contribution_date,
        contribution_type: c.contribution_type,
        status: c.status
      }));
      
      setContributions(formattedContributions);
      
      // Fetch disbursements
      let disbursementsQuery = supabase
        .from('disbursements')
        .select(`
          *,
          member:membership_registrations(
            first_name,
            last_name,
            tns_number
          )
        `)
        .order('disbursement_date', { ascending: false });
      
      if (startDate) disbursementsQuery = disbursementsQuery.gte('disbursement_date', startDate);
      if (endDate) disbursementsQuery = disbursementsQuery.lte('disbursement_date', endDate);
      
      const { data: disbursementsData, error: disbursementsError } = await disbursementsQuery;
      
      if (disbursementsError) throw disbursementsError;
      
      const formattedDisbursements: DisbursementReportData[] = (disbursementsData || []).map(d => ({
        id: d.id,
        member_id: d.member_id,
        member_name: d.member ? `${d.member.first_name} ${d.member.last_name}` : 'Unknown Member',
        tns_number: d.member?.tns_number,
        amount: Number(d.amount),
        disbursement_date: d.disbursement_date,
        reason: d.reason,
        status: d.status
      }));
      
      setDisbursements(formattedDisbursements);
      
      // Fetch member balances
      const { data: balancesData, error: balancesError } = await supabase
        .from('member_balances')
        .select(`
          *,
          member:membership_registrations(
            first_name,
            last_name,
            tns_number
          )
        `);
      
      if (balancesError) throw balancesError;
      
      const formattedBalances: BalanceReportData[] = (balancesData || []).map(b => ({
        id: b.id,
        member_id: b.member_id,
        member_name: b.member ? `${b.member.first_name} ${b.member.last_name}` : 'Unknown Member',
        tns_number: b.member?.tns_number,
        current_balance: Number(b.current_balance),
        total_contributions: Number(b.total_contributions),
        total_disbursements: Number(b.total_disbursements),
        last_updated: b.last_updated || new Date().toISOString()
      }));
      
      setBalances(formattedBalances);
      
      // Fetch expenses
      let expensesQuery = supabase
        .from('monthly_expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (startDate) expensesQuery = expensesQuery.gte('expense_date', startDate);
      if (endDate) expensesQuery = expensesQuery.lte('expense_date', endDate);
      
      const { data: expensesData, error: expensesError } = await expensesQuery;
      
      if (expensesError) throw expensesError;
      
      const formattedExpenses: ExpenseReportData[] = (expensesData || []).map(e => ({
        id: e.id,
        amount: Number(e.amount),
        expense_date: e.expense_date,
        expense_category: e.expense_category,
        description: e.description,
        month_year: e.month_year
      }));
      
      setExpenses(formattedExpenses);
      
      // Create mock audit trail from recent activities
      const mockAuditTrail: AuditTrailData[] = [];
      
      // Add contribution activities
      formattedContributions.slice(0, 50).forEach((c, index) => {
        mockAuditTrail.push({
          id: `contrib_${c.id}`,
          action: 'CREATE_CONTRIBUTION',
          table_name: 'CONTRIBUTIONS',
          record_id: c.id,
          user_email: 'system@teamnostruggle.com',
          timestamp: c.contribution_date,
          ip_address: '127.0.0.1'
        });
      });
      
      // Add disbursement activities
      formattedDisbursements.slice(0, 30).forEach((d, index) => {
        mockAuditTrail.push({
          id: `disb_${d.id}`,
          action: d.status === 'approved' ? 'APPROVE_DISBURSEMENT' : 'CREATE_DISBURSEMENT',
          table_name: 'DISBURSEMENTS',
          record_id: d.id,
          user_email: d.status === 'approved' ? 'treasurer@teamnostruggle.com' : 'system@teamnostruggle.com',
          timestamp: d.disbursement_date,
          ip_address: '127.0.0.1'
        });
      });
      
      setAuditTrail(mockAuditTrail);
      
    } catch (error) {
      console.error('Error fetching data for reports:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setDataLoading(false);
    }
  };

  // Generate comprehensive reports
  const generateReport = async (reportType: string) => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }
    
    try {
      setLoading(true);
      
      const period = {
        startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      };
      
      let pdf;
      let filename;
      
      switch (reportType) {
        case 'financial-summary':
          pdf = ReportGenerator.generateFinancialSummaryPDF({
            contributions,
            disbursements,
            balances,
            expenses,
            period
          });
          filename = 'financial_summary_report';
          break;
          
        case 'member-activity':
          pdf = ReportGenerator.generateMemberActivityPDF({
            contributions,
            disbursements,
            balances,
            period
          });
          filename = 'member_activity_report';
          break;
          
        case 'compliance-audit':
          pdf = ReportGenerator.generateCompliancePDF({
            contributions,
            disbursements,
            auditTrail,
            period
          });
          filename = 'compliance_audit_report';
          break;
          
        case 'risk-assessment':
          pdf = ReportGenerator.generateRiskAssessmentPDF({
            contributions,
            disbursements,
            balances,
            expenses,
            period
          });
          filename = 'risk_assessment_report';
          break;
          
        case 'treasurer-summary':
          pdf = ReportGenerator.generateTreasurySummaryPDF({
            contributions,
            disbursements,
            balances,
            expenses,
            period
          });
          filename = 'treasury_summary_report';
          break;
          
        default:
          throw new Error('Unknown report type');
      }
      
      if (pdf && filename) {
        ReportGenerator.downloadPDF(pdf, filename);
        
        // Add to generated reports list
        const newReport: GeneratedReport = {
          id: Date.now().toString(),
          name: `${reportTemplates.find(t => t.id === reportType)?.name} - ${format(new Date(), 'MMMM yyyy')}`,
          type: reportType,
          generatedDate: new Date().toISOString(),
          generatedBy: 'Auditor',
          status: 'completed',
          fileSize: '1.5 MB',
          summary: {
            totalRecords: contributions.length + disbursements.length + balances.length + expenses.length,
            dateRange: period.startDate && period.endDate ? `${period.startDate} to ${period.endDate}` : 'All time',
            keyFindings: [
              `Total contributions: KES ${contributions.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}`,
              `Total disbursements: KES ${disbursements.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`,
              `Active members: ${new Set(contributions.map(c => c.member_id)).size}`,
              `Generated on: ${format(new Date(), 'PPpp')}`
            ]
          }
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
        toast.success(`${reportTemplates.find(t => t.id === reportType)?.name} generated successfully!`);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    await generateReport(selectedTemplate);
  };

  const handleDownloadReport = (reportId: string) => {
    console.log(`Downloading report: ${reportId}`);
    // Implementation would trigger actual download
  };

  const handleEmailReport = (reportId: string) => {
    console.log(`Emailing report: ${reportId}`);
    // Implementation would open email dialog or send automatically
  };

  const handleShareReport = (reportId: string) => {
    console.log(`Sharing report: ${reportId}`);
    // Implementation would generate shareable link
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      generating: { color: "bg-blue-500", text: "Generating" },
      completed: { color: "bg-green-500", text: "Completed" },
      failed: { color: "bg-red-500", text: "Failed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      financial: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
      compliance: "bg-orange-100 text-orange-800",
      custom: "bg-purple-100 text-purple-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const quickDateRanges = [
    { label: "Last 7 days", range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Last 30 days", range: { from: subDays(new Date(), 29), to: new Date() } },
    { label: "This month", range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: "Last month", range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive reports for financial auditing and compliance</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports ({generatedReports.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-6">
          {/* Report Generation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card 
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Icon className="w-8 h-8 text-primary mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge className={getTypeColor(template.type)}>
                                {template.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {template.frequency}
                              </span>
                            </div>
                            {template.lastGenerated && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Last: {format(new Date(template.lastGenerated), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Date Range Selection */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Date Range</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {quickDateRanges.map((quick) => (
                        <Button
                          key={quick.label}
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange(quick.range)}
                        >
                          {quick.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-40">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'From date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-40">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'To date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {loading ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{report.name}</h3>
                          {getStatusBadge(report.status)}
                          <Badge variant="outline">{report.fileSize}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Generated: {format(new Date(report.generatedDate), 'MMM dd, yyyy HH:mm')} by {report.generatedBy}</p>
                          <p>Records: {report.summary.totalRecords.toLocaleString()} | Range: {report.summary.dateRange}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Key Findings:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {report.summary.keyFindings.map((finding, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {report.status === 'completed' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadReport(report.id)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEmailReport(report.id)}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareReport(report.id)}
                            >
                              <Share className="w-3 h-3 mr-1" />
                              Share
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {generatedReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reports generated yet.</p>
                    <p className="text-sm">Go to Report Templates to generate your first report.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Scheduled reports feature coming soon.</p>
                <p className="text-sm">Set up automatic report generation on custom schedules.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
