
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

    const {
      ResultCode,
      ResultDesc,
      TransID,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN, // Phone number
    } = webhookData;

    // Find the pending transaction in our database
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_reference', BillRefNumber)
      .eq('status', 'pending')
      .maybeSingle();

    if (findError) {
      console.error('Error finding transaction:', findError);
      throw new Error('Transaction not found');
    }

    if (!transaction) {
      console.error('No pending transaction found for reference:', BillRefNumber);
      throw new Error('No pending transaction found');
    }

    // Update transaction status based on M-PESA result
    if (ResultCode === '0') { // Success
      // Update transaction status to completed
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

      // Find or create USDT wallet for the user
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('currency', 'USDT')
        .maybeSingle();

      if (walletError) {
        console.error('Error finding wallet:', walletError);
        throw walletError;
      }

      if (wallet) {
        // Update existing wallet balance
        const newBalance = (parseFloat(wallet.balance) || 0) + parseFloat(transaction.amount);
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);

        if (updateWalletError) {
          console.error('Error updating wallet:', updateWalletError);
          throw updateWalletError;
        }
      } else {
        // Create new USDT wallet if it doesn't exist
        const { error: createWalletError } = await supabase
          .from('wallets')
          .insert({
            user_id: transaction.user_id,
            currency: 'USDT',
            blockchain: 'Tron',
            balance: transaction.amount,
            wallet_type: 'token'
          });

        if (createWalletError) {
          console.error('Error creating wallet:', createWalletError);
          throw createWalletError;
        }
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
