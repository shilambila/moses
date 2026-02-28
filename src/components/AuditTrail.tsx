import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search,
  Filter,
  Download, 
  Calendar as CalendarIcon,
  User,
  Settings,
  DollarSign,
  FileText,
  Shield,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  FileSpreadsheet as FileSpreadsheetIcon
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ReportGenerator, AuditTrailData } from "@/utils/reportGenerator";
import { toast } from "sonner";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name?: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed' | 'warning';
  before_value?: any;
  after_value?: any;
  session_id?: string;
}

interface ActivitySummary {
  totalActions: number;
  uniqueUsers: number;
  successfulActions: number;
  failedActions: number;
  warningActions: number;
  mostActiveUser: string;
  mostCommonAction: string;
  riskScore: number;
}

export const AuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [selectedTab, setSelectedTab] = useState("recent");
  const [exportLoading, setExportLoading] = useState<string>("");

  const exportToExcel = async () => {
    try {
      setExportLoading("excel");
      
      const reportData: AuditTrailData[] = filteredLogs.map(log => ({
        id: log.id,
        action: log.action,
        table_name: log.resource_type,
        record_id: log.resource_id,
        user_email: log.user_name,
        timestamp: log.timestamp,
        ip_address: log.ip_address
      }));

      const workbook = ReportGenerator.generateAuditTrailExcel(reportData, {
        startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      });

      ReportGenerator.downloadExcel(workbook, 'audit_trail_report');
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
      
      const reportData: AuditTrailData[] = filteredLogs.map(log => ({
        id: log.id,
        action: log.action,
        table_name: log.resource_type,
        record_id: log.resource_id,
        user_email: log.user_name,
        timestamp: log.timestamp,
        ip_address: log.ip_address
      }));

      const pdf = ReportGenerator.generateAuditTrailPDF(reportData, {
        startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined
      });

      ReportGenerator.downloadPDF(pdf, 'audit_trail_report');
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setExportLoading("");
    }
  };

  // Fetch audit trail data from system changes and activities
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        // Create audit trail from actual system activities
        const auditLogs: AuditLogEntry[] = [];
        
        // Get recent contributions as audit entries
        const { data: contributions } = await supabase
          .from('contributions')
          .select(`
            id,
            amount,
            contribution_date,
            created_at,
            updated_at,
            member_id,
            membership_registrations (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);
        
        contributions?.forEach(contrib => {
          const member = contrib.membership_registrations;
          auditLogs.push({
            id: `contrib_${contrib.id}`,
            timestamp: contrib.created_at,
            user_id: 'system',
            user_name: 'System',
            user_role: 'System',
            action: 'CREATE_CONTRIBUTION',
            resource_type: 'CONTRIBUTION',
            resource_id: contrib.id,
            resource_name: member ? `Contribution - ${member.first_name} ${member.last_name}` : 'Contribution',
            details: `New contribution of KES ${contrib.amount.toLocaleString()} recorded`,
            ip_address: '127.0.0.1',
            status: 'success',
            session_id: `session_${contrib.id}`
          });
        });
        
        // Get recent disbursements as audit entries
        const { data: disbursements } = await supabase
          .from('disbursements')
          .select(`
            id,
            amount,
            reason,
            status,
            disbursement_date,
            created_at,
            approved_by,
            member_id,
            membership_registrations (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);
        
        disbursements?.forEach(disb => {
          const member = disb.membership_registrations;
          auditLogs.push({
            id: `disb_${disb.id}`,
            timestamp: disb.created_at,
            user_id: disb.approved_by || 'system',
            user_name: disb.approved_by || 'System',
            user_role: disb.approved_by ? 'Staff' : 'System',
            action: disb.approved_by ? 'APPROVE_DISBURSEMENT' : 'CREATE_DISBURSEMENT',
            resource_type: 'DISBURSEMENT',
            resource_id: disb.id,
            resource_name: member ? `Disbursement - ${member.first_name} ${member.last_name}` : 'Disbursement',
            details: `Disbursement of KES ${disb.amount.toLocaleString()} for: ${disb.reason}`,
            ip_address: '127.0.0.1',
            status: disb.status === 'approved' ? 'success' : 'warning',
            session_id: `session_${disb.id}`
          });
        });
        
        // Get recent expenses as audit entries
        const { data: expenses } = await supabase
          .from('monthly_expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15);
        
        expenses?.forEach(expense => {
          auditLogs.push({
            id: `expense_${expense.id}`,
            timestamp: expense.created_at,
            user_id: expense.approved_by || 'system',
            user_name: expense.approved_by || 'System',
            user_role: expense.approved_by ? 'Staff' : 'System',
            action: expense.approved_by ? 'APPROVE_EXPENSE' : 'CREATE_EXPENSE',
            resource_type: 'EXPENSE',
            resource_id: expense.id,
            resource_name: `${expense.expense_category} - ${expense.month_year}`,
            details: `${expense.expense_category} expense of KES ${expense.amount.toLocaleString()}: ${expense.description}`,
            ip_address: '127.0.0.1',
            status: expense.approved_by ? 'success' : 'warning',
            session_id: `session_${expense.id}`
          });
        });
        
        // Get recent M-Pesa payments as audit entries
        const { data: mpesaPayments } = await supabase
          .from('mpesa_payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15);
        
        mpesaPayments?.forEach(payment => {
          auditLogs.push({
            id: `mpesa_${payment.id}`,
            timestamp: payment.created_at,
            user_id: 'mpesa_system',
            user_name: 'M-Pesa System',
            user_role: 'External System',
            action: payment.status === 'completed' ? 'PROCESS_PAYMENT' : 'PAYMENT_ATTEMPT',
            resource_type: 'MPESA_PAYMENT',
            resource_id: payment.id,
            resource_name: `M-Pesa Payment - ${payment.phone_number}`,
            details: `M-Pesa payment of KES ${payment.amount.toLocaleString()} from ${payment.phone_number}. Status: ${payment.status}`,
            ip_address: 'external',
            status: payment.status === 'completed' ? 'success' : 
                    payment.status === 'failed' ? 'failed' : 'warning',
            session_id: payment.checkout_request_id || `session_${payment.id}`,
            before_value: payment.result_code ? { result_code: payment.result_code } : undefined
          });
        });
        
        // Sort all audit logs by timestamp (newest first)
        const sortedLogs = auditLogs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setAuditLogs(sortedLogs);
        setFilteredLogs(sortedLogs);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  // Filter audit logs
  useEffect(() => {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (userFilter !== "all") {
      filtered = filtered.filter(log => log.user_id === userFilter);
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= dateRange.from!);
    }

    if (dateRange.to) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= dateRange.to!);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, userFilter, actionFilter, statusFilter, dateRange]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { color: "bg-green-500", icon: CheckCircle, text: "Success" },
      failed: { color: "bg-red-500", icon: XCircle, text: "Failed" },
      warning: { color: "bg-orange-500", icon: AlertTriangle, text: "Warning" }
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

  const getActionIcon = (action: string) => {
    const actionIcons = {
      'VIEW': Eye,
      'UPDATE': Edit,
      'DELETE': Trash2,
      'CREATE': Plus,
      'APPROVE': CheckCircle,
      'LOGIN': User,
      'EXPORT': Download,
      'SETTINGS': Settings
    };
    
    const actionType = action.split('_')[0];
    const Icon = actionIcons[actionType as keyof typeof actionIcons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getActivitySummary = (): ActivitySummary => {
    const logs = filteredLogs;
    const userCounts = logs.reduce((acc, log) => {
      acc[log.user_name] = (acc[log.user_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveUser = Object.entries(userCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
    const mostCommonAction = Object.entries(actionCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
    
    const failedActions = logs.filter(log => log.status === 'failed').length;
    const warningActions = logs.filter(log => log.status === 'warning').length;
    const riskScore = ((failedActions + warningActions) / logs.length) * 100;
    
    return {
      totalActions: logs.length,
      uniqueUsers: new Set(logs.map(log => log.user_id)).size,
      successfulActions: logs.filter(log => log.status === 'success').length,
      failedActions,
      warningActions,
      mostActiveUser,
      mostCommonAction,
      riskScore: Math.round(riskScore)
    };
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Status', 'IP Address', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.user_name,
        log.user_role,
        log.action,
        log.resource_name || log.resource_type,
        log.status,
        log.ip_address || '',
        `"${log.details}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const summary = getActivitySummary();
  const uniqueUsers = [...new Set(auditLogs.map(log => ({ id: log.user_id, name: log.user_name })))]
    .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index);
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const recentLogs = filteredLogs.slice(0, 50);
  const suspiciousLogs = auditLogs.filter(log => log.status === 'failed' || log.status === 'warning');
  
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
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{summary.totalActions}</p>
              </div>
              <div className="text-blue-500">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{summary.uniqueUsers}</p>
              </div>
              <div className="text-green-500">
                <User className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Actions</p>
                <p className="text-2xl font-bold text-red-500">{summary.failedActions}</p>
              </div>
              <div className="text-red-500">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`text-2xl font-bold ${
                  summary.riskScore > 20 ? 'text-red-500' : 
                  summary.riskScore > 10 ? 'text-orange-500' : 'text-green-500'
                }`}>{summary.riskScore}%</p>
              </div>
              <div className="text-purple-500">
                <Shield className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit Trail</span>
            <div className="flex gap-2">
              <Button 
                onClick={exportToPDF}
                variant="default"
                disabled={exportLoading === "pdf"}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {exportLoading === "pdf" ? "Generating..." : "Export PDF"}
              </Button>
              <Button 
                onClick={exportToExcel}
                variant="outline"
                disabled={exportLoading === "excel"}
                className="flex items-center gap-2"
              >
                <FileSpreadsheetIcon className="w-4 h-4" />
                {exportLoading === "excel" ? "Generating..." : "Export Excel"}
              </Button>
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="recent">Recent Activity ({recentLogs.length})</TabsTrigger>
              <TabsTrigger value="suspicious">Suspicious Activity ({suspiciousLogs.length})</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab} className="mt-6">
              {(selectedTab === 'recent' || selectedTab === 'suspicious') && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedTab === 'recent' ? recentLogs : suspiciousLogs).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.user_name}</p>
                              <p className="text-sm text-muted-foreground">{log.user_role}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span className="text-sm">{log.action.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.resource_name || log.resource_type}</p>
                              <p className="text-xs text-muted-foreground">{log.resource_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm">{log.details}</span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Audit Log Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedLog && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Timestamp</label>
                                          <p className="text-sm font-mono">{format(new Date(selectedLog.timestamp), 'MMM dd, yyyy HH:mm:ss')}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">User</label>
                                          <p className="text-sm">{selectedLog.user_name} ({selectedLog.user_role})</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Action</label>
                                          <p className="text-sm">{selectedLog.action.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Status</label>
                                          <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Resource</label>
                                          <p className="text-sm">{selectedLog.resource_name || selectedLog.resource_type}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">IP Address</label>
                                          <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Details</label>
                                        <p className="text-sm mt-1">{selectedLog.details}</p>
                                      </div>
                                      {selectedLog.before_value && (
                                        <div>
                                          <label className="text-sm font-medium">Before Value</label>
                                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1">{JSON.stringify(selectedLog.before_value, null, 2)}</pre>
                                        </div>
                                      )}
                                      {selectedLog.after_value && (
                                        <div>
                                          <label className="text-sm font-medium">After Value</label>
                                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1">{JSON.stringify(selectedLog.after_value, null, 2)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {selectedTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Most Active User:</span>
                        <span className="font-semibold">{summary.mostActiveUser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most Common Action:</span>
                        <span className="font-semibold">{summary.mostCommonAction.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-semibold text-green-600">
                          {Math.round((summary.successfulActions / summary.totalActions) * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Failed Attempts:</span>
                        <span className={`font-semibold ${summary.failedActions > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {summary.failedActions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Warning Events:</span>
                        <span className={`font-semibold ${summary.warningActions > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {summary.warningActions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overall Risk:</span>
                        <span className={`font-semibold ${
                          summary.riskScore > 20 ? 'text-red-600' : 
                          summary.riskScore > 10 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {summary.riskScore > 20 ? 'High' : summary.riskScore > 10 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs found matching the current filters.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
