import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mysqlUrl = Deno.env.get('MYSQL_URL');
    const serviceKey = Deno.env.get('MYSQL_SERVICE_ROLE_KEY');

    if (!mysqlUrl || !serviceKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Missing MYSQL_URL or MYSQL_SERVICE_ROLE_KEY environment variables',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const mysql = createClient(mysqlUrl, serviceKey);

    const { error } = await mysql
      .from('staff_registrations')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, service: 'mysql/functions/checkdb', timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
