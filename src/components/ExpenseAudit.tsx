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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign, Eye, PieChart, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ReportGenerator } from "@/utils/reportGenerator";
import { toast } from "sonner";

interface MonthlyExpense {
  id: string;
  month_year: string;
  expense_category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  approved_by?: string;
}

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const ExpenseAudit = () => {
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<MonthlyExpense[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedExpense, setSelectedExpense] = useState<MonthlyExpense | null>(null);
  const [exportLoading, setExportLoading] = useState<string>("");

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        // Fetch monthly expenses from Supabase
        const { data: expenseData, error } = await supabase
          .from('monthly_expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        if (error) {
          console.error('Error fetching monthly expenses:', error);
          return;
        }

        // Transform the data to match our component interface
        const transformedExpenses: MonthlyExpense[] = expenseData?.map(expense => ({
          id: expense.id,
          month_year: expense.month_year,
          expense_category: expense.expense_category,
          description: expense.description || 'No description provided',
          amount: expense.amount,
          expense_date: expense.expense_date,
          created_at: expense.created_at,
          approved_by: expense.approved_by
        })) || [];
        
        setExpenses(transformedExpenses);
        setFilteredExpenses(transformedExpenses);

        // Calculate budget data from actual expenses
        const categoryTotals = expenseData?.reduce((acc, expense) => {
          const category = expense.expense_category;
          acc[category] = (acc[category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>) || {};

        const mockBudget: BudgetCategory[] = Object.entries(categoryTotals).map(([category, spent]) => {
          // Estimate allocated budget as 150% of spent amount for demo purposes
          const allocated = Math.max(spent * 1.5, spent + 50000);
          return {
            name: category,
            allocated,
            spent,
            remaining: allocated - spent,
            percentage: (spent / allocated) * 100
          };
        });
        
        setBudgetData(mockBudget);
      } catch (error) {
        console.error('Error fetching expense data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseData();
  }, []);

  // Filter expenses based on search and filters
  useEffect(() => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expense_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.approved_by && e.approved_by.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      // For real data, determine status based on approved_by field
      const hasStatus = statusFilter === "approved" ? (e: MonthlyExpense) => !!e.approved_by : 
                       statusFilter === "pending" ? (e: MonthlyExpense) => !e.approved_by : 
                       () => true;
      filtered = filtered.filter(hasStatus);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(e => e.expense_category === categoryFilter);
    }

    if (monthFilter !== "all") {
      filtered = filtered.filter(e => e.month_year === monthFilter);
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, statusFilter, categoryFilter, monthFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock, text: "Pending" },
      approved: { color: "bg-blue-500", icon: CheckCircle, text: "Approved" },
      rejected: { color: "bg-red-500", icon: XCircle, text: "Rejected" },
      paid: { color: "bg-green-500", icon: CheckCircle, text: "Paid" }
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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: "bg-gray-500",
      medium: "bg-blue-500",
      high: "bg-orange-500",
      critical: "bg-red-500"
    };
    
    return (
      <Badge className={`${priorityConfig[priority as keyof typeof priorityConfig]} text-white`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getExpenseStats = () => {
    const stats = {
      total: expenses.length,
      pending: expenses.filter(e => !e.approved_by).length,
      approved: expenses.filter(e => !!e.approved_by).length,
      rejected: 0, // Not tracked in current schema
      paid: expenses.filter(e => !!e.approved_by).length, // Assume approved = paid for now
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      pendingAmount: expenses.filter(e => !e.approved_by).reduce((sum, e) => sum + e.amount, 0),
      paidAmount: expenses.filter(e => !!e.approved_by).reduce((sum, e) => sum + e.amount, 0)
    };
    return stats;
  };

  const exportToCSV = () => {
    const headers = ['Month', 'Category', 'Description', 'Amount', 'Status', 'Expense Date', 'Approved By', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(e => [
        e.month_year,
        e.expense_category,
        `"${e.description}"`,
        e.amount,
        e.approved_by ? 'Approved' : 'Pending',
        e.expense_date,
        e.approved_by || 'Pending',
        e.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      setExportLoading("pdf");
      
      const pdf = ReportGenerator.generateExpensesPDF(filteredExpenses);
      ReportGenerator.downloadPDF(pdf, 'expense_audit_report');
      
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setExportLoading("");
    }
  };

  const stats = getExpenseStats();
  const categories = [...new Set(expenses.map(e => e.expense_category))];
  const months = [...new Set(expenses.map(e => e.month_year))];
  const highRiskExpenses = expenses.filter(e => e.amount > 30000); // Remove priority filter as it's not in schema
  const approvalRate = stats.total > 0 ? ((stats.approved + stats.paid) / stats.total) * 100 : 0;
  
  const budgetChartData = budgetData.map(b => ({
    name: b.name,
    allocated: b.allocated,
    spent: b.spent,
    remaining: b.remaining
  }));

  const categorySpendingData = categories.map(cat => {
    const categoryExpenses = expenses.filter(e => e.expense_category === cat && e.approved_by);
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { name: cat, value: total };
  }).filter(item => item.value > 0);
  
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
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="text-blue-500">
                <DollarSign className="w-8 h-8" />
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
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold">KES {stats.paidAmount.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{Math.round(approvalRate)}%</p>
              </div>
              <div className="text-purple-500">
                <PieChart className="w-8 h-8" />
              </div>
            </div>
            <Progress value={approvalRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {highRiskExpenses.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {highRiskExpenses.length} high-risk expenses require attention (amount {">"} KES 30,000)
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="allocated" fill="#8884d8" name="Allocated" />
                <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categorySpendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categorySpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Amount']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Expense Audit</span>
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
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search expenses..."
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
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{format(new Date(month + '-01'), 'MMM yyyy')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="overview">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({stats.paid})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab} className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses
                      .filter(expense => {
                        if (selectedTab === 'pending') return !expense.approved_by;
                        if (selectedTab === 'approved') return !!expense.approved_by;
                        if (selectedTab === 'paid') return !!expense.approved_by;
                        return true;
                      })
                      .map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">{expense.expense_category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">KES {expense.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.expense_category}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.approved_by ? 'approved' : 'pending')}</TableCell>
                        <TableCell>
                          <Badge className={expense.amount > 50000 ? 'bg-red-500 text-white' : expense.amount > 20000 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}>
                            {expense.amount > 50000 ? 'HIGH' : expense.amount > 20000 ? 'MEDIUM' : 'LOW'}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.approved_by || 'System'}</TableCell>
                        <TableCell>{format(new Date(expense.month_year + '-01'), 'MMM yyyy')}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedExpense(expense)}>
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Expense Details</DialogTitle>
                              </DialogHeader>
                              {selectedExpense && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Description</label>
                                      <p className="text-sm">{selectedExpense.description}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Amount</label>
                                      <p className="text-sm font-semibold">KES {selectedExpense.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Category</label>
                                      <p className="text-sm">{selectedExpense.expense_category}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <div className="mt-1">{getStatusBadge(selectedExpense.approved_by ? 'approved' : 'pending')}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Month</label>
                                      <p className="text-sm">{selectedExpense.month_year}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Expense Date</label>
                                      <p className="text-sm">{format(new Date(selectedExpense.expense_date), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Created Date</label>
                                      <p className="text-sm">{format(new Date(selectedExpense.created_at), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Approved By</label>
                                      <p className="text-sm">{selectedExpense.approved_by || 'Pending'}</p>
                                    </div>
                                  </div>
                                  {/* Notes and receipt removed - columns don't exist yet */}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredExpenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses found matching the current filters.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
