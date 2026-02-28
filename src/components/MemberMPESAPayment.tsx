import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, DollarSign, Phone, User } from "lucide-react";
import { MPESAPayment } from "./MPESAPayment";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tns_number?: string;
  profile_picture_url?: string;
  registration_status: string;
  payment_status: string;
}

export const MemberMPESAPayment = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchApprovedMembers();
  }, []);

  const fetchApprovedMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("id, first_name, last_name, email, phone, tns_number, profile_picture_url, registration_status, payment_status")
        .eq("registration_status", "approved")
        .order("first_name", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member || null);
    setShowPaymentForm(false);
  };

  const handleProceedToPayment = () => {
    if (!selectedMember) {
      toast.error("Please select a member first");
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedMember(null);
    fetchApprovedMembers(); // Refresh member list
    toast.success("Payment completed successfully! Transaction details will be updated shortly.");
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading members...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Member MPESA Payments
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Process MPESA payments for registered members using Paybill 4148511
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showPaymentForm ? (
            <>
              {/* Member Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-select" className="text-sm font-medium">
                    Select Member for Payment
                  </Label>
                  <Select onValueChange={handleMemberSelect}>
                    <SelectTrigger id="member-select" className="w-full">
                      <SelectValue placeholder="Choose a registered member..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={member.profile_picture_url || undefined}
                                alt={`${member.first_name} ${member.last_name}`}
                              />
                              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">
                                {member.first_name} {member.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.tns_number ? `TNS: ${member.tns_number}` : 'No TNS'} • {member.email}
                              </div>
                            </div>
                            <Badge 
                              variant={member.payment_status === 'paid' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {member.payment_status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Member Preview */}
                {selectedMember && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-green-200 dark:border-green-700">
                        <AvatarImage 
                          src={selectedMember.profile_picture_url || undefined}
                          alt={`${selectedMember.first_name} ${selectedMember.last_name}`}
                        />
                        <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          {selectedMember.first_name.charAt(0)}{selectedMember.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {selectedMember.first_name} {selectedMember.last_name}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4" />
                            <span>{selectedMember.tns_number || 'TNS Not Assigned'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4" />
                            <span>{selectedMember.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={selectedMember.payment_status === 'paid' ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {selectedMember.payment_status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Status: {selectedMember.registration_status}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!selectedMember}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Proceed to MPESA Payment
                  </Button>
                  {selectedMember && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMember(null)}
                      className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/20"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">{members.length}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Registered Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {members.filter(m => m.payment_status === 'paid').length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Paid Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {members.filter(m => m.payment_status === 'pending').length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Pending Payments</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* MPESA Payment Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  MPESA Payment for {selectedMember?.first_name} {selectedMember?.last_name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                  className="text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/20"
                >
                  ← Back to Selection
                </Button>
              </div>
              
              <div className="flex justify-center">
                {selectedMember && (
                  <MPESAPayment 
                    memberId={selectedMember.id}
                    memberName={`${selectedMember.first_name} ${selectedMember.last_name}`}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
