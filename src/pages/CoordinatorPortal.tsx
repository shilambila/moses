import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Download, 
  Search, 
  ArrowLeft, 
  Users, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare,
  Send,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  UserCheck,
  Clock,
  Calendar,
  Target,
  Award,
  Settings,
  Bell,
  Plus,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  X,
  XCircle,
  Hash,
  Calculator,
  FileSpreadsheet,
  FileText,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCrossPortalSync } from "@/hooks/useCrossPortalSync";
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ExportModal } from "@/components/ExportModal";
import { 
  fetchMembersWithEnhancedData, 
  calculateRealTimeStats,
  EnhancedMemberBalance,
  DetailedContribution
} from "@/utils/databaseUtils";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  tns_number?: string;
  maturity_status: string;
  days_to_maturity?: number;
  profile_picture_url?: string;
  // Additional fields for comprehensive member data
  address: string;
  zip_code: string;
  alternative_phone?: string;
  id_number?: string;
  sex?: string;
  marital_status?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  membership_type: string;
  registration_status: string;
  payment_status: string;
  registration_date?: string;
  probation_end_date?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Using enhanced interfaces from databaseUtils
type MemberBalance = EnhancedMemberBalance;
type Contribution = DetailedContribution;

interface AreaStats {
  total_members: number;
  approved_members: number;
  pending_members: number;
  total_contributions: number;
  average_contribution: number;
  mature_members: number;
  probation_members: number;
  paid_members: number;
  unpaid_members: number;
}

interface AreaGroup {
  area: string;
  city: string;
  state: string;
  members: Member[];
  stats: AreaStats;
  isExpanded: boolean;
}

interface CommunicationMessage {
  title: string;
  message: string;
  recipients: 'all' | 'area' | 'selected';
  selectedMembers: string[];
  selectedArea?: string;
}

