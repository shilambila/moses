import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { mysql } from "@/integrations/mysql/client";
import { Download, Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { ReportGenerator, DisbursementReportData } from "@/utils/reportGenerator";
import { toast } from "sonner";

interface Disbursement {
  id: string;
  member_id: string;
  member_name: string;
  amount: number;
  reason: string;
  status: string;
  disbursement_date: string;
  created_at: string;
  approved_by?: string;
  member?: {
    first_name: string;
    last_name: string;
    tns_number?: string;
    email: string;
    phone: string;
  };
}

export const DisbursementAudit = () => {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [filteredDisbursements, setFilteredDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [exportLoading, setExportLoading] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch real data from MySQL
  useEffect(() => {
    const fetchDisbursements = async () => {
      try {
        // Fetch disbursements with member details
        const { data: disbursementData, error } = await mysql
          .from('disbursements')
          .select(`
            id,
            member_id,
            amount,
            reason,
            status,
            disbursement_date,
            created_at,
            approved_by,
            membership_registrations (
              id,
              first_name,
              last_name,
              phone,
              email,
              tns_number
            )
          `)
          .order('disbursement_date', { ascending: false });

        if (error) {
          console.error('Error fetching disbursements:', error);
          return;
        }

        // Transform the data to match our component interface
        const transformedDisbursements: Disbursement[] = disbursementData?.map(disb => {
          const member = disb.membership_registrations;
          return {
            id: disb.id,
            member_id: disb.member_id,
            member_name: member ? `${member.first_name} ${member.last_name}` : 'Unknown Member',
            amount: disb.amount,
            reason: disb.reason || 'No reason provided',
            status: disb.status || 'pending',
            disbursement_date: disb.disbursement_date,
            created_at: disb.created_at,
            approved_by: disb.approved_by,
            member: member ? {
              first_name: member.first_name,
              last_name: member.last_name,
              tns_number: member.tns_number,
              email: member.email,
              phone: member.phone
            } : undefined
          };
        }) || [];
        
        setDisbursements(transformedDisbursements);
        setFilteredDisbursements(transformedDisbursements);
      } catch (error) {
        console.error('Error fetching disbursements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisbursements();
  }, []);

  // Filter disbursements based on search and filters
  useEffect(() => {
    let filtered = disbursements;

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.member?.email && d.member.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Remove category and urgency filters as they're not in the actual schema
    // if (categoryFilter !== "all") {
    //   filtered = filtered.filter(d => d.category === categoryFilter);
    // }

    // if (urgencyFilter !== "all") {
    //   filtered = filtered.filter(d => d.urgency === urgencyFilter);
    // }

    if (selectedTab !== "all") {
      filtered = filtered.filter(d => d.status === selectedTab);
    }

    setFilteredDisbursements(filtered);
  }, [disbursements, searchTerm, statusFilter, categoryFilter, urgencyFilter, selectedTab]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock, text: "Pending" },
      approved: { color: "bg-blue-500", icon: CheckCircle, text: "Approved" },
      rejected: { color: "bg-red-500", icon: XCircle, text: "Rejected" },
      disbursed: { color: "bg-green-500", icon: CheckCircle, text: "Disbursed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      low: "bg-gray-500",
      medium: "bg-blue-500",
      high: "bg-orange-500",
      critical: "bg-red-500"
    };
    
    return (
      <Badge className={`${urgencyConfig[urgency as keyof typeof urgencyConfig]} text-white`}>
        {urgency.toUpperCase()}
      </Badge>
    );
  };

  const getStatusStats = () => {
    const stats = {
      total: disbursements.length,
      pending: disbursements.filter(d => d.status === 'pending').length,
      approved: disbursements.filter(d => d.status === 'approved').length,
      rejected: disbursements.filter(d => d.status === 'rejected').length,
      disbursed: disbursements.filter(d => d.status === 'disbursed').length,
      totalAmount: disbursements.reduce((sum, d) => sum + d.amount, 0),
      pendingAmount: disbursements.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0),
      disbursedAmount: disbursements.filter(d => d.status === 'disbursed').reduce((sum, d) => sum + d.amount, 0)
    };
    return stats;
  };

  const exportToExcel = async () => {
    try {
      setExportLoading("excel");
      
      const reportData: DisbursementReportData[] = filteredDisbursements.map(d => ({
        id: d.id,
        member_id: d.member_id,
        member_name: d.member_name,
        tns_number: d.member?.tns_number,
        amount: d.amount,
        disbursement_date: d.disbursement_date,
        reason: d.reason,
        status: d.status
      }));

      const workbook = ReportGenerator.generateDisbursementsExcel(reportData, {
        startDate: dateFrom,
        endDate: dateTo
      });

      ReportGenerator.downloadExcel(workbook, 'disbursements_audit_report');
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
      
      const reportData: DisbursementReportData[] = filteredDisbursements.map(d => ({
        id: d.id,
        member_id: d.member_id,
        member_name: d.member_name,
        tns_number: d.member?.tns_number,
        amount: d.amount,
        disbursement_date: d.disbursement_date,
        reason: d.reason,
        status: d.status
      }));

      const pdf = ReportGenerator.generateDisbursementsPDF(reportData, {
        startDate: dateFrom,
        endDate: dateTo
      });

      ReportGenerator.downloadPDF(pdf, 'disbursements_audit_report');
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setExportLoading("");
    }
  };

  const exportToCSV = () => {
    const headers = ['Member Name', 'Amount', 'Reason', 'Status', 'Disbursement Date', 'Created Date', 'Approved By'];
    const csvContent = [
      headers.join(','),
      ...filteredDisbursements.map(d => [
        d.member_name,
        d.amount,
        `"${d.reason}"`,
        d.status,
        d.disbursement_date,
        d.created_at,
        d.approved_by || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disbursement-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = getStatusStats();
  const categories: string[] = []; // No categories in schema
  const riskDisbursements = disbursements.filter(d => d.amount > 10000);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Disbursements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="text-blue-500">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">KES {stats.pendingAmount.toLocaleString()}</p>
              </div>
              <div className="text-yellow-500">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disbursed Amount</p>
                <p className="text-2xl font-bold">KES {stats.disbursedAmount.toLocaleString()}</p>
              </div>
              <div className="text-green-500">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">{Math.round((stats.approved + stats.disbursed) / stats.total * 100)}%</p>
              </div>
              <div className="text-purple-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <Progress value={(stats.approved + stats.disbursed) / stats.total * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {riskDisbursements.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {riskDisbursements.length} high-risk disbursements require attention (amount {">"} KES 10,000)
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Disbursement Audit</span>
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search disbursements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Removed category and urgency filters as they're not in the database schema */}
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="disbursed">Disbursed ({stats.disbursed})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab} className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disbursement Date</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisbursements.map((disbursement) => (
                      <TableRow key={disbursement.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{disbursement.member_name}</p>
                            <p className="text-sm text-muted-foreground">{disbursement.member?.phone || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">KES {disbursement.amount.toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{disbursement.reason}</TableCell>
                        <TableCell>{getStatusBadge(disbursement.status)}</TableCell>
                        <TableCell>{format(new Date(disbursement.disbursement_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(new Date(disbursement.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{disbursement.approved_by || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredDisbursements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No disbursements found matching the current filters.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
