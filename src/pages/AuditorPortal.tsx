import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { mysql } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Shield, 
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileSearch,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar,
  Users,
  Target
} from "lucide-react";
import { AuditDashboard } from "@/components/AuditDashboard";
import { ContributionAudit } from "@/components/ContributionAudit";
import { DisbursementAudit } from "@/components/DisbursementAudit";
import { BalanceVerification } from "@/components/BalanceVerification";
import { ExpenseAudit } from "@/components/ExpenseAudit";
import { AuditReports } from "@/components/AuditReports";
import { AuditTrail } from "@/components/AuditTrail";
import { useCrossPortalSync } from "@/hooks/useCrossPortalSync";

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

const AuditorPortal = () => {
  const { staffUser, logout } = useStaffAuth();
  const { isAuthorized, isLoading: roleLoading } = useRoleGuard({ portal: 'auditor' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalContributions: 0,
    totalDisbursements: 0,
    netPosition: 0,
    totalExpenses: 0,
    memberCount: 0,
    activeMembers: 0,
    averageContribution: 0,
    totalBalance: 0,
    riskScore: 0,
    complianceScore: 0,
    discrepanciesFound: 0,
    lastAuditDate: ""
  });
  const [auditSummary, setAuditSummary] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    resolved: 0
  });
  
  // Set up cross-portal synchronization for member data
  useCrossPortalSync({
    onRefreshRequired: (source: string, reason: string) => {
      console.log(`AuditorPortal: Refreshing data due to: ${reason} (from: ${source})`);
      fetchAuditData();
    },
    portalName: 'AuditorPortal',
    autoRefresh: true
  });

  useEffect(() => {
    // Role guard handles authentication and authorization
    if (isAuthorized && !roleLoading) {
      fetchAuditData();
    }
  }, [isAuthorized, roleLoading]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      // Fetch contributions
      const { data: contributions, error: contributionsError } = await mysql
        .from('contributions')
        .select('*');

      if (contributionsError) throw contributionsError;

      // Fetch disbursements  
      const { data: disbursements, error: disbursementsError } = await mysql
        .from('disbursements')
        .select('*');

      if (disbursementsError) throw disbursementsError;

      // Fetch monthly expenses
      const { data: expenses, error: expensesError } = await mysql
        .from('monthly_expenses')
        .select('*');

      if (expensesError) throw expensesError;

      // Fetch member balances
      const { data: balances, error: balancesError } = await mysql
        .from('member_balances')
        .select('*');

      if (balancesError) throw balancesError;

      // Fetch approved members
      const { data: members, error: membersError } = await mysql
        .from('membership_registrations')
        .select('*')
        .eq('registration_status', 'approved');

      if (membersError) throw membersError;

      // Calculate metrics
      const totalContributions = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalDisbursements = disbursements?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalBalance = balances?.reduce((sum, b) => sum + Number(b.current_balance), 0) || 0;
      const netPosition = totalContributions - totalDisbursements - totalExpenses;
      const memberCount = members?.length || 0;
      const activeMembers = members?.filter(m => m.maturity_status === 'mature').length || 0;
      const averageContribution = memberCount > 0 ? totalContributions / memberCount : 0;

      // Calculate risk and compliance scores (simplified scoring system)
      const riskFactors = [
        totalDisbursements > totalContributions * 0.8 ? 20 : 0, // High disbursement ratio
        totalExpenses > totalContributions * 0.1 ? 15 : 0,      // High expense ratio
        balances?.some(b => Number(b.current_balance) < 0) ? 25 : 0, // Negative balances
        (contributions?.length || 0) < memberCount * 0.7 ? 20 : 0,  // Low participation
      ];
      
      const riskScore = Math.max(0, 100 - riskFactors.reduce((sum, factor) => sum + factor, 0));
      
      const complianceChecks = [
        disbursements?.every(d => d.status === 'approved') ? 25 : 0,
        expenses?.every(e => e.approved_by) ? 25 : 0,
        contributions?.every(c => c.status === 'confirmed') ? 25 : 0,
        balances?.length === memberCount ? 25 : 0
      ];
      
      const complianceScore = complianceChecks.reduce((sum, check) => sum + check, 0);

      // Calculate discrepancies (simplified)
      const discrepanciesFound = [
        ...(balances?.filter(b => Math.abs(Number(b.current_balance)) > Number(b.total_contributions) - Number(b.total_disbursements)) || []),
        ...(disbursements?.filter(d => d.status === 'pending') || []),
        ...(contributions?.filter(c => c.status !== 'confirmed') || [])
      ].length;

      setMetrics({
        totalContributions,
        totalDisbursements,
        netPosition,
        totalExpenses,
        memberCount,
        activeMembers,
        averageContribution,
        totalBalance,
        riskScore,
        complianceScore,
        discrepanciesFound,
        lastAuditDate: new Date().toISOString()
      });

      // Set audit summary
      setAuditSummary({
        critical: riskScore < 50 ? 1 : 0,
        warning: discrepanciesFound,
        info: Math.max(0, memberCount - activeMembers),
        resolved: Math.max(0, (contributions?.length || 0) + (disbursements?.length || 0) - discrepanciesFound)
      });

    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/portal-login");
    toast.success("Signed out successfully");
  };

  const getHealthStatus = () => {
    if (metrics.riskScore >= 80 && metrics.complianceScore >= 80) {
      return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
    } else if (metrics.riskScore >= 60 && metrics.complianceScore >= 60) {
      return { status: "Good", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
    } else if (metrics.riskScore >= 40 && metrics.complianceScore >= 40) {
      return { status: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
    } else {
      return { status: "Needs Attention", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Auditor Portal...</p>
        </div>
      </div>
    );
  }

  const healthStatus = getHealthStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 p-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Auditor Portal
                </h1>
                <p className="text-muted-foreground mt-2">
                  Welcome, {staffUser?.first_name} {staffUser?.last_name} - {staffUser?.staff_role}
                </p>
              </div>
            </div>
          </div>
          
          {/* Health Status Indicator */}
          <div className={`${healthStatus.bgColor} ${healthStatus.borderColor} border-2 rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {metrics.riskScore >= 70 ? (
                  <CheckCircle className={`h-6 w-6 ${healthStatus.color}`} />
                ) : (
                  <AlertTriangle className={`h-6 w-6 ${healthStatus.color}`} />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className={`text-lg font-bold ${healthStatus.color}`}>{healthStatus.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last Audit</p>
                <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8 px-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Contributions</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                KES {metrics.totalContributions.toLocaleString()}
              </div>
              <p className="text-xs text-green-600">
                Avg: KES {metrics.averageContribution.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Disbursements</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                KES {metrics.totalDisbursements.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600">
                {((metrics.totalDisbursements / metrics.totalContributions) * 100).toFixed(1)}% of contributions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Net Position</CardTitle>
              <Calculator className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.netPosition >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                KES {metrics.netPosition.toLocaleString()}
              </div>
              <p className="text-xs text-purple-600">
                After expenses: KES {(metrics.netPosition - metrics.totalExpenses).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Compliance Score</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {metrics.complianceScore}%
              </div>
              <p className="text-xs text-orange-600">
                {metrics.discrepanciesFound} discrepancies found
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Summary */}
        {(auditSummary.critical > 0 || auditSummary.warning > 0) && (
          <div className="mx-4 mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Audit Alerts</h3>
                      <p className="text-sm text-orange-700">Issues requiring attention</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {auditSummary.critical > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{auditSummary.critical} Critical</span>
                      </div>
                    )}
                    {auditSummary.warning > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>{auditSummary.warning} Warning</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{auditSummary.info} Info</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="px-4">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="contributions" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Contributions
              </TabsTrigger>
              <TabsTrigger value="disbursements" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Disbursements
              </TabsTrigger>
              <TabsTrigger value="balances" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Balances
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="trail" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Audit Trail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AuditDashboard metrics={metrics} auditSummary={auditSummary} />
            </TabsContent>

            <TabsContent value="contributions">
              <ContributionAudit />
            </TabsContent>

            <TabsContent value="disbursements">
              <DisbursementAudit />
            </TabsContent>

            <TabsContent value="balances">
              <BalanceVerification />
            </TabsContent>

            <TabsContent value="expenses">
              <ExpenseAudit />
            </TabsContent>

            <TabsContent value="reports">
              <AuditReports />
            </TabsContent>

            <TabsContent value="trail">
              <AuditTrail />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuditorPortal;
