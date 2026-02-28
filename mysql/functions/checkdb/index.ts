import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getMysqlConfig = () => {
  const host = Deno.env.get("MYSQL_HOST");
  const user = Deno.env.get("MYSQL_USER");
  const password = Deno.env.get("MYSQL_PASSWORD");
  const database = Deno.env.get("MYSQL_DATABASE");
  const port = Number(Deno.env.get("MYSQL_PORT") ?? "3306");

  if (!host || !user || !password || !database) {
    throw new Error("Missing MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, or MYSQL_DATABASE");
  }

  return { host, user, password, database, port };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const client = await new Client().connect(getMysqlConfig());

  try {
    const result = await client.query("SELECT 1 AS ok");

    return new Response(
      JSON.stringify({
        ok: true,
        mysql: true,
        ping: result?.[0]?.ok === 1,
        service: "mysql/functions/checkdb",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        mysql: true,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } finally {
    await client.close();
  }
});
