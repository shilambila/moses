import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mysql } from "@/integrations/mysql/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ContributionWithMember {
  id: string;
  member_id: string;
  amount: number;
  contribution_date: string;
  contribution_type: string;
  status: string;
  member?: {
    first_name: string;
    last_name: string;
    tns_number?: string;
  };
}

export const ContributionsReport = () => {
  const [contributions, setContributions] = useState<ContributionWithMember[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uniqueContributors, setUniqueContributors] = useState(0);

  useEffect(() => {
    fetchContributions();
  }, [startDate, endDate]);

  const fetchContributions = async () => {
    try {
      let query = mysql
        .from("contributions")
        .select(`
          *,
          member:membership_registrations!contributions_member_id_fkey(
            first_name,
            last_name,
            tns_number
          )
        `)
        .order("contribution_date", { ascending: false });

      if (startDate) {
        query = query.gte("contribution_date", startDate);
      }
      if (endDate) {
        query = query.lte("contribution_date", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContributions(data || []);
      
      // Count unique contributors
      const uniqueMembers = new Set(data?.map(c => c.member_id));
      setUniqueContributors(uniqueMembers.size);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      toast.error("Failed to load contributions");
    }
  };

  const exportToPDF = async () => {
    toast.info("PDF export feature coming soon");
  };

  const exportToExcel = async () => {
    try {
      // Group contributions by member
      const memberContributions = new Map<string, {
        member: any;
        contributions: ContributionWithMember[];
      }>();

      contributions.forEach(c => {
        const memberId = c.member_id;
        if (!memberContributions.has(memberId)) {
          memberContributions.set(memberId, {
            member: c.member,
            contributions: []
          });
        }
        memberContributions.get(memberId)!.contributions.push(c);
      });

      // Sort each member's contributions by date
      memberContributions.forEach(data => {
        data.contributions.sort((a, b) => 
          new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime()
        );
      });

      // Find the maximum number of contributions any member has
      let maxContributions = 0;
      memberContributions.forEach(data => {
        maxContributions = Math.max(maxContributions, data.contributions.length);
      });

      // Build header row
      const headers = ["Member Name", "TNS Number"];
      for (let i = 1; i <= maxContributions; i++) {
        headers.push(`Contribution ${i}`);
      }

      // Build data rows
      const rows = Array.from(memberContributions.values()).map(data => {
        const row = [
          `${data.member?.first_name || ''} ${data.member?.last_name || ''}`,
          data.member?.tns_number || "N/A"
        ];
        
        // Add contribution amounts
        for (let i = 0; i < maxContributions; i++) {
          if (i < data.contributions.length) {
            row.push(data.contributions[i].amount.toString());
          } else {
            row.push("");
          }
        }
        
        return row;
      });

      const csvContent = [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contributions_${startDate || 'all'}_to_${endDate || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Contributions exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export contributions");
    }
  };

  const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contributions Report</CardTitle>
          <CardDescription>Filter and export member contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Contributions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{contributions.length}</div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{uniqueContributors}</div>
                <p className="text-xs text-muted-foreground">Unique Contributors</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 mb-4">
            <Button onClick={exportToExcel} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>TNS Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No contributions found for the selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>{format(new Date(contribution.contribution_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {contribution.member?.first_name} {contribution.member?.last_name}
                      </TableCell>
                      <TableCell>{contribution.member?.tns_number || "N/A"}</TableCell>
                      <TableCell className="font-medium">KES {contribution.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{contribution.contribution_type}</TableCell>
                      <TableCell>
                        <Badge variant={contribution.status === 'confirmed' ? 'default' : 'secondary'}>
                          {contribution.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
