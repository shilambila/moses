import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  DollarSign,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ReportGenerator, ContributionReportData } from "@/utils/reportGenerator";

interface Contribution {
  id: string;
  member_id: string;
  amount: number;
  contribution_date: string;
  contribution_type: string;
  status: string;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    tns_number?: string;
    email: string;
  };
}

interface ContributionSummary {
  totalContributions: number;
  totalAmount: number;
  confirmedAmount: number;
  pendingAmount: number;
  averageContribution: number;
  topContributor?: string;
  lastContributionDate: string;
}

export const ContributionAudit = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState<ContributionSummary>({
    totalContributions: 0,
    totalAmount: 0,
    confirmedAmount: 0,
    pendingAmount: 0,
    averageContribution: 0,
    lastContributionDate: ""
  });
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<string>("");

  useEffect(() => {
    fetchContributions();
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  const exportToExcel = async () => {
    try {
      setExportLoading("excel");
      
      const reportData: ContributionReportData[] = filteredContributions.map(c => ({
        id: c.id,
        member_id: c.member_id,
        member_name: c.member ? `${c.member.first_name} ${c.member.last_name}` : 'Unknown Member',
        tns_number: c.member?.tns_number,
        amount: Number(c.amount),
        contribution_date: c.contribution_date,
        contribution_type: c.contribution_type,
        status: c.status
      }));

      const workbook = ReportGenerator.generateContributionsExcel(reportData, {
        startDate: dateFrom,
        endDate: dateTo
      });

      ReportGenerator.downloadExcel(workbook, 'contributions_audit_report');
      toast.success('Excel report generated successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to generate Excel report');
    } finally {
      setExportLoading("");
    }
  };

  const exportToPDF = async () => {
    try {
      setExportLoading("pdf");
      
      const reportData: ContributionReportData[] = filteredContributions.map(c => ({
        id: c.id,
        member_id: c.member_id,
        member_name: c.member ? `${c.member.first_name} ${c.member.last_name}` : 'Unknown Member',
        tns_number: c.member?.tns_number,
        amount: Number(c.amount),
        contribution_date: c.contribution_date,
        contribution_type: c.contribution_type,
        status: c.status
      }));

      const pdf = ReportGenerator.generateContributionsPDF(reportData, {
        startDate: dateFrom,
        endDate: dateTo
      });

      ReportGenerator.downloadPDF(pdf, 'contributions_audit_report');
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setExportLoading("");
    }
  };

  const fetchContributions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('contributions')
        .select(`
          *,
          member:membership_registrations(
            first_name,
            last_name, 
            tns_number,
            email
          )
        `)
        .order('contribution_date', { ascending: false });

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter !== "all") {
        query = query.eq('contribution_type', typeFilter);
      }
      
      if (dateFrom) {
        query = query.gte('contribution_date', dateFrom);
      }
      
      if (dateTo) {
        query = query.lte('contribution_date', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContributions(data || []);
      calculateSummary(data || []);
      identifyAnomalies(data || []);
      
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast.error('Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: Contribution[]) => {
    const totalAmount = data.reduce((sum, c) => sum + Number(c.amount), 0);
    const confirmedAmount = data
      .filter(c => c.status === 'confirmed')
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingAmount = data
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.amount), 0);
    
    // Find top contributor
    const contributorMap = new Map();
    data.forEach(c => {
      if (c.member) {
        const name = `${c.member.first_name} ${c.member.last_name}`;
        const current = contributorMap.get(name) || 0;
        contributorMap.set(name, current + Number(c.amount));
      }
    });
    
    let topContributor = "";
    let maxAmount = 0;
    contributorMap.forEach((amount, name) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topContributor = name;
      }
    });

    setSummary({
      totalContributions: data.length,
      totalAmount,
      confirmedAmount,
      pendingAmount,
      averageContribution: data.length > 0 ? totalAmount / data.length : 0,
      topContributor,
      lastContributionDate: data.length > 0 ? data[0].contribution_date : ""
    });
  };

  const identifyAnomalies = (data: Contribution[]) => {
    const anomalies = [];
    
    if (data.length === 0) {
      setAnomalies([]);
      return;
    }

    // Calculate average contribution amount
    const amounts = data.map(c => Number(c.amount));
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / amounts.length);
    
    // Find outliers (contributions > 2 standard deviations from mean)
    const outliers = data.filter(c => Math.abs(Number(c.amount) - average) > 2 * stdDev);
    if (outliers.length > 0) {
      anomalies.push({
        type: "Amount Outliers",
        description: `${outliers.length} contributions with unusual amounts detected`,
        severity: "medium",
        items: outliers.map(c => `${c.member?.first_name} ${c.member?.last_name}: KES ${Number(c.amount).toLocaleString()}`)
      });
    }

    // Check for duplicate contributions on same date
    const dateGroups = new Map();
    data.forEach(c => {
      const key = `${c.member_id}-${c.contribution_date}`;
      if (!dateGroups.has(key)) {
        dateGroups.set(key, []);
      }
      dateGroups.get(key).push(c);
    });
    
    const duplicates = Array.from(dateGroups.values()).filter(group => group.length > 1);
    if (duplicates.length > 0) {
      anomalies.push({
        type: "Potential Duplicates",
        description: `${duplicates.length} members have multiple contributions on the same date`,
        severity: "high",
        items: duplicates.map(group => `${group[0].member?.first_name} ${group[0].member?.last_name} on ${format(new Date(group[0].contribution_date), 'MMM dd, yyyy')}`)
      });
    }

    // Check for pending contributions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldPending = data.filter(c => 
      c.status === 'pending' && 
      new Date(c.contribution_date) < thirtyDaysAgo
    );
    
    if (oldPending.length > 0) {
      anomalies.push({
        type: "Old Pending Contributions",
        description: `${oldPending.length} contributions pending for more than 30 days`,
        severity: "medium",
        items: oldPending.map(c => `${c.member?.first_name} ${c.member?.last_name}: KES ${Number(c.amount).toLocaleString()}`)
      });
    }

    setAnomalies(anomalies);
  };

  const filteredContributions = contributions.filter(contribution => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contribution.member?.first_name?.toLowerCase().includes(searchLower) ||
      contribution.member?.last_name?.toLowerCase().includes(searchLower) ||
      contribution.member?.email?.toLowerCase().includes(searchLower) ||
      contribution.member?.tns_number?.toLowerCase().includes(searchLower) ||
      contribution.amount.toString().includes(searchLower)
    );
  });

  const exportContributions = async () => {
    try {
      const csvContent = [
        ['Contribution Audit Report'],
        ['Generated At', new Date().toLocaleString()],
        ['Total Contributions', summary.totalContributions.toString()],
        ['Total Amount', `KES ${summary.totalAmount.toLocaleString()}`],
        ['Confirmed Amount', `KES ${summary.confirmedAmount.toLocaleString()}`],
        ['Pending Amount', `KES ${summary.pendingAmount.toLocaleString()}`],
        [''],
        ['Date', 'Member Name', 'TNS Number', 'Email', 'Amount', 'Type', 'Status'],
        ...filteredContributions.map(c => [
          format(new Date(c.contribution_date), 'yyyy-MM-dd'),
          `${c.member?.first_name || ''} ${c.member?.last_name || ''}`,
          c.member?.tns_number || '',
          c.member?.email || '',
          c.amount.toString(),
          c.contribution_type,
          c.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contribution-audit-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Contribution audit report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contribution Audit</h2>
          <p className="text-muted-foreground">Detailed analysis and verification of member contributions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={exportToExcel} 
            className="flex items-center gap-2" 
            variant="outline"
            disabled={exportLoading === "excel"}
          >
            {exportLoading === "excel" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Export Excel
          </Button>
          <Button 
            onClick={exportToPDF} 
            className="flex items-center gap-2" 
            variant="outline"
            disabled={exportLoading === "pdf"}
          >
            {exportLoading === "pdf" ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Export PDF
          </Button>
          <Button onClick={exportContributions} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{summary.totalContributions}</div>
            <p className="text-xs text-green-600">KES {summary.totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Confirmed Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              KES {summary.confirmedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600">
              {((summary.confirmedAmount / summary.totalAmount) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              KES {summary.pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-yellow-600">
              {((summary.pendingAmount / summary.totalAmount) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">Average Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              KES {summary.averageContribution.toFixed(0)}
            </div>
            <p className="text-xs text-purple-600">
              Top: {summary.topContributor || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Anomalies Detected
            </CardTitle>
            <CardDescription className="text-orange-700">
              {anomalies.length} potential issues found in contribution data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <div key={index} className="p-3 bg-white rounded border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                      {anomaly.type}
                    </Badge>
                    <span className="text-sm font-medium">{anomaly.description}</span>
                  </div>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                    {anomaly.items.slice(0, 3).map((item: string, idx: number) => (
                      <div key={idx}>• {item}</div>
                    ))}
                    {anomaly.items.length > 3 && (
                      <div>• ... and {anomaly.items.length - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>

            <div>
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contribution Records</CardTitle>
            <Badge variant="outline">
              {filteredContributions.length} of {contributions.length} contributions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>TNS Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(contribution.contribution_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {contribution.member?.first_name} {contribution.member?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {contribution.member?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contribution.member?.tns_number || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          KES {Number(contribution.amount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {contribution.contribution_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={contribution.status === 'confirmed' ? 'default' : 'secondary'}
                          className={contribution.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {contribution.status === 'confirmed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {contribution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
