
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the webhook payload
    const webhookData = await req.json();
    console.log('Received M-PESA webhook:', webhookData);

    // Extract relevant data from the callback
    const {
      ResultCode,
      ResultDesc,
      TransactionType,
      TransID,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN, // Phone number
      FirstName,
    } = webhookData;

    // Find the pending transaction in our database
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_reference', BillRefNumber)
      .eq('status', 'pending')
      .single();

    if (findError) {
      console.error('Error finding transaction:', findError);
      throw new Error('Transaction not found');
    }

    // Update transaction status based on M-PESA result
    if (ResultCode === '0') { // Success
      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          tx_hash: TransID,
          mpesa_phone: MSISDN,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }

      // Credit the user's wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: transaction.amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id)
        .eq('currency', 'USDT');

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        throw walletError;
      }

      console.log('Successfully processed M-PESA payment:', TransID);
    } else {
      // Update transaction as failed
      const { error: failError } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (failError) {
        console.error('Error marking transaction as failed:', failError);
        throw failError;
      }

      console.error('M-PESA payment failed:', ResultDesc);
    }

    // Return success response to M-PESA
    return new Response(
      JSON.stringify({
        ResultCode: "0",
        ResultDesc: "Confirmation received successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process webhook' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
