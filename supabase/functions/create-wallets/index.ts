
// Create wallets edge function - this will help with wallet generation performance
// Follow Supabase Edge Runtime API and Deno standards
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalletData {
  blockchain: string;
  address: string;
  wallet_type?: string;
}

// Generate a simple mock wallet address for now - replace with real crypto libraries later
function generateMockWalletAddress(blockchain: string): string {
  const prefix = {
    'Bitcoin': 'bc1q',
    'Ethereum': '0x',
    'Solana': '',
    'Polygon': '0x',
    'Base': '0x',
    'Monad': '0x',
    'Sui': '0x',
  }[blockchain] || '';
  
  // Generate a random string to represent a wallet address
  const randomChars = Array(40).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)).join('');
  
  return `${prefix}${randomChars}`;
}

// Generate wallets for a user
async function generateWallets(userId: string): Promise<WalletData[]> {
  try {
    // Define blockchains to create wallets for
    const blockchains = [
      'Bitcoin', 'Ethereum', 'Solana', 'Polygon', 'Base', 'Monad', 'Sui'
    ];
    
    console.log(`Generating wallets for user ID: ${userId}`);
    
    // Generate wallets (simplified mock implementation)
    return blockchains.map(blockchain => ({
      blockchain,
      address: generateMockWalletAddress(blockchain),
      wallet_type: 'Default'
    }));
  } catch (error) {
    console.error('Error generating wallets:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Create wallets function called");
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData = await req.json();
    const userId = requestData.userId;
    
    console.log(`Request received for user ID: ${userId}`);
    
    if (!userId) {
      console.error("Missing userId in request body");
      return new Response(JSON.stringify({ error: 'Missing userId in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (profileError || !profileData) {
      console.error(`User profile not found: ${profileError?.message || 'Unknown error'}`);
      return new Response(JSON.stringify({ 
        error: 'User profile not found', 
        details: profileError?.message,
        userId 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate wallets
    const wallets = await generateWallets(userId);
    
    console.log(`Generated ${wallets.length} wallets`);
    
    // Insert the wallets into the database
    const walletInserts = wallets.map(wallet => ({
      user_id: userId,
      blockchain: wallet.blockchain,
      currency: wallet.blockchain, // Use blockchain as currency for now
      address: wallet.address,
      balance: 0
    }));

    // Check if wallets already exist for this user
    const { data: existingWallets, error: existingWalletsError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId);
      
    if (existingWalletsError) {
      console.error(`Error checking existing wallets: ${existingWalletsError.message}`);
    }
    
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User already has ${existingWallets.length} wallets, skipping creation`);
      
      // Return the existing wallets
      const { data: walletData, error: walletDataError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);
        
      if (walletDataError) {
        console.error(`Error fetching existing wallets: ${walletDataError.message}`);
        throw walletDataError;
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Wallets already exist', 
          wallets: walletData,
          count: walletData?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert wallets into the database
    const { data: insertedWallets, error: insertError } = await supabase
      .from('wallets')
      .insert(walletInserts)
      .select();
    
    if (insertError) {
      console.error(`Error inserting wallets: ${insertError.message}`);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedWallets?.length || 0} wallets`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wallets created successfully', 
        wallets: insertedWallets,
        count: wallets.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating wallets:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
