import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mysql } from "@/integrations/mysql/client";
import { getFunctionsBaseUrl } from "@/integrations/mysql/url";
import { toast } from "sonner";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useAuth } from "@/hooks/useAuth";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  tns_number: string;
  email: string;
}

// Define allowed payment types as constants for consistency
const PAYMENT_TYPES = {
  MONTHLY: 'monthly_contribution',
  CASES: 'cases',
  PROJECTS: 'projects', 
  REGISTRATION: 'registration',
  OTHERS: 'others'
} as const;

const PAYMENT_TYPE_LABELS = {
  [PAYMENT_TYPES.MONTHLY]: 'Monthly contribution',
  [PAYMENT_TYPES.CASES]: 'Cases',
  [PAYMENT_TYPES.PROJECTS]: 'Projects',
  [PAYMENT_TYPES.REGISTRATION]: 'Registration',
  [PAYMENT_TYPES.OTHERS]: 'Others'
} as const;

const MYSQL_FUNCTIONS_BASE_URL = getFunctionsBaseUrl(import.meta.env.VITE_MYSQL_URL);
const MYSQL_ANON_KEY = import.meta.env.VITE_MYSQL_PUBLISHABLE_KEY;

export const ManualPaymentEntry = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { staffUser } = useStaffAuth();
  const { user } = useAuth();
  
  console.log('ManualPaymentEntry initialized with:', {
    staffUser: staffUser ? `${staffUser.first_name} ${staffUser.last_name} (${staffUser.staff_role})` : 'None',
    authUser: user ? `${user.email}` : 'None'
  });
  const [amount, setAmount] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [paymentType, setPaymentType] = useState<string>(PAYMENT_TYPES.MONTHLY);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await mysql
        .from('membership_registrations')
        .select('id, first_name, last_name, tns_number, email')
        .eq('registration_status', 'approved')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error("Failed to fetch members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const testAuth = async () => {
    const isSuperAdmin = user?.email === 'brianokutu@gmail.com';
    const hasStaffRole = staffUser && ['Admin', 'Treasurer'].includes(staffUser.staff_role);
    
    console.log('🔍 Authentication Test Results:', {
      userEmail: user?.email,
      isSuperAdmin,
      staffUser: staffUser ? {
        name: `${staffUser.first_name} ${staffUser.last_name}`,
        role: staffUser.staff_role,
        hasPermission: hasStaffRole
      } : 'None',
      canAccessManualPayment: isSuperAdmin || hasStaffRole
    });
    
    if (isSuperAdmin) {
      toast.success('✅ Super Admin Access Granted', {
        description: 'You have super admin privileges (brianokutu@gmail.com)'
      });
    } else if (hasStaffRole) {
      toast.success(`✅ Staff Access Granted (${staffUser.staff_role})`, {
        description: 'You have Admin/Treasurer privileges for manual payment entry'
      });
    } else {
      toast.error('❌ Access Denied', {
        description: 'You need Admin/Treasurer role or super admin access (brianokutu@gmail.com)'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !amount || !paymentDate || !paymentType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    // Validate payment type is one of the allowed types
    const allowedPaymentTypes = Object.values(PAYMENT_TYPES);
    if (!allowedPaymentTypes.includes(paymentType as any)) {
      toast.error("Invalid payment type selected");
      return;
    }

    // Check staff permissions - allow Admin, Treasurer, and super admin
    const isSuperAdmin = user?.email === 'brianokutu@gmail.com';
    const hasStaffRole = staffUser && ['Admin', 'Treasurer'].includes(staffUser.staff_role);
    
    if (!isSuperAdmin && !hasStaffRole) {
      toast.error(`Access denied. Admin/Treasurer role required or super admin access.`);
      return;
    }
    
    console.log('🔐 Access granted:', {
      isSuperAdmin,
      hasStaffRole: hasStaffRole ? staffUser.staff_role : 'None',
      userEmail: user?.email
    });

    setIsLoading(true);
    
    try {
      // Prepare staff user info (handle super admin case)
      const staffInfo = isSuperAdmin && !staffUser ? {
        id: user.id || 'super-admin',
        name: user.email || 'Super Admin',
        role: 'Super Admin'
      } : {
        id: staffUser.id,
        name: `${staffUser.first_name} ${staffUser.last_name}`,
        role: staffUser.staff_role
      };
      
      const paymentData = {
        action: 'manual_payment',
        memberId: selectedMember,
        amount: parseFloat(amount),
        paymentType,
        paymentDate,
        referenceNumber,
        staffUser: staffInfo
      };

      console.log('🚀 Recording manual payment:', paymentData);

      // Use edge function with service role for guaranteed database access
      const response = await fetch(`${MYSQL_FUNCTIONS_BASE_URL}/record-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MYSQL_ANON_KEY}`,
          'apikey': MYSQL_ANON_KEY
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge function failed:', response.status, errorText);
        throw new Error(`Payment recording failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Payment recorded successfully:', result);

      if (!result.success) {
        throw new Error(result.error || 'Payment recording failed');
      }

      // Show success message
      toast.success("✅ Manual payment recorded successfully!", {
        description: `Amount: KES ${parseFloat(amount).toLocaleString()} • Member: ${members.find(m => m.id === selectedMember)?.first_name} ${members.find(m => m.id === selectedMember)?.last_name}`,
        duration: 6000
      });

      // Reset form
      setAmount("");
      setSelectedMember("");
      setReferenceNumber("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentType(PAYMENT_TYPES.MONTHLY);

      // Refresh AdminPortal data
      console.log('🔄 Refreshing AdminPortal data...');
      if (onSuccess) {
        // Wait a moment for database to propagate then refresh
        setTimeout(() => {
          onSuccess();
          console.log('✅ AdminPortal data refresh triggered');
        }, 1000);
      }
    } catch (error: any) {
      console.error('🚨 Edge function failed:', error);
      
      // Try fallback direct database insert
      console.log('⚠️ Attempting fallback direct database insert...');
      
      try {
        // Direct insert to contributions table
        const contributionData = {
          member_id: selectedMember,
          amount: parseFloat(amount),
          contribution_date: paymentDate,
          contribution_type: paymentType,
          status: 'confirmed'
        };
        
        console.log('💾 Inserting contribution directly:', contributionData);
        
        const { data: contributionResult, error: contributionError } = await mysql
          .from('contributions')
          .insert(contributionData)
          .select()
          .single();
          
        if (contributionError) {
          console.error('❌ Contribution insert failed:', contributionError);
          throw contributionError;
        }
        
        console.log('✅ Contribution recorded via fallback:', contributionResult);
        
        // Create MPESA audit record (optional - don't fail if this fails)
        try {
          const mpesaData = {
            member_id: selectedMember,
            amount: parseFloat(amount),
            phone_number: 'Manual Entry (Fallback)',
            mpesa_receipt_number: referenceNumber || `MANUAL_${Date.now()}`,
            status: 'completed',
            result_code: '0',
            result_desc: 'Manual payment entry - fallback method',
            transaction_date: new Date(paymentDate).toISOString()
          };
          
          console.log('💾 Creating MPESA audit record:', mpesaData);
          
          const { error: mpesaError } = await mysql
            .from('mpesa_payments')
            .insert(mpesaData);
            
          if (mpesaError) {
            console.warn('⚠️ MPESA audit record failed (non-critical):', mpesaError);
          } else {
            console.log('✅ MPESA audit record created via fallback');
          }
        } catch (auditError) {
          console.warn('⚠️ MPESA audit failed (non-critical):', auditError);
        }
        
        // Success via fallback
        toast.success("✅ Payment recorded successfully!", {
          description: `Amount: KES ${parseFloat(amount).toLocaleString()} • Recorded via fallback method`,
          duration: 6000
        });
        
        // Reset form
        setAmount("");
        setSelectedMember("");
        setReferenceNumber("");
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentType(PAYMENT_TYPES.MONTHLY);
        
        // Refresh AdminPortal data
        console.log('🔄 Refreshing AdminPortal data after fallback...');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            console.log('✅ AdminPortal data refresh triggered after fallback');
          }, 1000);
        }
        
      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        let errorMessage = "Failed to record payment";
        
        if (fallbackError.message) {
          if (fallbackError.message.includes('permission denied') || fallbackError.message.includes('RLS')) {
            errorMessage = "Permission denied - please ensure you're logged in as an authorized staff member";
          } else if (fallbackError.message.includes('Failed to fetch')) {
            errorMessage = "Network error - please check your connection and try again";
          } else if (fallbackError.message.includes('timeout')) {
            errorMessage = "Request timed out - please try again";
          } else {
            errorMessage = fallbackError.message;
          }
        }
        
        toast.error(`❌ ${errorMessage}`, {
          description: "Both primary and fallback methods failed. Please contact support if this persists.",
          duration: 8000
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Plus className="h-5 w-5" />
          Manual Payment Entry
        </CardTitle>
        <CardDescription>
          Record paybill or cash payments manually
          <br />
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Access: Admin • Treasurer • Super Admin (brianokutu@gmail.com)
          </span>
          <br />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Payment Types: Monthly contribution • Cases • Projects • Registration • Others
          </span>
          <br />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={testAuth}
            className="mt-2 text-xs"
          >
            Test Auth (Debug)
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember} onOpenChange={(open) => {
              if (open && members.length === 0) fetchMembers();
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {loadingMembers ? (
                  <SelectItem value="loading" disabled>Loading members...</SelectItem>
                ) : (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.tns_number} - {member.first_name} {member.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KSH)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type *</Label>
            <Select value={paymentType} onValueChange={(value: string) => setPaymentType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {PAYMENT_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only these payment types are allowed for manual entry
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              type="text"
              placeholder="MPESA receipt or reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading || !selectedMember || !amount}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording Payment...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Paybill: 4148511</p>
          <p>Use this form to record manual payments made via paybill or cash</p>
        </div>
      </CardContent>
    </Card>
  );
};
