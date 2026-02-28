import { mysql } from '@/integrations/mysql/client';

export interface EnhancedMemberBalance {
  member_id: string;
  current_balance: number;
  total_contributions: number;
  total_disbursements: number;
  last_contribution_date?: string;
  contribution_count: number;
  average_monthly_contribution: number;
}

export interface DetailedContribution {
  id: string;
  member_id: string;
  amount: number;
  contribution_date: string;
  contribution_type: string;
  payment_method?: string;
  reference_number?: string;
  verified: boolean;
  created_at: string;
}

export interface AreaStatsFromDB {
  area: string;
  city: string;
  state: string;
  total_members: number;
  approved_members: number;
  pending_members: number;
  mature_members: number;
  probation_members: number;
  paid_members: number;
  unpaid_members: number;
  total_contributions: number;
  average_contribution: number;
  latest_contribution_date?: string;
}

/**
 * Fetches enhanced member financial data with real-time accuracy
 * This function ensures all calculations are done with the latest database data
 */
export const fetchEnhancedMemberFinancialData = async (
  memberIds: string[]
): Promise<{
  balances: Record<string, EnhancedMemberBalance>;
  contributions: Record<string, DetailedContribution[]>;
}> => {
  if (!memberIds.length) {
    console.log('🚨 No member IDs provided for enhanced financial data fetch');
    return { balances: {}, contributions: {} };
  }

  console.log('📊 Starting enhanced financial data fetch for', memberIds.length, 'members');

  const balances: Record<string, EnhancedMemberBalance> = {};
  const contributions: Record<string, DetailedContribution[]> = {};

  try {
    // 1. Fetch detailed contributions data
    const { data: contributionsData, error: contributionsError } = await mysql
      .from('contributions')
      .select(`
        id,
        member_id,
        amount,
        contribution_date,
        contribution_type,
        status,
        created_at
      `)
      .in('member_id', memberIds)
      .order('contribution_date', { ascending: false });

    if (contributionsError) {
      console.warn('⚠️ Error fetching contributions:', contributionsError.message);
    } else if (contributionsData) {
      // Group contributions by member
      contributionsData.forEach((contribution) => {
        if (!contributions[contribution.member_id]) {
          contributions[contribution.member_id] = [];
        }
        contributions[contribution.member_id].push({
          id: contribution.id,
          member_id: contribution.member_id,
          amount: Number(contribution.amount) || 0,
          contribution_date: contribution.contribution_date,
          contribution_type: contribution.contribution_type || 'regular',
          payment_method: undefined,
          reference_number: undefined,
          verified: contribution.status === 'confirmed',
          created_at: contribution.created_at
        });
      });
      console.log('💰 Loaded detailed contributions for', Object.keys(contributions).length, 'members');
    }

    // 2. Fetch or calculate member balances
    const { data: balancesData, error: balancesError } = await mysql
      .from('member_balances')
      .select(`
        member_id,
        current_balance,
        total_contributions,
        total_disbursements,
        last_updated
      `)
      .in('member_id', memberIds);

    if (balancesError) {
      console.warn('⚠️ Error fetching member balances:', balancesError.message);
      // Calculate balances from contributions if balance table doesn't exist or fails
      await calculateBalancesFromContributions(memberIds, contributions, balances);
    } else if (balancesData) {
      // Process existing balance data and enhance with calculations
      balancesData.forEach((balance) => {
        const memberContributions = contributions[balance.member_id] || [];
        const contributionCount = memberContributions.length;
        const verifiedContributions = memberContributions.filter(c => c.verified);
        
        // Calculate average monthly contribution (assuming contributions over 12 months)
        const totalVerifiedAmount = verifiedContributions.reduce((sum, c) => sum + c.amount, 0);
        const averageMonthly = contributionCount > 0 ? totalVerifiedAmount / Math.max(contributionCount, 1) : 0;

        balances[balance.member_id] = {
          member_id: balance.member_id,
          current_balance: Number(balance.current_balance) || 0,
          total_contributions: Number(balance.total_contributions) || 0,
          total_disbursements: Number(balance.total_disbursements) || 0,
          last_contribution_date: memberContributions[0]?.contribution_date,
          contribution_count: contributionCount,
          average_monthly_contribution: averageMonthly
        };
      });

      // For members without balance records, calculate from contributions
      const membersWithoutBalances = memberIds.filter(id => !balances[id]);
      if (membersWithoutBalances.length > 0) {
        await calculateBalancesFromContributions(membersWithoutBalances, contributions, balances);
      }

      console.log('💵 Loaded enhanced balances for', Object.keys(balances).length, 'members');
    }

    // 3. Ensure all requested members have balance records (even if zero)
    memberIds.forEach(memberId => {
      if (!balances[memberId]) {
        const memberContributions = contributions[memberId] || [];
        const totalContributions = memberContributions.reduce((sum, c) => sum + c.amount, 0);
        
        balances[memberId] = {
          member_id: memberId,
          current_balance: totalContributions, // Assuming no disbursements if no balance record
          total_contributions: totalContributions,
          total_disbursements: 0,
          contribution_count: memberContributions.length,
          average_monthly_contribution: memberContributions.length > 0 ? totalContributions / memberContributions.length : 0
        };
      }
    });

    console.log(`📈 Enhanced Financial Summary: ${Object.keys(balances).length} enhanced balances, ${Object.keys(contributions).length} detailed contribution records`);

    return { balances, contributions };

  } catch (error) {
    console.error('🚨 Critical error in enhanced financial data fetching:', error);
    // Return empty data but ensure structure is correct
    memberIds.forEach(memberId => {
      balances[memberId] = {
        member_id: memberId,
        current_balance: 0,
        total_contributions: 0,
        total_disbursements: 0,
        contribution_count: 0,
        average_monthly_contribution: 0
      };
      contributions[memberId] = [];
    });
    return { balances, contributions };
  }
};

