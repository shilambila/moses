import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mysql } from "@/integrations/mysql/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

interface MonthlyExpense {
  id: string;
  amount: number;
  expense_date: string;
  expense_category: string;
  description?: string;
  month_year: string;
}

export const ExpensesReport = () => {
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const fetchExpenses = async () => {
    try {
      let query = mysql
        .from("monthly_expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (selectedMonth) {
        query = query.eq("month_year", selectedMonth);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.expense_category] = (acc[expense.expense_category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses Report</CardTitle>
          <CardDescription>Filter expenses by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="month">
                <Calendar className="inline h-4 w-4 mr-1" />
                Select Month
              </Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{expenses.length}</div>
                  <p className="text-xs text-muted-foreground">Expense Entries</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{category.replace(/_/g, ' ')}</span>
                      <span className="font-medium">KES {amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {Object.keys(expensesByCategory).length === 0 && (
                    <p className="text-center text-muted-foreground">No expenses for this month</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No expenses found for the selected month
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.expense_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="capitalize">{expense.expense_category.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="max-w-xs truncate">{expense.description || "N/A"}</TableCell>
                        <TableCell className="font-medium">KES {expense.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
