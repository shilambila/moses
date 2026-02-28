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
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, AlertTriangle, CheckCircle, XCircle, Calculator, TrendingUp, TrendingDown, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { ReportGenerator } from "@/utils/reportGenerator";
import { toast } from "sonner";

interface MemberBalance {
  id: string;
  member_id: string;
  member_name: string;
  current_balance: number;
  calculated_balance: number;
  total_contributions: number;
  total_disbursements: number;
  last_updated: string;
  discrepancy: number;
  status: 'verified' | 'discrepancy' | 'pending' | 'investigating';
  notes?: string;
  member_phone: string;
  member_email: string;
  join_date: string;
}

interface BalanceTransaction {
  id: string;
  member_id: string;
  type: 'contribution' | 'disbursement' | 'adjustment';
  amount: number;
  date: string;
  description: string;
  reference: string;
}

export const BalanceVerification = () => {
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<MemberBalance[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [exportLoading, setExportLoading] = useState<string>("");

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        // Fetch member balances with member details
        const { data: balanceData, error } = await supabase
          .from('member_balances')
          .select(`
            id,
            member_id,
            current_balance,
            total_contributions,
            total_disbursements,
            last_updated,
            membership_registrations (
              id,
              first_name,
              last_name,
              phone,
              email,
              tns_number,
              registration_date
            )
          `)
          .order('last_updated', { ascending: false });

        if (error) {
          console.error('Error fetching member balances:', error);
          return;
        }

        // Transform the data to match our component interface
        const transformedBalances: MemberBalance[] = balanceData?.map(balance => {
          const member = balance.membership_registrations;
          const calculated_balance = balance.total_contributions - balance.total_disbursements;
          const discrepancy = balance.current_balance - calculated_balance;
          
          // Determine status based on discrepancy
          let status: 'verified' | 'discrepancy' | 'pending' | 'investigating' = 'verified';
          if (Math.abs(discrepancy) > 100) {
            status = 'discrepancy';
          } else if (Math.abs(discrepancy) > 10) {
            status = 'investigating';
          }
          
          return {
            id: balance.id,
            member_id: balance.member_id,
            member_name: member ? `${member.first_name} ${member.last_name}` : 'Unknown Member',
            current_balance: balance.current_balance,
            calculated_balance,
            total_contributions: balance.total_contributions,
            total_disbursements: balance.total_disbursements,
            last_updated: balance.last_updated,
            discrepancy,
            status,
            member_phone: member?.phone || 'N/A',
            member_email: member?.email || 'N/A',
            join_date: member?.registration_date || '2023-01-01',
            notes: Math.abs(discrepancy) > 100 ? 'Significant discrepancy detected' : undefined
          };
        }) || [];
        
        setBalances(transformedBalances);
        setFilteredBalances(transformedBalances);
        
        // Fetch recent transactions for context
        const { data: contributionData } = await supabase
          .from('contributions')
          .select('*')
          .order('contribution_date', { ascending: false })
          .limit(50);
          
        const { data: disbursementData } = await supabase
          .from('disbursements')
          .select('*')
          .order('disbursement_date', { ascending: false })
          .limit(50);
        
        const transactionList: BalanceTransaction[] = [];
        
        // Add contributions
        contributionData?.forEach(contrib => {
          transactionList.push({
            id: contrib.id,
            member_id: contrib.member_id,
            type: 'contribution',
            amount: contrib.amount,
            date: contrib.contribution_date,
            description: `${contrib.contribution_type} contribution`,
            reference: contrib.id
          });
        });
        
        // Add disbursements
        disbursementData?.forEach(disb => {
          transactionList.push({
            id: disb.id,
            member_id: disb.member_id,
            type: 'disbursement',
            amount: -disb.amount,
            date: disb.disbursement_date,
            description: disb.reason || 'Disbursement',
            reference: disb.id
          });
        });
        
        setTransactions(transactionList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Error fetching balance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceData();
  }, []);

  // Filter balances based on search and status
  useEffect(() => {
    let filtered = balances;

    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.member_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.member_phone.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    setFilteredBalances(filtered);
  }, [balances, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      verified: { color: "bg-green-500", icon: CheckCircle, text: "Verified" },
      discrepancy: { color: "bg-red-500", icon: XCircle, text: "Discrepancy" },
      pending: { color: "bg-yellow-500", icon: Calculator, text: "Pending" },
      investigating: { color: "bg-orange-500", icon: AlertTriangle, text: "Investigating" }
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

  const getDiscrepancyIndicator = (discrepancy: number) => {
    if (discrepancy === 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (discrepancy > 0) {
      return <TrendingUp className="w-4 h-4 text-blue-500" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
  };

  const getBalanceStats = () => {
    const stats = {
      total: balances.length,
      verified: balances.filter(b => b.status === 'verified').length,
      discrepancies: balances.filter(b => b.status === 'discrepancy').length,
      investigating: balances.filter(b => b.status === 'investigating').length,
      totalBalance: balances.reduce((sum, b) => sum + b.current_balance, 0),
      totalDiscrepancy: balances.reduce((sum, b) => sum + Math.abs(b.discrepancy), 0),
      averageBalance: balances.length > 0 ? balances.reduce((sum, b) => sum + b.current_balance, 0) / balances.length : 0
    };
    return stats;
  };

  const exportToCSV = () => {
    const headers = ['Member Name', 'Phone', 'Email', 'Current Balance', 'Calculated Balance', 'Discrepancy', 'Status', 'Total Contributions', 'Total Disbursements', 'Last Updated', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredBalances.map(b => [
        b.member_name,
        b.member_phone,
        b.member_email,
        b.current_balance,
        b.calculated_balance,
        b.discrepancy,
        b.status,
        b.total_contributions,
        b.total_disbursements,
        b.last_updated,
        `"${b.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-verification-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      setExportLoading("pdf");
      
      const pdf = ReportGenerator.generateBalancesPDF(filteredBalances);
      ReportGenerator.downloadPDF(pdf, 'balance_verification_report');
      
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setExportLoading("");
    }
  };

  const recalculateBalance = (memberId: string) => {
    // This would trigger a recalculation process
    console.log(`Recalculating balance for member: ${memberId}`);
    // Implementation would involve recalculating based on all transactions
  };

  const stats = getBalanceStats();
  const discrepancyMembers = balances.filter(b => b.discrepancy !== 0);
  const verificationRate = stats.total > 0 ? (stats.verified / stats.total) * 100 : 0;
  
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
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="text-blue-500">
                <Calculator className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified Balances</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
              <div className="text-green-500">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <Progress value={verificationRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Discrepancies</p>
                <p className="text-2xl font-bold text-red-500">{stats.discrepancies}</p>
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
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">KES {stats.totalBalance.toLocaleString()}</p>
              </div>
              <div className="text-purple-500">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discrepancy Alerts */}
      {discrepancyMembers.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {discrepancyMembers.length} members have balance discrepancies totaling KES {stats.totalDiscrepancy.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Balance Verification</span>
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
              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="discrepancy">Discrepancy</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="discrepancies">Discrepancies ({stats.discrepancies})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab} className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Calculated Balance</TableHead>
                      <TableHead>Discrepancy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contributions</TableHead>
                      <TableHead>Disbursements</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBalances
                      .filter(balance => {
                        if (selectedTab === 'discrepancies') return balance.status === 'discrepancy' || balance.discrepancy !== 0;
                        if (selectedTab === 'verified') return balance.status === 'verified';
                        return true;
                      })
                      .map((balance) => (
                      <TableRow key={balance.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{balance.member_name}</p>
                            <p className="text-sm text-muted-foreground">{balance.member_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          KES {balance.current_balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          KES {balance.calculated_balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDiscrepancyIndicator(balance.discrepancy)}
                            <span className={balance.discrepancy !== 0 ? 'font-semibold text-red-600' : 'text-green-600'}>
                              {balance.discrepancy === 0 ? 'Balanced' : `KES ${Math.abs(balance.discrepancy).toLocaleString()}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(balance.status)}</TableCell>
                        <TableCell>KES {balance.total_contributions.toLocaleString()}</TableCell>
                        <TableCell>KES {balance.total_disbursements.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(balance.last_updated), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => recalculateBalance(balance.member_id)}
                          >
                            <Calculator className="w-3 h-3 mr-1" />
                            Recalculate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredBalances.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No members found matching the current filters.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