/**
 * Calculate balances from contributions when balance table is unavailable
 */
const calculateBalancesFromContributions = async (
  memberIds: string[],
  contributions: Record<string, DetailedContribution[]>,
  balances: Record<string, EnhancedMemberBalance>
) => {
  // Fetch disbursements if available
  let disbursements: Record<string, number> = {};
  
  try {
    const { data: disbursementsData } = await mysql
      .from('disbursements')
      .select('member_id, amount')
      .in('member_id', memberIds);
    
    if (disbursementsData) {
      disbursementsData.forEach(d => {
        if (!disbursements[d.member_id]) {
          disbursements[d.member_id] = 0;
        }
        disbursements[d.member_id] += Number(d.amount) || 0;
      });
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch disbursements, assuming zero:', error);
  }

  memberIds.forEach(memberId => {
    const memberContributions = contributions[memberId] || [];
    const totalContributions = memberContributions.reduce((sum, c) => sum + c.amount, 0);
    const totalDisbursements = disbursements[memberId] || 0;
    const lastContribution = memberContributions.length > 0 ? memberContributions[0].contribution_date : undefined;
    
    balances[memberId] = {
      member_id: memberId,
      current_balance: totalContributions - totalDisbursements,
      total_contributions: totalContributions,
      total_disbursements: totalDisbursements,
      last_contribution_date: lastContribution,
      contribution_count: memberContributions.length,
      average_monthly_contribution: memberContributions.length > 0 ? totalContributions / memberContributions.length : 0
    };
  });
  
  console.log('🔄 Calculated balances from contributions for', memberIds.length, 'members');
};

/**
 * Fetches real-time area statistics directly from database
 */
export const fetchAreaStatsFromDatabase = async (
  members: any[],
  memberBalances: Record<string, EnhancedMemberBalance>
): Promise<AreaStatsFromDB[]> => {
  const areaStatsMap = new Map<string, AreaStatsFromDB>();

  members.forEach(member => {
    const area = `${member.city}, ${member.state}`;
    const balance = memberBalances[member.id];
    
    if (!areaStatsMap.has(area)) {
      areaStatsMap.set(area, {
        area,
        city: member.city,
        state: member.state,
        total_members: 0,
        approved_members: 0,
        pending_members: 0,
        mature_members: 0,
        probation_members: 0,
        paid_members: 0,
        unpaid_members: 0,
        total_contributions: 0,
        average_contribution: 0,
        latest_contribution_date: undefined
      });
    }

    const stats = areaStatsMap.get(area)!;
    
    // Count members by status
    stats.total_members++;
    if (member.registration_status === 'approved') stats.approved_members++;
    if (member.registration_status === 'pending') stats.pending_members++;
    if (member.maturity_status === 'mature') stats.mature_members++;
    if (member.maturity_status === 'probation') stats.probation_members++;
    if (member.payment_status === 'paid') stats.paid_members++;
    else stats.unpaid_members++;

    // Add financial data
    if (balance) {
      stats.total_contributions += balance.total_contributions;
      
      // Track latest contribution date
      if (balance.last_contribution_date) {
        if (!stats.latest_contribution_date || 
            new Date(balance.last_contribution_date) > new Date(stats.latest_contribution_date)) {
          stats.latest_contribution_date = balance.last_contribution_date;
        }
      }
    }
  });

  // Calculate average contributions per area
  areaStatsMap.forEach(stats => {
    stats.average_contribution = stats.total_members > 0 ? 
      stats.total_contributions / stats.total_members : 0;
  });

  const areaStatsArray = Array.from(areaStatsMap.values());
  
  // Sort by total contributions descending
  areaStatsArray.sort((a, b) => b.total_contributions - a.total_contributions);
  
  console.log('📊 Generated real-time area statistics for', areaStatsArray.length, 'areas');
  return areaStatsArray;
};

/**
 * Fetch member data with enhanced financial calculations
 */
export const fetchMembersWithEnhancedData = async (staffUser: any) => {
  console.log('🔄 Starting enhanced member data fetch');
  
  try {
    // 1. Fetch all members
    const { data: membersData, error: membersError } = await mysql
      .from('membership_registrations')
      .select('*')
      .in('registration_status', ['approved', 'pending'])
      .order('first_name');

    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
      throw membersError;
    }

    const members = membersData || [];
    console.log(`👥 Fetched ${members.length} members`);

    // 2. Get enhanced financial data
    const memberIds = members.map(m => m.id);
    const { balances, contributions } = await fetchEnhancedMemberFinancialData(memberIds);

    // 3. Generate area statistics
    const areaStats = await fetchAreaStatsFromDatabase(members, balances);

    // 4. Extract unique areas
    const areas = Array.from(new Set(
      members.map(member => `${member.city}, ${member.state}`)
    )).sort();

    return {
      members,
      balances,
      contributions,
      areaStats,
      areas
    };

  } catch (error) {
    console.error('🚨 Critical error in enhanced member data fetch:', error);
    throw error;
  }
};

