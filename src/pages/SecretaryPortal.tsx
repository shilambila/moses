import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  FileText, 
  Calendar, 
  Phone, 
  MessageSquare,
  Download,
  Search,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  CalendarPlus,
  UserPlus,
  Filter,
  RefreshCw,
  BookOpen,
  ClipboardList,
  MapPin,
  Star,
  TrendingUp,
  Activity,
  Target,
  Award
} from "lucide-react";
import { DocumentList } from "@/components/DocumentList";
import { CommunicationCenter } from "@/components/CommunicationCenter";
import { useCrossPortalSync } from "@/hooks/useCrossPortalSync";
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  registration_status: string;
  payment_status?: string;
  tns_number?: string;
  profile_picture_url?: string;
  created_at?: string;
  sex?: string;
  marital_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: 'meeting' | 'training' | 'social' | 'other';
  status: 'planned' | 'confirmed' | 'cancelled' | 'completed';
  max_attendees?: number;
  created_at: string;
  created_by: string;
}

interface Meeting {
  id: string;
  title: string;
  agenda: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  meeting_type: 'regular' | 'emergency' | 'special';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendees?: string[];
  minutes?: string;
  action_items?: string[];
  created_at: string;
}

interface DashboardStats {
  total_members: number;
  active_members: number;
  pending_registrations: number;
  total_documents: number;
  upcoming_events: number;
  recent_communications: number;
  this_month_registrations: number;
  document_shares_this_week: number;
}