const CoordinatorPortal = () => {
  const { staffUser, logout: staffLogout } = useStaffAuth();
  const { isAuthorized, isLoading: roleLoading } = useRoleGuard({ portal: 'coordinator' });
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [memberBalances, setMemberBalances] = useState<Record<string, MemberBalance>>({});
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedArea, setAssignedArea] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [maturityFilter, setMaturityFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Enhanced real-time statistics
  const [realTimeStats, setRealTimeStats] = useState({
    totalMembers: 0,
    approvedMembers: 0,
    totalContributions: 0,
    averageContribution: 0,
    currentTotalBalance: 0
  });
  
  // Area grouping state
  const [areaGroups, setAreaGroups] = useState<AreaGroup[]>([]);
  const [groupByArea, setGroupByArea] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'grouped'>('grouped');
  
  // Communication state
  const [communicationModal, setCommunicationModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<CommunicationMessage>({
    title: '',
    message: '',
    recipients: 'all',
    selectedMembers: [],
    selectedArea: undefined
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Set up cross-portal synchronization for member data
  useCrossPortalSync({
    onRefreshRequired: (source: string, reason: string) => {
      console.log(`CoordinatorPortal: Refreshing data due to: ${reason} (from: ${source})`);
      fetchCoordinatorData();
    },
    portalName: 'CoordinatorPortal',
    autoRefresh: true
  });

  useEffect(() => {
    // Role guard handles authentication and authorization
    if (isAuthorized && !roleLoading) {
      fetchCoordinatorData();
    }
  }, [isAuthorized, roleLoading]);

  // Real-time data synchronization
  useEffect(() => {
    if (!isAuthorized || roleLoading) return;

    // Set up real-time subscriptions for data changes
    const subscriptions = [];

    // Subscribe to member_balances changes
    const balanceSubscription = supabase
      .channel('member_balances_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'member_balances'
      }, (payload) => {
        console.log('📊 Member balance changed:', payload);
        // Refresh enhanced data when balances change
        console.log('🔄 Balances changed, refreshing data...');
        fetchCoordinatorData();
        toast.info('Member balances updated', { duration: 2000 });
      })
      .subscribe();

    subscriptions.push(balanceSubscription);

    // Subscribe to contributions changes
    const contributionsSubscription = supabase
      .channel('contributions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contributions'
      }, (payload) => {
        console.log('💰 Contribution changed:', payload);
        // Refresh enhanced data when contributions change
        console.log('🔄 Contributions changed, refreshing data...');
        fetchCoordinatorData();
        toast.info('Contributions updated', { duration: 2000 });
      })
      .subscribe();

    subscriptions.push(contributionsSubscription);

    // Subscribe to member registration changes
    const membersSubscription = supabase
      .channel('member_registrations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'membership_registrations'
      }, (payload) => {
        console.log('👥 Member registration changed:', payload);
        // Refresh all data when member registrations change
        fetchCoordinatorData();
        toast.info('Member data updated', { duration: 2000 });
      })
      .subscribe();

    subscriptions.push(membersSubscription);

    // Periodic enhanced data refresh every 5 minutes
    const intervalId = setInterval(() => {
      if (members.length > 0) {
        console.log('🔄 Periodic enhanced data refresh...');
        fetchCoordinatorData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup function
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
      clearInterval(intervalId);
    };
  }, [isAuthorized, roleLoading, members]);

  useEffect(() => {
    let filtered = members.filter(member => {
      // Normalize fields to avoid null/undefined crashes
      const firstName = (member.first_name || '').toLowerCase();
      const lastName = (member.last_name || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const phone = (member.phone || '').toLowerCase();
      const tns = (member.tns_number || '').toLowerCase();
      const term = (searchTerm || '').toLowerCase();

      // Search filter
      const matchesSearch = 
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        tns.includes(term);
      
      // Area filter
      const areaStr = `${member.city || ''}, ${member.state || ''}`;
      const matchesArea = selectedArea === "all" || areaStr === selectedArea;
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
        member.registration_status === statusFilter;
      
      // Maturity filter
      const matchesMaturity = maturityFilter === "all" || 
        member.maturity_status === maturityFilter;
      
      // Payment filter
      const matchesPayment = paymentFilter === "all" || 
        member.payment_status === paymentFilter;
      
      return matchesSearch && matchesArea && matchesStatus && 
             matchesMaturity && matchesPayment;
    });

    setFilteredMembers(filtered);
    
    // Update area groups when filters change
    updateAreaGroups(filtered);
  }, [searchTerm, members, selectedArea, statusFilter, maturityFilter, paymentFilter]);
  
  const updateAreaGroups = (membersToGroup: Member[]) => {
    const groups: AreaGroup[] = [];
    
    if (groupByArea) {
      const areaMap = new Map<string, Member[]>();
      
      membersToGroup.forEach(member => {
        const area = `${member.city}, ${member.state}`;
        if (!areaMap.has(area)) {
          areaMap.set(area, []);
        }
        areaMap.get(area)!.push(member);
      });
      
      areaMap.forEach((members, area) => {
        const [city, state] = area.split(', ');
        const stats = calculateAreaStats(members);
        
        groups.push({
          area,
          city,
          state,
          members,
          stats,
          isExpanded: area === assignedArea // Auto-expand assigned area
        });
      });
      
      // Sort by member count descending
      groups.sort((a, b) => b.members.length - a.members.length);
    }
    
    setAreaGroups(groups);
  };
  
  const calculateAreaStats = (areaMembers: Member[]): AreaStats => {
    const totalMembers = areaMembers.length;
    const approvedMembers = areaMembers.filter(m => m.registration_status === 'approved').length;
    const pendingMembers = areaMembers.filter(m => m.registration_status === 'pending').length;
    const matureMembers = areaMembers.filter(m => m.maturity_status === 'mature').length;
    const probationMembers = areaMembers.filter(m => m.maturity_status === 'probation').length;
    const paidMembers = areaMembers.filter(m => m.payment_status === 'paid').length;
    const unpaidMembers = areaMembers.filter(m => m.payment_status !== 'paid').length;
    
    const totalContributions = areaMembers.reduce((sum, member) => 
      sum + (memberBalances[member.id]?.total_contributions || 0), 0
    );
    const averageContribution = totalMembers > 0 ? totalContributions / totalMembers : 0;
    
    return {
      total_members: totalMembers,
      approved_members: approvedMembers,
      pending_members: pendingMembers,
      total_contributions: totalContributions,
      average_contribution: averageContribution,
      mature_members: matureMembers,
      probation_members: probationMembers,
      paid_members: paidMembers,
      unpaid_members: unpaidMembers
    };
  };

  const fetchCoordinatorData = async () => {
    try {
      if (!staffUser) {
        console.log('No staff user found');
        return;
      }

      console.log('Fetching enhanced coordinator data for:', staffUser.first_name, staffUser.last_name, 'Role:', staffUser.staff_role);

      // Set assigned area (can be null for General Coordinators)
      setAssignedArea(staffUser.assigned_area || "All Areas");
      console.log('Assigned area:', staffUser.assigned_area || 'All Areas');
      
      setLoading(true);

      // Use enhanced data fetching
      const {
        members: membersList,
        balances,
        contributions: contributionData,
        areaStats,
        areas
      } = await fetchMembersWithEnhancedData(staffUser);
      
      console.log(`👥 Setting ${membersList.length} members with enhanced data`);
      setMembers(membersList);
      setMemberBalances(balances);
      setContributions(contributionData);
      setAllAreas(areas);
      
      // Calculate real-time statistics
      const stats = calculateRealTimeStats(membersList, balances);
      setRealTimeStats(stats);
      
      console.log('📊 Real-time stats loaded:', stats);
      console.log('🗺️ Areas found:', areas);

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced financial data fetching is now handled by fetchMembersWithEnhancedData

  // Enhanced export functionality is now handled by ExportModal component
  const handleExportClick = () => {
    setExportModalOpen(true);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCoordinatorData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };
  
  const handleLogout = () => {
    if (staffUser) {
      staffLogout();
      toast.success('Logged out successfully');
      navigate('/portal-login');
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleBulkMessage = async () => {
    if (!bulkMessage.title.trim() || !bulkMessage.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (bulkMessage.recipients === 'selected' && selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }
    
    try {
      setSendingMessage(true);
      
      let targetMembers: Member[] = [];
      
      if (bulkMessage.recipients === 'all') {
        targetMembers = filteredMembers;
      } else if (bulkMessage.recipients === 'area') {
        targetMembers = filteredMembers.filter(m => 
          `${m.city}, ${m.state}` === bulkMessage.selectedArea
        );
      } else {
        targetMembers = filteredMembers.filter(m => 
          selectedMembers.includes(m.id)
        );
      }
      
      // Simulate sending messages (replace with actual implementation)
      console.log('Sending message to', targetMembers.length, 'members');
      console.log('Message:', bulkMessage);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Message sent to ${targetMembers.length} member${targetMembers.length > 1 ? 's' : ''}`);
      setCommunicationModal(false);
      setBulkMessage({
        title: '',
        message: '',
        recipients: 'all',
        selectedMembers: [],
        selectedArea: undefined
      });
      setSelectedMembers([]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const toggleAreaExpansion = (areaName: string) => {
    setAreaGroups(prev => 
      prev.map(group => 
        group.area === areaName 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };
  
  const handleMemberSelect = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Debug logging
  console.log('CoordinatorPortal render state:', {
    roleLoading,
    loading,
    isAuthorized,
    staffUser: staffUser ? `${staffUser.first_name} ${staffUser.last_name}` : null,
    membersCount: members.length,
    filteredMembersCount: filteredMembers.length
  });

  // Show loading state while checking authorization or loading data
  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {roleLoading ? 'Verifying access...' : 'Loading coordinator portal...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we prepare your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authorized, the role guard will handle redirection
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🚫</div>
          <div className="space-y-2">
            <p className="text-red-600 dark:text-red-400 font-bold text-xl">Access Denied</p>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access the Coordinator Portal.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to appropriate portal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalMembers = members.length;
  const totalContributions = Object.values(memberBalances).reduce(
    (sum, balance) => sum + balance.total_contributions, 0
  );
  const approvedMembers = members.filter(m => m.registration_status === 'approved').length;
  const pendingMembers = members.filter(m => m.registration_status === 'pending').length;
  const matureMembers = members.filter(m => m.maturity_status === 'mature').length;
  const paidMembers = members.filter(m => m.payment_status === 'paid').length;
  
  // Use real-time stats for dashboard display
  const displayStats = realTimeStats.totalMembers > 0 ? realTimeStats : {
    totalMembers,
    approvedMembers,
    totalContributions,
    averageContribution: totalMembers > 0 ? totalContributions / totalMembers : 0,
    currentTotalBalance: 0
  };

  // Simple test return
  if (!members.length && !loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Area Coordinator Portal</h1>
          <p className="text-gray-600 mb-4">Welcome, {staffUser?.first_name} {staffUser?.last_name}</p>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No members found in the database.</p>
            <p className="text-sm text-yellow-600 mt-2">Debug info:</p>
            <ul className="text-xs text-yellow-600 mt-1">
              <li>Staff Role: {staffUser?.staff_role}</li>
              <li>Assigned Area: {assignedArea}</li>
              <li>Loading: {loading.toString()}</li>
              <li>Role Loading: {roleLoading.toString()}</li>
              <li>Is Authorized: {isAuthorized.toString()}</li>
            </ul>
          </div>
          <Button 
            onClick={() => {
              console.log('Refresh clicked');
              setLoading(true);
              fetchCoordinatorData();
            }}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950">
      {/* Modern Enhanced Header with Glassmorphism Effect */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Area Coordinator Portal
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Welcome, <span className="font-semibold text-blue-600 dark:text-blue-400">{staffUser?.first_name} {staffUser?.last_name}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                      <MapPin className="h-3 w-3 mr-1" />
                      {assignedArea || 'All Areas'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button
                size="sm"
                onClick={() => setCommunicationModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Members
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportClick}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
              {staffUser && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Statistics Dashboard with Gradient Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Members</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg shadow-lg group-hover:bg-blue-600 transition-colors">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">{displayStats.totalMembers}</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-600">
                    {displayStats.totalMembers > 0 ? `${((displayStats.approvedMembers / displayStats.totalMembers) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">approval rate</p>
              </div>
              <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: displayStats.totalMembers > 0 ? `${(displayStats.approvedMembers / displayStats.totalMembers) * 100}%` : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Active Members</CardTitle>
              <div className="p-2 bg-green-500 rounded-lg shadow-lg group-hover:bg-green-600 transition-colors">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">{displayStats.approvedMembers}</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-600">{displayStats.totalMembers - displayStats.approvedMembers}</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">pending approval</p>
              </div>
              <div className="mt-2 flex gap-1">
                <div className="flex-1 bg-green-200 dark:bg-green-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full w-full transition-all duration-500 ease-out"></div>
                </div>
                <div className="flex-1 bg-orange-200 dark:bg-orange-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: displayStats.totalMembers > 0 ? `${((displayStats.totalMembers - displayStats.approvedMembers) / displayStats.totalMembers) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Contributions</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg shadow-lg group-hover:bg-purple-600 transition-colors">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">{formatCurrency(displayStats.totalContributions)}</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">
                    {displayStats.currentTotalBalance > 0 ? formatCurrency(displayStats.currentTotalBalance) : 'Balance N/A'}
                  </span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">current balance</p>
              </div>
              <div className="mt-2 bg-purple-200 dark:bg-purple-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full w-4/5 transition-all duration-500 ease-out"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Average Contribution</CardTitle>
              <div className="p-2 bg-amber-500 rounded-lg shadow-lg group-hover:bg-amber-600 transition-colors">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1">
                {formatCurrency(displayStats.averageContribution)}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600">{displayStats.totalMembers}</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">total members</p>
              </div>
              <div className="mt-2 bg-amber-200 dark:bg-amber-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-3/4 transition-all duration-500 ease-out"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-indigo-900 dark:text-indigo-100">Member Status</CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300">Quick overview</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700 dark:text-indigo-300">Mature Members</span>
                  <span className="font-medium text-indigo-900 dark:text-indigo-100">{matureMembers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700 dark:text-indigo-300">Paid Members</span>
                  <span className="font-medium text-indigo-900 dark:text-indigo-100">{paidMembers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Quick Actions</CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">Common tasks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCommunicationModal(true)} className="flex-1 text-xs">
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportClick} className="flex-1 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/20 border-rose-200 dark:border-rose-800 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-rose-900 dark:text-rose-100">Performance</CardTitle>
                  <CardDescription className="text-rose-700 dark:text-rose-300">Area metrics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700 dark:text-rose-300">Efficiency</span>
                  <span className="font-medium text-rose-900 dark:text-rose-100">94.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700 dark:text-rose-300">Growth</span>
                  <span className="font-medium text-rose-900 dark:text-rose-100">+8.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Search and Filtering Section */}
        <Card className="mb-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg shadow-md">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900 dark:text-slate-100">Advanced Member Search & Filters</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Search, filter, and organize members efficiently</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Users className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Group by Area</label>
                  <Checkbox
                    checked={groupByArea}
                    onCheckedChange={(checked) => setGroupByArea(checked as boolean)}
                    className="ml-1"
                  />
                </div>
                <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1">
                  <Users className="h-3 w-3 mr-1" />
                  {filteredMembers.length} / {members.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Primary Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                placeholder="🔍 Search members by name, email, TNS number, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Filter Pills Row */}
            <div className="flex flex-wrap gap-3">
              {/* Area Filter */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-[200px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg">
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 All Areas</SelectItem>
                    {allAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        📍 {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-slate-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">✅ Approved</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="inactive">❌ Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Maturity Filter */}
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-slate-500" />
                <Select value={maturityFilter} onValueChange={setMaturityFilter}>
                  <SelectTrigger className="w-[150px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg">
                    <SelectValue placeholder="Maturity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="mature">🎯 Mature</SelectItem>
                    <SelectItem value="immature">⏱️ Immature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Payment Filter */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[160px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">💰 Paid</SelectItem>
                    <SelectItem value="unpaid">⚠️ Unpaid</SelectItem>
                    <SelectItem value="behind">📉 Behind</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Clear Filters */}
              {(searchTerm || selectedArea !== 'all' || statusFilter !== 'all' || 
                maturityFilter !== 'all' || paymentFilter !== 'all') && (
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedArea('all');
                    setStatusFilter('all');
                    setMaturityFilter('all');
                    setPaymentFilter('all');
                  }}
                  className="h-9 px-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Clear All Filters
                </Button>
              )}
            </div>
            
            {/* Active Filters Summary */}
            {(searchTerm || selectedArea !== 'all' || statusFilter !== 'all' || 
              maturityFilter !== 'all' || paymentFilter !== 'all') && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Active Filters:</span>
                <div className="flex flex-wrap gap-1">
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {selectedArea !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                      Area: {selectedArea}
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                      Status: {statusFilter}
                    </Badge>
                  )}
                  {maturityFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                      Maturity: {maturityFilter}
                    </Badge>
                  )}
                  {paymentFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                      Payment: {paymentFilter}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members Display - Conditional: Grouped by Area or List View */}
        {groupByArea ? (
          <div className="space-y-6">
            {areaGroups.map((group) => (
              <Card key={group.area} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleAreaExpansion(group.area)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {group.isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.area}</CardTitle>
                        <CardDescription>
                          {group.stats.total_members} members • 
                          {formatCurrency(group.stats.total_contributions)} total contributions
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{group.stats.approved_members} Active</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>{group.stats.pending_members} Pending</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>{group.stats.unpaid_members} Unpaid</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {group.isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {group.members.map((member) => {
                        const balance = memberBalances[member.id];
                        return (
                          <div key={member.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(member.id)}
                                  onChange={(e) => handleMemberSelect(member.id, e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                {member.profile_picture_url ? (
                                  <img 
                                    src={member.profile_picture_url} 
                                    alt={`${member.first_name} ${member.last_name}`}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                      {(member.first_name?.[0] || '?')}{member.last_name?.[0] || ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {member.first_name} {member.last_name}
                                  </h4>
                                  <div className="flex space-x-1">
                                    <Badge 
                                      variant={member.registration_status === 'approved' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {member.registration_status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Hash className="h-3 w-3" />
                                    <span>{member.tns_number || 'No TNS'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{member.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{member.phone}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex space-x-1">
                                    <Badge 
                                      variant={member.payment_status === 'paid' ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {member.payment_status}
                                    </Badge>
                                    <Badge 
                                      variant={member.maturity_status === 'mature' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {member.maturity_status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs font-medium">
                                    {formatCurrency(balance?.total_contributions || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Members {selectedArea === "all" ? "from All Areas" : `in ${selectedArea}`}
                </span>
                {selectedMembers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedMembers.length} selected
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setBulkMessage(prev => ({
                          ...prev,
                          recipients: 'selected',
                          selectedMembers: selectedMembers
                        }));
                        setCommunicationModal(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message Selected
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {filteredMembers.length} of {totalMembers} members shown
                {selectedArea !== "all" && ` • Filtered by: ${selectedArea}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => {
                  const balance = memberBalances[member.id];
                  return (
                    <div key={member.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={(e) => handleMemberSelect(member.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          {member.profile_picture_url ? (
                            <img 
                              src={member.profile_picture_url} 
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {(member.first_name?.[0] || '?')}{member.last_name?.[0] || ''}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium truncate">
                              {member.first_name} {member.last_name}
                            </h4>
                            <div className="flex space-x-1">
                              <Badge 
                                variant={member.registration_status === 'approved' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {member.registration_status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4" />
                              <span>{member.tns_number || 'No TNS'}</span>
                              <MapPin className="h-4 w-4 ml-auto" />
                              <span>{member.city}, {member.state}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{member.phone}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex space-x-1">
                              <Badge 
                                variant={member.payment_status === 'paid' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {member.payment_status}
                              </Badge>
                              <Badge 
                                variant={member.maturity_status === 'mature' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {member.maturity_status}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(balance?.total_contributions || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No members found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Communication Modal */}
        {communicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send Bulk Message
                  </h2>
                  <button
                    onClick={() => setCommunicationModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Recipients Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send to:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="recipients"
                          value="all"
                          checked={bulkMessage.recipients === 'all'}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                          className="mr-2"
                        />
                        All filtered members ({filteredMembers.length} members)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="recipients"
                          value="area"
                          checked={bulkMessage.recipients === 'area'}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                          className="mr-2"
                        />
                        Specific area
                      </label>
                      {bulkMessage.recipients === 'area' && (
                        <div className="ml-6">
                          <Select 
                            value={bulkMessage.selectedArea || ''} 
                            onValueChange={(value) => setBulkMessage(prev => ({ ...prev, selectedArea: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select area" />
                            </SelectTrigger>
                            <SelectContent>
                              {allAreas.map((area) => (
                                <SelectItem key={area} value={area}>
                                  {area} ({filteredMembers.filter(m => `${m.city}, ${m.state}` === area).length} members)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="recipients"
                          value="selected"
                          checked={bulkMessage.recipients === 'selected'}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                          className="mr-2"
                        />
                        Selected members ({selectedMembers.length} selected)
                      </label>
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Title *
                    </label>
                    <Input
                      value={bulkMessage.title}
                      onChange={(e) => setBulkMessage(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter message title..."
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Content *
                    </label>
                    <textarea
                      value={bulkMessage.message}
                      onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message here..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Preview Recipients */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Message Preview</h4>
                    <div className="text-sm text-gray-600">
                      <p><strong>To:</strong> 
                        {bulkMessage.recipients === 'all' && `All filtered members (${filteredMembers.length})`}
                        {bulkMessage.recipients === 'area' && bulkMessage.selectedArea && 
                          `${bulkMessage.selectedArea} (${filteredMembers.filter(m => `${m.city}, ${m.state}` === bulkMessage.selectedArea).length} members)`}
                        {bulkMessage.recipients === 'selected' && `${selectedMembers.length} selected members`}
                      </p>
                      <p><strong>Subject:</strong> {bulkMessage.title || '(No title)'}</p>
                      <p><strong>Message:</strong> {bulkMessage.message ? `${bulkMessage.message.slice(0, 100)}${bulkMessage.message.length > 100 ? '...' : ''}` : '(No message)'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCommunicationModal(false)}
                    disabled={sendingMessage}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkMessage}
                    disabled={sendingMessage || !bulkMessage.title.trim() || !bulkMessage.message.trim()}
                    className="flex items-center"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Export Modal */}
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          members={filteredMembers}
          balances={memberBalances}
          contributions={contributions}
          coordinatorName={`${staffUser?.first_name || ''} ${staffUser?.last_name || ''}`.trim()}
          assignedArea={assignedArea}
          availableAreas={allAreas}
          filteredArea={selectedArea !== 'all' ? selectedArea : undefined}
        />
      </div>
    </div>
  );
};

export default CoordinatorPortal;
