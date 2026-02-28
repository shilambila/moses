import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Calculator,
  PieChart,
  BarChart3,
  Target,
  Eye,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { ReportGenerator } from "@/utils/reportGenerator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

interface AuditMetrics {
  totalContributions: number;
  totalDisbursements: number;
  netPosition: number;
  totalExpenses: number;
  memberCount: number;
  activeMembers: number;
  averageContribution: number;
  totalBalance: number;
  riskScore: number;
  complianceScore: number;
  discrepanciesFound: number;
  lastAuditDate: string;
}

interface AuditSummary {
  critical: number;
  warning: number;
  info: number;
  resolved: number;
}

interface AuditDashboardProps {
  metrics: AuditMetrics;
  auditSummary: AuditSummary;
}

interface MonthlyTrend {
  month: string;
  contributions: number;
  disbursements: number;
  expenses: number;
  net: number;
}

export const AuditDashboard = ({ metrics, auditSummary }: AuditDashboardProps) => {
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [riskAreas, setRiskAreas] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<string>("");

  useEffect(() => {
    fetchTrendData();
    identifyRiskAreas();
  }, [metrics]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      
      // Generate last 6 months data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          date: date,
          monthKey: date.toISOString().slice(0, 7) // YYYY-MM
        });
      }

      const trends: MonthlyTrend[] = [];

      for (const monthData of months) {
        // Fetch contributions for the month
        const { data: contributions } = await supabase
          .from('contributions')
          .select('amount')
          .gte('contribution_date', `${monthData.monthKey}-01`)
          .lt('contribution_date', `${monthData.monthKey}-32`);

        // Fetch disbursements for the month  
        const { data: disbursements } = await supabase
          .from('disbursements')
          .select('amount')
          .gte('disbursement_date', `${monthData.monthKey}-01`)
          .lt('disbursement_date', `${monthData.monthKey}-32`);

        // Fetch expenses for the month
        const { data: expenses } = await supabase
          .from('monthly_expenses')
          .select('amount')
          .eq('month_year', monthData.monthKey);

        const monthContributions = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const monthDisbursements = disbursements?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const monthExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const net = monthContributions - monthDisbursements - monthExpenses;

        trends.push({
          month: monthData.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          contributions: monthContributions,
          disbursements: monthDisbursements,
          expenses: monthExpenses,
          net: net
        });
      }

      setMonthlyTrends(trends);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const identifyRiskAreas = () => {
    const risks = [];

    // High disbursement ratio
    const disbursementRatio = (metrics.totalDisbursements / metrics.totalContributions) * 100;
    if (disbursementRatio > 80) {
      risks.push({
        type: 'High Risk',
        description: `Disbursement ratio is ${disbursementRatio.toFixed(1)}% - exceeds recommended 80%`,
        impact: 'Critical',
        recommendation: 'Review disbursement policies and approval processes'
      });
    }

    // High expense ratio
    const expenseRatio = (metrics.totalExpenses / metrics.totalContributions) * 100;
    if (expenseRatio > 10) {
      risks.push({
        type: 'Medium Risk',
        description: `Expense ratio is ${expenseRatio.toFixed(1)}% - exceeds recommended 10%`,
        impact: 'Warning',
        recommendation: 'Review operational expenses and cost control measures'
      });
    }

    // Low member participation
    const participationRate = ((metrics.activeMembers / metrics.memberCount) * 100) || 0;
    if (participationRate < 70) {
      risks.push({
        type: 'Medium Risk',
        description: `Active member participation is ${participationRate.toFixed(1)}% - below target 70%`,
        impact: 'Warning',
        recommendation: 'Implement member engagement and activation programs'
      });
    }

    // Negative net position
    if (metrics.netPosition < 0) {
      risks.push({
        type: 'High Risk',
        description: `Negative net position of KES ${Math.abs(metrics.netPosition).toLocaleString()}`,
        impact: 'Critical',
        recommendation: 'Immediate action required to improve financial position'
      });
    }

    setRiskAreas(risks);
  };

  const exportDashboardReport = async () => {
    try {
      setExportLoading("csv");
      
      const csvContent = [
        ['Audit Dashboard Report'],
        ['Generated At', new Date().toLocaleString()],
        [''],
        ['Financial Metrics'],
        ['Total Contributions', `KES ${metrics.totalContributions.toLocaleString()}`],
        ['Total Disbursements', `KES ${metrics.totalDisbursements.toLocaleString()}`],
        ['Net Position', `KES ${metrics.netPosition.toLocaleString()}`],
        ['Total Expenses', `KES ${metrics.totalExpenses.toLocaleString()}`],
        ['Member Count', metrics.memberCount.toString()],
        ['Active Members', metrics.activeMembers.toString()],
        ['Risk Score', `${metrics.riskScore}%`],
        ['Compliance Score', `${metrics.complianceScore}%`],
        [''],
        ['Risk Areas'],
        ...riskAreas.map(risk => [risk.type, risk.description, risk.impact]),
        [''],
        ['Monthly Trends'],
        ['Month', 'Contributions', 'Disbursements', 'Expenses', 'Net'],
        ...monthlyTrends.map(trend => [
          trend.month,
          trend.contributions.toString(),
          trend.disbursements.toString(), 
          trend.expenses.toString(),
          trend.net.toString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Dashboard report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dashboard report');
    } finally {
      setExportLoading("");
    }
  };

  const exportDashboardPDF = async () => {
    try {
      setExportLoading("pdf");
      
      const pdf = ReportGenerator.generateDashboardPDF(metrics, monthlyTrends, riskAreas);
      ReportGenerator.downloadPDF(pdf, 'audit_dashboard_report');
      
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setExportLoading("");
    }
  };

  const exportAnomaliesPDF = async () => {
    try {
      setExportLoading("anomalies");
      
      // Generate anomalies from risk areas and compliance issues
      const anomalies = riskAreas.map(risk => ({
        type: risk.type,
        severity: risk.impact === 'Critical' ? 'critical' : 'warning',
        description: risk.description,
        recommendation: risk.recommendation
      }));
      
      const pdf = ReportGenerator.generateAnomaliesPDF(anomalies, metrics);
      ReportGenerator.downloadPDF(pdf, 'anomalies_detection_report');
      
      toast.success('Anomalies report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate anomalies report');
    } finally {
      setExportLoading("");
    }
  };

  const financialHealthData = [
    { name: 'Contributions', value: metrics.totalContributions, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Disbursements', value: metrics.totalDisbursements, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Expenses', value: metrics.totalExpenses, fill: 'hsl(45, 93%, 47%)' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Audit Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive treasury oversight and analysis</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportAnomaliesPDF} 
            variant="destructive"
            disabled={exportLoading === "anomalies"}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {exportLoading === "anomalies" ? "Generating..." : "Anomalies Report"}
          </Button>
          <Button 
            onClick={exportDashboardPDF} 
            variant="default"
            disabled={exportLoading === "pdf"}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {exportLoading === "pdf" ? "Generating..." : "Export PDF"}
          </Button>
          <Button 
            onClick={exportDashboardReport} 
            variant="outline"
            disabled={exportLoading === "csv"}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportLoading === "csv" ? "Generating..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Health Score Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-800">Risk Score</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-900">{metrics.riskScore}%</div>
              <Progress value={metrics.riskScore} className="h-2" />
              <p className="text-xs text-green-600">
                {metrics.riskScore >= 80 ? 'Excellent' : metrics.riskScore >= 60 ? 'Good' : metrics.riskScore >= 40 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-800">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-900">{metrics.complianceScore}%</div>
              <Progress value={metrics.complianceScore} className="h-2" />
              <p className="text-xs text-blue-600">
                {metrics.discrepanciesFound} discrepancies found
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-800">Financial Health</CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${metrics.netPosition >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {metrics.netPosition >= 0 ? 'Healthy' : 'At Risk'}
              </div>
              <p className="text-xs text-purple-600">
                Net: KES {metrics.netPosition.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Financial Trends
            </CardTitle>
            <CardDescription>6-month trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  contributions: { label: "Contributions", color: "hsl(142, 76%, 36%)" },
                  disbursements: { label: "Disbursements", color: "hsl(217, 91%, 60%)" },
                  expenses: { label: "Expenses", color: "hsl(45, 93%, 47%)" },
                  net: { label: "Net", color: "hsl(262, 83%, 58%)" }
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, ""]}
                    />
                    <Bar dataKey="contributions" fill="hsl(142, 76%, 36%)" />
                    <Bar dataKey="disbursements" fill="hsl(217, 91%, 60%)" />
                    <Bar dataKey="expenses" fill="hsl(45, 93%, 47%)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Financial Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Financial Distribution
            </CardTitle>
            <CardDescription>Current allocation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                contributions: { label: "Contributions", color: "hsl(142, 76%, 36%)" },
                disbursements: { label: "Disbursements", color: "hsl(217, 91%, 60%)" },
                expenses: { label: "Expenses", color: "hsl(45, 93%, 47%)" }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, ""]}
                  />
                  <Pie
                    dataKey="value"
                    data={financialHealthData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {financialHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Areas */}
      {riskAreas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Risk Areas Identified
            </CardTitle>
            <CardDescription className="text-red-700">
              Areas requiring immediate attention and action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskAreas.map((risk, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-red-200">
                  <div className={`p-2 rounded-full ${
                    risk.impact === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={risk.impact === 'Critical' ? 'destructive' : 'secondary'}>
                        {risk.type}
                      </Badge>
                      <span className="text-sm font-medium">{risk.impact} Impact</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Recommendation:</strong> {risk.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quick Audit Actions
          </CardTitle>
          <CardDescription>Common audit tasks and verifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" onClick={() => {}}>
              <Calculator className="h-4 w-4 mr-2" />
              Verify Balances
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => {}}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Review Contributions
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => {}}>
              <TrendingDown className="h-4 w-4 mr-2" />
              Audit Disbursements
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => {}}>
              <DollarSign className="h-4 w-4 mr-2" />
              Check Expenses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
