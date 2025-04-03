
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight request
function handleCors(req: Request): Response | undefined {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return undefined;
}

// Base64 encode credentials for authentication
function encodeCredentials(consumerKey: string, consumerSecret: string): string {
  const credentials = `${consumerKey}:${consumerSecret}`;
  return btoa(credentials);
}

// Get access token from Safaricom
async function getAccessToken(): Promise<string> {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY") || "";
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET") || "";
  
  const auth = encodeCredentials(consumerKey, consumerSecret);
  
  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error("Error getting access token:", data);
    throw new Error("Failed to get access token");
  }
  
  return data.access_token;
}

// Generate timestamp in the format required by Safaricom
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// Generate the password for the STK push
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = shortcode + passkey + timestamp;
  return btoa(str);
}

// Initiate the STK push
async function initiateSTKPush(
  phone: string,
  amount: number,
  callbackUrl: string,
  accountReference: string,
  description: string
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    const shortcode = Deno.env.get("MPESA_SHORTCODE") || "";
    const passkey = Deno.env.get("MPESA_PASSKEY") || "";
    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);
    
    // Format phone number (remove + if present)
    const formattedPhone = phone.startsWith("+") ? phone.substring(1) : phone;
    
    const data = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: description,
    };
    
    console.log("Initiating STK push with data:", JSON.stringify(data));
    
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      }
    );
    
    const responseData = await response.json();
    console.log("STK push response:", JSON.stringify(responseData));
    
    return responseData;
  } catch (error) {
    console.error("Error in STK push:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { phone, amount, callbackUrl, reference, description } = await req.json();
    
    // Validate inputs
    if (!phone || !amount) {
      return new Response(
        JSON.stringify({ error: "Phone number and amount are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Initiate the STK push
    const result = await initiateSTKPush(
      phone,
      amount,
      callbackUrl || "https://example.com/callback", // Replace with your callback URL in production
      reference || "Kash Crypto Purchase",
      description || "Purchase USDT with M-PESA"
    );
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