const SecretaryPortal = () => {
  const { staffUser, logout } = useStaffAuth();
  const { isAuthorized, isLoading: roleLoading } = useRoleGuard({ portal: 'secretary' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_members: 0,
    active_members: 0,
    pending_registrations: 0,
    total_documents: 0,
    upcoming_events: 0,
    recent_communications: 0,
    this_month_registrations: 0,
    document_shares_this_week: 0
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  
  // Modal and form states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Set up cross-portal synchronization for member data
  useCrossPortalSync({
    onRefreshRequired: (source: string, reason: string) => {
      console.log(`SecretaryPortal: Refreshing data due to: ${reason} (from: ${source})`);
      fetchData();
    },
    portalName: 'SecretaryPortal',
    autoRefresh: true
  });

  useEffect(() => {
    // Role guard handles authentication and authorization
    if (isAuthorized && !roleLoading) {
      fetchData();
    }
  }, [isAuthorized, roleLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all members with comprehensive data
      const { data: memberData, error: memberError } = await supabase
        .from('membership_registrations')
        .select('*')
        .order('first_name');

      if (memberError) {
        console.error('Error fetching members:', memberError);
        toast.error('Failed to load member directory');
      } else {
        setMembers(memberData || []);
      }

      // Fetch documents count
      const { count: documentsCount, error: documentsError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Fetch recent communications count (using documents as a proxy since member_notifications doesn't exist)
      const { count: communicationsCount, error: commsError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate statistics
      const totalMembers = memberData?.length || 0;
      const activeMembers = memberData?.filter(m => m.registration_status === 'approved').length || 0;
      const pendingRegistrations = memberData?.filter(m => m.registration_status === 'pending').length || 0;
      const thisMonthRegistrations = memberData?.filter(m => {
        const createdDate = new Date(m.created_at || '');
        const currentDate = new Date();
        return createdDate.getMonth() === currentDate.getMonth() && 
               createdDate.getFullYear() === currentDate.getFullYear();
      }).length || 0;

      setDashboardStats({
        total_members: totalMembers,
        active_members: activeMembers,
        pending_registrations: pendingRegistrations,
        total_documents: documentsCount || 0,
        upcoming_events: events.filter(e => new Date(e.event_date) > new Date()).length,
        recent_communications: communicationsCount || 0,
        this_month_registrations: thisMonthRegistrations,
        document_shares_this_week: 0 // This would need document_shares table
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleSignOut = () => {
    logout();
    navigate("/portal-login");
    toast.success("Signed out successfully");
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.tns_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${member.city}, ${member.state}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = memberFilter === "all" || 
                         (memberFilter === "approved" && member.registration_status === "approved") ||
                         (memberFilter === "pending" && member.registration_status === "pending") ||
                         (memberFilter === "paid" && member.payment_status === "paid") ||
                         (memberFilter === "unpaid" && member.payment_status !== "paid");
    
    return matchesSearch && matchesFilter;
  });

  const exportMemberDirectory = async () => {
    try {
      const csvContent = [
        ['TNS Number', 'Name', 'Email', 'Phone', 'Location'].join(','),
        ...filteredMembers.map(member => [
          member.tns_number || '',
          `${member.first_name} ${member.last_name}`,
          member.email,
          member.phone,
          `${member.city}, ${member.state}`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'member-directory.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Member directory exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export directory");
    }
  };

  // Show loading state while checking authorization or loading data
  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground font-medium">
            {roleLoading ? 'Verifying secretary access...' : 'Loading Secretary Portal...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authorized, the role guard will handle redirection
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">🚫</div>
          <div className="space-y-2">
            <p className="text-red-600 dark:text-red-400 font-bold text-xl">Access Denied</p>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access the Secretary Portal.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to appropriate portal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {staffUser?.first_name?.[0]}{staffUser?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Secretary Portal
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome back, {staffUser?.first_name} {staffUser?.last_name} • {format(new Date(), 'EEEE, MMMM do, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
              <Badge variant="secondary">
                Secretary Role
              </Badge>
            </div>
          </div>

          {/* Dashboard Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Members</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardStats.total_members}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-muted-foreground">+{dashboardStats.this_month_registrations} this month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Active Members</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{dashboardStats.active_members}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Target className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-muted-foreground">
                    {((dashboardStats.active_members / Math.max(dashboardStats.total_members, 1)) * 100).toFixed(1)}% approval rate
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Documents</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardStats.total_documents}</div>
                <div className="flex items-center gap-1 mt-1">
                  <BookOpen className="h-3 w-3 text-purple-600" />
                  <p className="text-xs text-muted-foreground">Managed documents</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Communications</CardTitle>
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{dashboardStats.recent_communications}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Send className="h-3 w-3 text-orange-600" />
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-12">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Communications</span>
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Directory</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Quick Actions Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common secretarial tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setIsMeetingModalOpen(true)}>
                      <div className="flex items-center gap-3">
                        <CalendarPlus className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-semibold">Schedule Meeting</div>
                          <div className="text-sm text-muted-foreground">Create new meeting agenda</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setIsEventModalOpen(true)}>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-semibold">Create Event</div>
                          <div className="text-sm text-muted-foreground">Plan organizational event</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4" onClick={exportMemberDirectory}>
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-semibold">Export Directory</div>
                          <div className="text-sm text-muted-foreground">Download member list</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-semibold">Generate Reports</div>
                          <div className="text-sm text-muted-foreground">Create activity summary</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium">New member registration</p>
                        <p className="text-muted-foreground text-xs">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium">Document shared</p>
                        <p className="text-muted-foreground text-xs">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium">Meeting scheduled</p>
                        <p className="text-muted-foreground text-xs">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Growth Chart */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Member Analytics
                  </CardTitle>
                  <CardDescription>
                    Overview of membership statistics and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Registration Rate</span>
                        <Badge variant="secondary">
                          {((dashboardStats.active_members / Math.max(dashboardStats.total_members, 1)) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={(dashboardStats.active_members / Math.max(dashboardStats.total_members, 1)) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Monthly Growth</span>
                        <Badge variant="secondary">{dashboardStats.this_month_registrations}</Badge>
                      </div>
                      <Progress value={(dashboardStats.this_month_registrations / Math.max(dashboardStats.total_members, 1)) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Communications</span>
                        <Badge variant="secondary">{dashboardStats.recent_communications}</Badge>
                      </div>
                      <Progress value={Math.min(dashboardStats.recent_communications * 10, 100)} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Document Management</span>
                        <Badge variant="secondary">{dashboardStats.total_documents}</Badge>
                      </div>
                      <Progress value={Math.min(dashboardStats.total_documents * 5, 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-6">
            <CommunicationCenter />
          </TabsContent>

          {/* Member Directory Tab */}
          <TabsContent value="directory" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Member Directory
                      <Badge variant="secondary">{filteredMembers.length} of {members.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Comprehensive member database with search and filtering capabilities
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                    <Button onClick={exportMemberDirectory} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Directory
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Enhanced Search and Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, phone, TNS number, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members ({members.length})</SelectItem>
                      <SelectItem value="approved">Approved ({members.filter(m => m.registration_status === 'approved').length})</SelectItem>
                      <SelectItem value="pending">Pending ({members.filter(m => m.registration_status === 'pending').length})</SelectItem>
                      <SelectItem value="paid">Paid ({members.filter(m => m.payment_status === 'paid').length})</SelectItem>
                      <SelectItem value="unpaid">Unpaid ({members.filter(m => m.payment_status !== 'paid').length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Member Statistics Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{members.length}</p>
                      </div>
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Approved</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{members.filter(m => m.registration_status === 'approved').length}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending</p>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{members.filter(m => m.registration_status === 'pending').length}</p>
                      </div>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Areas</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{[...new Set(members.map(m => `${m.city}, ${m.state}`))].length}</p>
                      </div>
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member, index) => (
                        <TableRow key={member.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                          <TableCell>
                            <Avatar className="h-10 w-10 border-2 border-muted">
                              <AvatarImage src={member.profile_picture_url} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground">
                                {member.first_name?.[0]}{member.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{member.first_name} {member.last_name}</p>
                                {member.sex && (
                                  <Badge variant="outline" className="text-xs">
                                    {member.sex}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={member.tns_number ? "secondary" : "outline"} className="text-xs">
                                  TNS: {member.tns_number || 'Pending'}
                                </Badge>
                                {member.marital_status && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {member.marital_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-32">{member.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{member.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{member.city}, {member.state}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={member.registration_status === 'approved' ? 'default' : member.registration_status === 'pending' ? 'secondary' : 'destructive'}
                              className="capitalize"
                            >
                              <div className="flex items-center gap-1">
                                {member.registration_status === 'approved' ? 
                                  <CheckCircle className="h-3 w-3" /> : 
                                  member.registration_status === 'pending' ?
                                  <Clock className="h-3 w-3" /> :
                                  <AlertCircle className="h-3 w-3" />
                                }
                                {member.registration_status}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={member.payment_status === 'paid' ? 'default' : 'outline'}
                              className={member.payment_status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'border-orange-200 text-orange-600'}
                            >
                              {member.payment_status === 'paid' ? 'Paid' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(`tel:${member.phone}`)}
                                title="Call member"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(`mailto:${member.email}`)}
                                title="Email member"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="View member profile"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Edit member"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No members found matching your search.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentList />
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Meeting Schedule Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Meeting Schedule
                      </CardTitle>
                      <CardDescription>
                        Manage organizational meetings and agendas
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsMeetingModalOpen(true)}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      New Meeting
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Upcoming Meetings */}
                    <div className="space-y-3">
                      {/* Sample meeting items */}
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">Monthly Board Meeting</h4>
                                <Badge variant="secondary">Regular</Badge>
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                  Scheduled
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(addDays(new Date(), 7), 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  2:00 PM - 4:00 PM
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  Conference Room
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Monthly review of organizational activities and future planning.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="View Agenda">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Edit Meeting">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Send Invitations">
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">Emergency Planning Session</h4>
                                <Badge variant="destructive">Emergency</Badge>
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                  Pending
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(addDays(new Date(), 14), 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  10:00 AM - 12:00 PM
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  Main Hall
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Special session to address urgent organizational matters.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="View Agenda">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Edit Meeting">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Send Invitations">
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-center py-4">
                      <Button variant="outline" onClick={() => setIsMeetingModalOpen(true)}>
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        Schedule New Meeting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meeting Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Meeting Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">This Month</span>
                        <Badge variant="secondary">4</Badge>
                      </div>
                      <Progress value={80} className="h-2" />
                      <p className="text-xs text-muted-foreground">4 meetings scheduled</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Upcoming This Week</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Board Meeting</span>
                          <span className="text-muted-foreground">Mon</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Staff Review</span>
                          <span className="text-muted-foreground">Wed</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Meeting Types</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>Regular</span>
                          </div>
                          <span>2</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span>Emergency</span>
                          </div>
                          <span>1</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span>Special</span>
                          </div>
                          <span>1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meeting Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Meeting Management Tools
                </CardTitle>
                <CardDescription>
                  Quick actions for meeting administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">View Calendar</div>
                        <div className="text-sm text-muted-foreground">Meeting schedule</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Meeting Minutes</div>
                        <div className="text-sm text-muted-foreground">Record keeping</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Attendance</div>
                        <div className="text-sm text-muted-foreground">Track participation</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Reports</div>
                        <div className="text-sm text-muted-foreground">Generate summaries</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Event Calendar Overview */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Event Management
                      </CardTitle>
                      <CardDescription>
                        Organize and coordinate organizational events, activities, and social gatherings
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsEventModalOpen(true)}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Event Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        All Events (5)
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                        Upcoming (3)
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                        This Month (2)
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                        Completed (2)
                      </Badge>
                    </div>

                    {/* Upcoming Events */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Upcoming Events
                      </h3>
                      
                      <div className="space-y-3">
                        <Card className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">Annual General Meeting</h4>
                                  <Badge variant="default">Meeting</Badge>
                                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                    Confirmed
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(addDays(new Date(), 10), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    9:00 AM - 5:00 PM
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Community Center
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    150 max
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Annual review, financial reports, and election of new officials.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Edit Event">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Send Invitations">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">Skills Development Workshop</h4>
                                  <Badge variant="secondary">Training</Badge>
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    Confirmed
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(addDays(new Date(), 18), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    10:00 AM - 3:00 PM
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Training Hall
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    30 max
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Professional development workshop focusing on leadership and communication skills.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Edit Event">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Send Invitations">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">Team Building Retreat</h4>
                                  <Badge variant="outline">Social</Badge>
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                    Planning
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(addDays(new Date(), 25), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Full Day
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Resort Venue
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    All members
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Annual team building activities, games, and networking event for all members.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Edit Event">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Send Invitations">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Event Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Event Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">This Quarter</span>
                        <Badge variant="secondary">8</Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground">3 remaining</p>
                    </div>

                    <Separator />

                    {/* Event Types */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Event Categories</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>Meetings</span>
                          </div>
                          <span>3</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Training</span>
                          </div>
                          <span>2</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span>Social</span>
                          </div>
                          <span>2</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span>Other</span>
                          </div>
                          <span>1</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Attendance Analytics */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Avg. Attendance</h4>
                      <div className="text-2xl font-bold text-primary">85%</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span>+5% from last quarter</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Management Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Event Management Tools
                </CardTitle>
                <CardDescription>
                  Quick access to event planning and management features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setIsEventModalOpen(true)}>
                    <div className="flex items-center gap-3">
                      <CalendarPlus className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">New Event</div>
                        <div className="text-sm text-muted-foreground">Create & schedule</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Attendee List</div>
                        <div className="text-sm text-muted-foreground">Manage RSVPs</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Invitations</div>
                        <div className="text-sm text-muted-foreground">Send & track</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Analytics</div>
                        <div className="text-sm text-muted-foreground">Event reports</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Administrative Reports</CardTitle>
                <CardDescription>
                  Generate and download various reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-8 w-8 text-chart-1" />
                        <div>
                          <h3 className="font-semibold">Member Directory Report</h3>
                          <p className="text-sm text-muted-foreground">Complete member listing</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={exportMemberDirectory}>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="h-8 w-8 text-chart-2" />
                        <div>
                          <h3 className="font-semibold">Communication Log</h3>
                          <p className="text-sm text-muted-foreground">Inquiry and response history</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecretaryPortal;
