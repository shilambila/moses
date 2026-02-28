import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { mysql } from "@/integrations/mysql/client";
import { toast } from "sonner";
import { Loader2, Phone, DollarSign } from "lucide-react";

interface MPESAPaymentProps {
  memberId: string;
  memberName?: string;
}

export const MPESAPayment = ({ memberId, memberName }: MPESAPaymentProps) => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || !phoneNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await mysql.functions.invoke('mpesa-stk-push', {
        body: {
          action: 'stk_push',
          memberId,
          amount: parseFloat(amount),
          phoneNumber
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("STK push sent! Please check your phone and enter your MPESA PIN.");
        setAmount("");
        setPhoneNumber("");
      } else {
        toast.error(data.error || "Payment failed");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5" />
          MPESA Payment
        </CardTitle>
        <CardDescription>
          {memberName ? `Make payment for ${memberName}` : 'Make your membership payment'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (KSH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            min="1"
            step="0.01"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label> 
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="phone"
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your Safaricom number (format: 0712345678)
          </p>
        </div>

        <Button 
          onClick={handlePayment} 
          className="w-full"
          disabled={isLoading || !amount || !phoneNumber}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending STK Push...
            </>
          ) : (
            'Pay via MPESA'
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>Paybill: 4148511</p>
          <p>You will receive an STK push notification on your phone</p>
        </div>
      </CardContent>
    </Card>
  );
};
