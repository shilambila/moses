import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mysql } from "@/integrations/mysql/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  tns_number?: string;
}

export const DisbursementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await mysql
        .from("membership_registrations")
        .select("id, first_name, last_name, tns_number")
        .eq("registration_status", "approved")
        .order("first_name", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !amount || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      // Insert disbursement record
      const { error: disbursementError } = await mysql
        .from("disbursements")
        .insert({
          member_id: selectedMember,
          amount: numAmount,
          disbursement_date: disbursementDate,
          reason: reason,
          status: "approved"
        });

      if (disbursementError) throw disbursementError;

      // Update member balance
      const { data: currentBalance } = await mysql
        .from("member_balances")
        .select("current_balance, total_disbursements")
        .eq("member_id", selectedMember)
        .single();

      if (currentBalance) {
        await mysql
          .from("member_balances")
          .update({
            current_balance: currentBalance.current_balance - numAmount,
            total_disbursements: currentBalance.total_disbursements + numAmount,
            last_updated: new Date().toISOString()
          })
          .eq("member_id", selectedMember);
      }

      toast.success("Disbursement recorded successfully!");
      
      // Reset form
      setSelectedMember("");
      setAmount("");
      setReason("");
      setDisbursementDate(new Date().toISOString().split('T')[0]);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error recording disbursement:", error);
      toast.error("Failed to record disbursement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Disbursement</CardTitle>
        <CardDescription>
          Record a disbursement payment to a member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member *</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMembers ? "Loading members..." : "Select a member"} />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} {member.tns_number ? `(${member.tns_number})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disbursementDate">Disbursement Date *</Label>
            <Input
              id="disbursementDate"
              type="date"
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason/Description *</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for disbursement"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Disbursement"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
