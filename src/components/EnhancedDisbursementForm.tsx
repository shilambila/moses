import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Upload, FileText, CheckCircle, AlertCircle, UserMinus } from "lucide-react";
import jsPDF from "jspdf";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  tns_number?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface DisbursementRecord {
  id: string;
  member_id: string;
  amount: number;
  reason: string;
  disbursement_date: string;
  status: string;
  bereavement_form_url?: string;
  created_at: string;
}

interface DocumentRecord {
  id: string;
  disbursement_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_data: string;
  uploaded_by: string;
  uploaded_at: string;
}

export const EnhancedDisbursementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [disbursementType, setDisbursementType] = useState("bereavement");
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Record<string, DocumentRecord>>({});

  // Bereavement form fields
  const [deceasedName, setDeceasedName] = useState("");
  const [relationshipToMember, setRelationshipToMember] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [placeOfDeath, setPlaceOfDeath] = useState("");
  const [causeOfDeath, setCauseOfDeath] = useState("");
  const [funeralDate, setFuneralDate] = useState("");
  const [funeralVenue, setFuneralVenue] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  useEffect(() => {
    fetchMembers();
    fetchDisbursements();
  }, []);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("membership_registrations")
        .select("id, first_name, last_name, tns_number, phone, email, address")
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

  const fetchDisbursements = async () => {
    try {
      const { data, error } = await supabase
        .from("disbursements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setDisbursements(data || []);
      
      // Fetch associated documents
      if (data && data.length > 0) {
        const disbursementIds = data.map(d => d.id);
        const { data: docsData, error: docsError } = await supabase
          .from("disbursement_documents")
          .select("*")
          .in("disbursement_id", disbursementIds);
        
        if (docsError) {
          if (docsError.message?.includes('does not exist') || docsError.message?.includes('schema cache')) {
            console.warn('Document storage table not found. Document features will be limited.');
            // Set empty documents map but don't show error to user
            setDocuments({});
          } else {
            console.error('Error fetching documents:', docsError);
          }
        } else if (docsData) {
          const docsMap: Record<string, DocumentRecord> = {};
          docsData.forEach(doc => {
            docsMap[doc.disbursement_id] = doc;
          });
          setDocuments(docsMap);
        }
      }
    } catch (error) {
      console.error("Error fetching disbursements:", error);
    }
  };

  const generateBereavementPDF = () => {
    const selectedMemberData = members.find(m => m.id === selectedMember);
    if (!selectedMemberData) {
      toast.error("Please select a member first");
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("TEAM NO STRUGGLE EVOLUTION", pageWidth / 2, 30, { align: "center" });
    
    pdf.setFontSize(16);
    pdf.text("BEREAVEMENT DISBURSEMENT FORM", pageWidth / 2, 45, { align: "center" });
    
    // Draw a line
    pdf.setLineWidth(0.5);
    pdf.line(20, 55, pageWidth - 20, 55);
    
    // Form content
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    
    let yPosition = 75;
    const lineHeight = 8;
    
    // Member Information
    pdf.setFont("helvetica", "bold");
    pdf.text("MEMBER INFORMATION:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.text(`Member Name: ${selectedMemberData.first_name} ${selectedMemberData.last_name}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`TNS Number: ${selectedMemberData.tns_number || 'N/A'}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Phone: ${selectedMemberData.phone || 'N/A'}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Email: ${selectedMemberData.email || 'N/A'}`, 20, yPosition);
    yPosition += lineHeight + 10;
    
    // Bereavement Details
    pdf.setFont("helvetica", "bold");
    pdf.text("BEREAVEMENT DETAILS:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    const formFields = [
      "Name of Deceased: _________________________________________________",
      "",
      "Relationship to Member: ___________________________________________",
      "",
      "Date of Death: ___________________________________________________",
      "",
      "Place of Death: __________________________________________________",
      "",
      "Cause of Death: __________________________________________________",
      "",
      "Funeral Date: ____________________________________________________",
      "",
      "Funeral Venue: ___________________________________________________",
      "",
      "Next of Kin Name: ________________________________________________",
      "",
      "Next of Kin Phone: _______________________________________________",
      ""
    ];
    
    formFields.forEach(field => {
      pdf.text(field, 20, yPosition);
      yPosition += lineHeight;
    });
    
    yPosition += 10;
    
    // Additional Information
    pdf.setFont("helvetica", "bold");
    pdf.text("ADDITIONAL INFORMATION:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.text("Any additional details or special circumstances:", 20, yPosition);
    yPosition += lineHeight;
    
    // Draw lines for writing space
    for (let i = 0; i < 4; i++) {
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += lineHeight;
    }
    
    yPosition += 15;
    
    // Signature Section
    pdf.setFont("helvetica", "bold");
    pdf.text("DECLARATIONS:", 20, yPosition);
    yPosition += lineHeight + 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.text("Member Signature: _________________________ Date: _______________", 20, yPosition);
    yPosition += lineHeight + 10;
    pdf.text("Witness Signature: ________________________ Date: _______________", 20, yPosition);
    yPosition += lineHeight + 10;
    pdf.text("Treasurer Signature: ______________________ Date: _______________", 20, yPosition);
    
    // Footer
    yPosition += 20;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.text("This form must be completed and returned with supporting documents before disbursement.", pageWidth / 2, yPosition, { align: "center" });
    pdf.text(`Form generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition + 8, { align: "center" });
    
    // Save the PDF
    const fileName = `Bereavement_Form_${selectedMemberData.first_name}_${selectedMemberData.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    toast.success("Bereavement form downloaded successfully!");
  };

  const handleFileUpload = async (disbursementId: string) => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // File size validation (5MB limit for database storage)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes (reduced for database storage)
    if (uploadedFile.size > maxSize) {
      toast.error("File size must be less than 5MB for database storage");
      return;
    }

    // File type validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(uploadedFile.type)) {
      toast.error("Please upload a valid file type (PDF, DOC, DOCX, JPG, PNG)");
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting file upload to database...', {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        disbursementId
      });

      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove the data:mime;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(uploadedFile);
      });

      console.log('File converted to base64, length:', fileBase64.length);

      // Check if a document already exists for this disbursement
      const { data: existingDocs, error: checkError } = await supabase
        .from('disbursement_documents')
        .select('id')
        .eq('disbursement_id', disbursementId);

      if (checkError) {
        console.error('Error checking existing documents:', checkError);
        if (checkError.message?.includes('does not exist') || checkError.message?.includes('schema cache')) {
          throw new Error('Database table not found. Please contact your administrator to set up the document storage table.');
        }
        throw checkError;
      }

      const staffInfo = localStorage.getItem('staff_user');
      const staffUser = staffInfo ? JSON.parse(staffInfo) : null;
      const uploadedBy = staffUser ? `${staffUser.first_name} ${staffUser.last_name} (${staffUser.staff_role})` : 'Unknown';

      if (existingDocs && existingDocs.length > 0) {
        // Update existing document
        console.log('Updating existing document...');
        const { error: updateError } = await supabase
          .from('disbursement_documents')
          .update({
            filename: uploadedFile.name,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
            file_data: fileBase64,
            uploaded_by: uploadedBy,
            uploaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('disbursement_id', disbursementId);

        if (updateError) {
          console.error('Error updating document:', updateError);
          throw updateError;
        }
      } else {
        // Insert new document
        console.log('Inserting new document...');
        const { error: insertError } = await supabase
          .from('disbursement_documents')
          .insert({
            disbursement_id: disbursementId,
            filename: uploadedFile.name,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
            file_data: fileBase64,
            uploaded_by: uploadedBy
          });

        if (insertError) {
          console.error('Error inserting document:', insertError);
          throw insertError;
        }
      }

      // Update disbursement record to indicate a document has been uploaded
      const { error: disbursementUpdateError } = await supabase
        .from('disbursements')
        .update({ bereavement_form_url: 'database_stored' })
        .eq('id', disbursementId);

      if (disbursementUpdateError) {
        console.error('Error updating disbursement:', disbursementUpdateError);
        // Don't throw error here as the document was uploaded successfully
      }

      console.log('Document uploaded successfully to database');
      toast.success("Document uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadedFile(null);
      await fetchDisbursements(); // Refresh the list
    } catch (error: any) {
      console.error("Error uploading document:", error);
      
      let errorMessage = "Failed to upload document";
      if (error.message?.includes('Database table not found')) {
        errorMessage = "Document storage not set up. Please ask your administrator to run the database setup script.";
      } else if (error.message?.includes('File reading failed')) {
        errorMessage = "Could not read the file. Please try again.";
      } else if (error.message?.includes('base64')) {
        errorMessage = "File conversion failed. Please try a different file.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Permission denied. Please check your access rights.";
      } else if (error.message?.includes('size')) {
        errorMessage = "File is too large. Please upload a file smaller than 5MB.";
      } else if (error.message?.includes('type')) {
        errorMessage = "Unsupported file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.";
      } else if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        errorMessage = "Document storage table not found. Please contact your administrator.";
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const viewDatabaseDocument = (disbursementId: string) => {
    const doc = documents[disbursementId];
    if (!doc) {
      toast.error("Document not found");
      return;
    }

    try {
      // Convert base64 back to blob
      const byteCharacters = atob(doc.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.file_type });
      
      // Create download URL and open in new tab
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      
      // For PDFs and images, open in new tab; for others, download
      if (doc.file_type === 'application/pdf' || doc.file_type.startsWith('image/')) {
        window.open(url, '_blank');
      } else {
        link.click();
      }
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success("Document opened successfully");
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error("Failed to open document");
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
      // Record the disbursement
      const { data: disbursementData, error: disbursementError } = await supabase
        .from("disbursements")
        .insert({
          member_id: selectedMember,
          amount: numAmount,
          disbursement_date: disbursementDate,
          reason: reason,
          status: "approved"
        })
        .select()
        .single();

      if (disbursementError) throw disbursementError;

      // Update member balance
      const { data: currentBalance } = await supabase
        .from("member_balances")
        .select("current_balance, total_disbursements")
        .eq("member_id", selectedMember)
        .single();

      if (currentBalance) {
        await supabase
          .from("member_balances")
          .update({
            current_balance: Number(currentBalance.current_balance) - numAmount,
            total_disbursements: Number(currentBalance.total_disbursements) + numAmount,
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
      
      fetchDisbursements();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error recording disbursement:", error);
      toast.error("Failed to record disbursement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="new-disbursement" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-disbursement">New Disbursement</TabsTrigger>
          <TabsTrigger value="manage-documents">Manage Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-disbursement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5" />
                Record Disbursement
              </CardTitle>
              <CardDescription>
                Record a disbursement payment to a member and generate bereavement forms if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="disbursementType">Disbursement Type *</Label>
                    <Select value={disbursementType} onValueChange={setDisbursementType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bereavement">Bereavement</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Record Disbursement
                      </>
                    )}
                  </Button>

                  {disbursementType === "bereavement" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateBereavementPDF}
                      disabled={!selectedMember}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Bereavement Form
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Disbursement Document Management
              </CardTitle>
              <CardDescription>
                Upload completed bereavement forms and manage disbursement documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disbursements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No disbursements found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disbursements.map((disbursement) => {
                      const member = members.find(m => m.id === disbursement.member_id);
                      return (
                        <div key={disbursement.id} className="border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {member ? `${member.first_name} ${member.last_name}` : 'Unknown Member'}
                                </span>
                                <Badge variant="outline">
                                  KES {disbursement.amount.toLocaleString()}
                                </Badge>
                                <Badge variant={disbursement.status === 'approved' ? 'default' : 'secondary'}>
                                  {disbursement.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {disbursement.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Date: {new Date(disbursement.disbursement_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const hasDoc = documents[disbursement.id] || (disbursement.bereavement_form_url && disbursement.bereavement_form_url !== 'database_stored');
                                const databaseDoc = documents[disbursement.id];
                                
                                if (hasDoc) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <div className="flex flex-col">
                                        <span className="text-sm text-green-600">Document uploaded</span>
                                        {databaseDoc && (
                                          <span className="text-xs text-gray-500">
                                            {databaseDoc.filename} • {(databaseDoc.file_size / 1024 / 1024).toFixed(2)} MB
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (databaseDoc) {
                                            viewDatabaseDocument(disbursement.id);
                                          } else if (disbursement.bereavement_form_url) {
                                            window.open(disbursement.bereavement_form_url, '_blank');
                                          }
                                        }}
                                      >
                                        <FileText className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                      {databaseDoc && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setSelectedDisbursementId(disbursement.id);
                                            setIsUploadModalOpen(true);
                                          }}
                                          title="Replace document"
                                        >
                                          <Upload className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                      <span className="text-sm text-orange-600">No document</span>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setSelectedDisbursementId(disbursement.id);
                                          setIsUploadModalOpen(true);
                                        }}
                                      >
                                        <Upload className="h-4 w-4 mr-1" />
                                        Upload
                                      </Button>
                                    </div>
                                  );
                                }
                              })()
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bereavement Form</DialogTitle>
            <DialogDescription>
              Upload the completed bereavement form for this disbursement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document">Select Document *</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
              </p>
              {uploadedFile && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              {isUploading && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading document... Please wait.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!isUploading) {
                  setIsUploadModalOpen(false);
                  setUploadedFile(null);
                }
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedDisbursementId && handleFileUpload(selectedDisbursementId)}
              disabled={!uploadedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
