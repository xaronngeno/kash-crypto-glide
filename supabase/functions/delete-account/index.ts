
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase admin client for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Create Supabase client using the auth token to get the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user from the client (auth context)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Clean up related data first
    // This is necessary to avoid foreign key constraint issues
    
    // 1. Delete user wallets
    const { error: walletsError } = await supabaseAdmin
      .from('wallets')
      .delete()
      .eq('user_id', user.id);
    
    if (walletsError) {
      console.error("Error deleting wallets:", walletsError);
      // Continue with deletion, don't return early
    }
    
    // 2. Delete user transactions
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', user.id);
    
    if (txError) {
      console.error("Error deleting transactions:", txError);
      // Continue with deletion, don't return early
    }
    
    // 3. Delete user mnemonics
    const { error: mnemonicError } = await supabaseAdmin
      .from('user_mnemonics')
      .delete()
      .eq('user_id', user.id);
    
    if (mnemonicError) {
      console.error("Error deleting mnemonics:", mnemonicError);
      // Continue with deletion, don't return early
    }

    // Delete the user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      // Continue with deletion, don't return early
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`User ${user.id} successfully deleted`);
    
    return new Response(
      JSON.stringify({ success: true, message: "Account successfully deleted" }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete account' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