/**
 * Real-time calculation of totals for dashboard
 */
export const calculateRealTimeStats = (
  members: any[],
  balances: Record<string, EnhancedMemberBalance>
) => {
  const totalMembers = members.length;
  const approvedMembers = members.filter(m => m.registration_status === 'approved').length;
  const pendingMembers = members.filter(m => m.registration_status === 'pending').length;
  const matureMembers = members.filter(m => m.maturity_status === 'mature').length;
  const paidMembers = members.filter(m => m.payment_status === 'paid').length;
  
  // Real-time financial calculations
  const totalContributions = Object.values(balances).reduce(
    (sum, balance) => sum + balance.total_contributions, 0
  );
  
  const totalDisbursements = Object.values(balances).reduce(
    (sum, balance) => sum + balance.total_disbursements, 0
  );
  
  const currentTotalBalance = Object.values(balances).reduce(
    (sum, balance) => sum + balance.current_balance, 0
  );
  
  const averageContribution = totalMembers > 0 ? totalContributions / totalMembers : 0;
  
  const averageMonthlyContribution = Object.values(balances).reduce(
    (sum, balance) => sum + balance.average_monthly_contribution, 0
  ) / Math.max(Object.keys(balances).length, 1);

  const totalContributionCount = Object.values(balances).reduce(
    (sum, balance) => sum + balance.contribution_count, 0
  );

  console.log('📊 Real-time stats calculated:', {
    totalMembers,
    approvedMembers,
    totalContributions,
    averageContribution,
    currentTotalBalance
  });

  return {
    totalMembers,
    approvedMembers,
    pendingMembers,
    matureMembers,
    paidMembers,
    totalContributions,
    totalDisbursements,
    currentTotalBalance,
    averageContribution,
    averageMonthlyContribution,
    totalContributionCount
  };
};