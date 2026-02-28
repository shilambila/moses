import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { members, contributions, balances, area } = await req.json();

    // Create Excel-compatible CSV data
    const csvHeaders = [
      'Name',
      'TNS Number', 
      'Email',
      'Phone',
      'Status',
      'Current Balance',
      'Total Contributions',
      'Days to Maturity',
      'Latest Contribution Date',
      'Latest Contribution Amount'
    ];

    const csvRows = members.map((member: any) => {
      const memberContributions = contributions[member.id] || [];
      const memberBalance = balances[member.id] || { current_balance: 0, total_contributions: 0 };
      const latestContribution = memberContributions[0];

      return [
        `"${member.first_name} ${member.last_name}"`,
        `"${member.tns_number || 'N/A'}"`,
        `"${member.email}"`,
        `"${member.phone}"`,
        `"${member.maturity_status}"`,
        memberBalance.current_balance,
        memberBalance.total_contributions,
        member.maturity_status === 'probation' ? (member.days_to_maturity || 0) : 0,
        latestContribution ? `"${latestContribution.contribution_date}"` : 'N/A',
        latestContribution ? latestContribution.amount : 0
      ].join(',');
    });

    const csvContent = [
      `"Area: ${area}"`,
      `"Generated on: ${new Date().toLocaleDateString()}"`,
      '',
      csvHeaders.join(','),
      ...csvRows
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${area}_members_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});