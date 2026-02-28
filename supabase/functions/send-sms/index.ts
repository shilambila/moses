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
    const { phone, memberName, tnsNumber, balance, messageType } = await req.json();

    // Format the SMS message based on type
    let message = '';
    
    if (messageType === 'balance') {
      message = `Dear ${memberName},\n\nYour TNS Account Update:\nTNS Number: ${tnsNumber}\nBenevolent Balance: KES ${balance.toLocaleString()}\nPAYBILL: 4148511\n\nCustomer Care: 0700-000-000\n\nThank you for being part of Team No Struggle.`;
    } else if (messageType === 'welcome') {
      message = `Welcome to Team No Struggle, ${memberName}!\n\nYour TNS Number: ${tnsNumber}\nPAYBILL: 4148511\n\nFor support, call Customer Care: 0700-000-000\n\nWe're glad to have you!`;
    } else if (messageType === 'contribution') {
      message = `Dear ${memberName},\n\nContribution received successfully!\nTNS Number: ${tnsNumber}\nNew Balance: KES ${balance.toLocaleString()}\nPAYBILL: 4148511\n\nThank you for your contribution.`;
    }

    // Log SMS for development (replace with actual SMS API)
    console.log(`SMS to ${phone}: ${message}`);

    // Here you would integrate with an actual SMS service like:
    // - Africa's Talking
    // - Twilio
    // - SMS gateway
    
    // For now, we'll simulate sending
    const smsResult = {
      success: true,
      messageId: `sms_${Date.now()}`,
      cost: 1.0, // KES
      message: message
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: smsResult,
        message: 'SMS sent successfully (simulated)'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send SMS' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});