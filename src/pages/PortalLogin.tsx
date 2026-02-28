import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ArrowLeft, Users, FileText, BarChart3, Calculator } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { getAuthorizedPortalPath, getAccessiblePortals, PORTAL_ROLES } from "@/hooks/useRoleGuard";
import { toast } from "sonner";

const PortalLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading, staffUser } = useStaffAuth();

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      const stored = localStorage.getItem('staff_user');
      const staff = staffUser || (stored ? JSON.parse(stored) : null);
      const role = staff?.staff_role;
      const userEmail = staff?.email;
      
      // If a specific portal was selected, try to navigate there
      let target: string;
      if (selectedPortal) {
        const portalMap: Record<string, string> = {
          'admin': '/admin',
          'secretary': '/secretary',
          'coordinator': '/coordinator', 
          'auditor': '/auditor'
        };
        target = portalMap[selectedPortal] || getAuthorizedPortalPath(role, userEmail);
      } else {
        // Otherwise, redirect to the default portal for their role
        target = getAuthorizedPortalPath(role, userEmail);
      }
      
      toast.success(`Welcome to ${role || 'Staff'} Portal`);
      navigate(target);
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  const getPortalIcon = (portal: string) => {
    switch (portal) {
      case 'admin': return <Shield className="h-5 w-5" />;
      case 'secretary': return <FileText className="h-5 w-5" />;
      case 'coordinator': return <Users className="h-5 w-5" />;
      case 'auditor': return <Calculator className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getPortalName = (portal: string) => {
    switch (portal) {
      case 'admin': return 'Admin Portal';
      case 'secretary': return 'Secretary Portal';
      case 'coordinator': return 'Coordinator Portal';
      case 'auditor': return 'Auditor Portal';
      default: return 'Portal';
    }
  };

  const getPortalDescription = (portal: string) => {
    switch (portal) {
      case 'admin': return 'Full administrative access and management';
      case 'secretary': return 'Document and communication management';
      case 'coordinator': return 'Area coordination and member management';
      case 'auditor': return 'Financial auditing and compliance';
      default: return 'Portal access';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Staff Portal Login</CardTitle>
            <CardDescription>
              Enter your staff email and portal password
              {selectedPortal && (
                <Badge variant="secondary" className="mt-2 flex items-center gap-2 w-fit mx-auto">
                  {getPortalIcon(selectedPortal)}
                  Selected: {getPortalName(selectedPortal)}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePortalLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Staff Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Portal Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter portal password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login to Portal"
                )}
              </Button>
            </form>

            <div className="mt-4 space-y-4">
              {/* Portal Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Portal Access (Optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['admin', 'secretary', 'coordinator', 'auditor'].map((portal) => (
                    <Button
                      key={portal}
                      type="button"
                      variant={selectedPortal === portal ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPortal(selectedPortal === portal ? null : portal)}
                      className="h-auto p-3 flex flex-col items-center gap-1"
                    >
                      {getPortalIcon(portal)}
                      <span className="text-xs">{portal.charAt(0).toUpperCase() + portal.slice(1)}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Select a portal or leave empty to use your default access
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Contact your administrator for portal passwords
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalLogin;