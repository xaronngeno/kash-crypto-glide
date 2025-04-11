
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
    );

    // Create Supabase client using the auth token to get the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the client (auth context)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Starting deletion process for user: ${user.id}`);

    // Clean up related data first (in order to avoid foreign key constraints)
    
    // 1. Delete user transactions
    console.log("Deleting transactions...");
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', user.id);
    
    if (txError) {
      console.error("Error deleting transactions:", txError);
      // Continue with other deletions
    }
    
    // 2. Delete user wallets
    console.log("Deleting wallets...");
    const { error: walletsError } = await supabaseAdmin
      .from('wallets')
      .delete()
      .eq('user_id', user.id);
    
    if (walletsError) {
      console.error("Error deleting wallets:", walletsError);
      // Continue with other deletions
    }
    
    // 3. Delete user mnemonics
    console.log("Deleting mnemonics...");
    const { error: mnemonicError } = await supabaseAdmin
      .from('user_mnemonics')
      .delete()
      .eq('user_id', user.id);
    
    if (mnemonicError) {
      console.error("Error deleting mnemonics:", mnemonicError);
      // Continue with other deletions
    }

    // 4. Delete the user profile
    console.log("Deleting profile...");
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      // Continue with user deletion
    }

    // Finally delete the user from auth
    console.log("Deleting auth user...");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
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
