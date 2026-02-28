import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface DisbursementWithMember {
  id: string;
  amount: number;
  disbursement_date: string;
  reason?: string;
  status: string;
  member?: {
    first_name: string;
    last_name: string;
    tns_number?: string;
    email: string;
  };
}

export const DisbursementsReport = () => {
  const [disbursements, setDisbursements] = useState<DisbursementWithMember[]>([]);

  useEffect(() => {
    fetchDisbursements();
  }, []);

  const fetchDisbursements = async () => {
    try {
      const { data, error } = await supabase
        .from("disbursements")
        .select(`
          *,
          member:membership_registrations!disbursements_member_id_fkey(
            first_name,
            last_name,
            tns_number,
            email
          )
        `)
        .order("disbursement_date", { ascending: false });

      if (error) throw error;
      setDisbursements(data || []);
    } catch (error) {
      console.error("Error fetching disbursements:", error);
      toast.error("Failed to load disbursements");
    }
  };

  const totalAmount = disbursements.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Disbursements</CardTitle>
        <CardDescription>Complete list of disbursements to members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Disbursed</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{disbursements.length}</div>
                  <p className="text-xs text-muted-foreground">Total Disbursements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>TNS Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disbursements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No disbursements recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                disbursements.map((disbursement) => (
                  <TableRow key={disbursement.id}>
                    <TableCell>{format(new Date(disbursement.disbursement_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">
                      {disbursement.member?.first_name} {disbursement.member?.last_name}
                    </TableCell>
                    <TableCell>{disbursement.member?.tns_number || "N/A"}</TableCell>
                    <TableCell>{disbursement.member?.email}</TableCell>
                    <TableCell className="font-medium">KES {disbursement.amount.toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{disbursement.reason || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={disbursement.status === 'approved' ? 'default' : 'secondary'}>
                        {disbursement.status}
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
  );
};
