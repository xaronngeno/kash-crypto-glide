
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Set up Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Headers for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Function to handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authorization - for admin use only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // In a real app, you'd check role-based permissions instead of email domain
    if (user.email?.endsWith('@kash.africa') !== true) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get all users without a numeric_id
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .is('numeric_id', null);
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }
    
    console.log(`Found ${profiles ? profiles.length : 0} profiles without numeric_id`);
    
    // If no profiles need IDs, return early
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No profiles need ID assignment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update each profile with a newly generated ID
    const results = [];
    let successCount = 0;
    
    for (const profile of profiles) {
      // Generate a random 8-digit ID between 10000000 and 99999999
      let numeric_id;
      let idUnique = false;
      
      // Try up to 10 times to generate a unique ID
      for (let attempts = 0; attempts < 10 && !idUnique; attempts++) {
        numeric_id = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
        
        // Check if the generated ID already exists
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('numeric_id', numeric_id);
        
        if (!countError && count === 0) {
          idUnique = true;
        }
      }
      
      if (!idUnique) {
        results.push({ id: profile.id, status: 'failed', error: 'Could not generate unique ID after multiple attempts' });
        continue;
      }
      
      // Update the profile with the new ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ numeric_id })
        .eq('id', profile.id);
      
      if (updateError) {
        results.push({ id: profile.id, status: 'failed', error: updateError.message });
      } else {
        results.push({ id: profile.id, status: 'assigned', numeric_id });
        successCount++;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Assigned IDs to ${successCount} of ${profiles.length} profiles`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error assigning user IDs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
