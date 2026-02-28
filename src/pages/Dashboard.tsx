import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FileText, DollarSign, Settings, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffRole {
  id: string;
  staff_role: string;
  pending: string;
  assigned_area?: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchUserRole();
  }, [user, navigate]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_registrations")
        .select("*")
        .eq("user_id", user?.id)
        .eq("pending", "approved")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching staff role:", error);
        return;
      }

      setStaffRole(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast.success("Successfully signed out");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const navigateToPortal = (portal: string) => {
    navigate(`/${portal}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!staffRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You don't have an approved staff role. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRolePortals = () => {
    const portals = [];
    
    switch (staffRole.staff_role) {
      case "Area Coordinator":
        portals.push({
          title: "Area Coordinator Portal",
          description: "Manage members in your assigned area",
          icon: Users,
          route: "coordinator",
          area: staffRole.assigned_area
        });
        break;
        
      case "General Coordinator":
        portals.push({
          title: "General Coordinator Portal",
          description: "Oversee all coordinators and approve tasks",
          icon: Settings,
          route: "general-coordinator"
        });
        break;
        
      case "Secretary":
        portals.push({
          title: "Secretary Portal",
          description: "Handle administrative tasks and documentation",
          icon: FileText,
          route: "secretary"
        });
        break;
        
      case "Customer Service":
        portals.push({
          title: "Customer Service Portal",
          description: "Access all areas for customer support",
          icon: Users,
          route: "customer-service"
        });
        break;
        
      case "Auditor":
        portals.push({
          title: "Auditor Portal",
          description: "Review financial data and generate reports",
          icon: DollarSign,
          route: "auditor"
        });
        break;
        
        case "Treasurer":
        portals.push({
          title: "Treasurer Portal",
          description: "Manage treasury and financial operations",
          icon: DollarSign,
          route: "treasurer"
        });
        break;
        
      case "Admin":
        portals.push({
          title: "Admin Portal",
          description: "Approve members and manage staff registrations",
          icon: Shield,
          route: "admin"
        });
        break;
    }
    
    return portals;
  };

  const portals = getRolePortals();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">TNS Dashboard</h1>
            <p className="text-muted-foreground">Welcome back!</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Role</CardTitle>
                  <CardDescription>Current assignment and permissions</CardDescription>
                </div>
                <Badge variant="secondary">{staffRole.staff_role}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {staffRole.assigned_area && (
                <p className="text-sm text-muted-foreground">
                  Assigned Area: <span className="font-semibold">{staffRole.assigned_area}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => (
            <Card 
              key={portal.route} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateToPortal(portal.route)}
            >
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <portal.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{portal.title}</CardTitle>
                </div>
                <CardDescription>{portal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {portal.area && (
                  <p className="text-sm text-muted-foreground">Area: {portal.area}</p>
                )}
                <Button className="w-full mt-4">
                  Access Portal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;