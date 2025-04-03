
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
  try {
    // Check if we have the required environment variables
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    
    if (!consumerKey || !consumerSecret) {
      console.error("Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET");
      throw new Error("Missing required API credentials");
    }
    
    console.log("M-PESA credentials available, generating auth token");
    const auth = encodeCredentials(consumerKey, consumerSecret);
    
    // Make the request to Safaricom
    console.log("Making request to Safaricom auth endpoint");
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    
    // Log the status code
    console.log(`Auth response status: ${response.status}`);
    
    // Get the response text for better error logging
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("Error getting access token:", responseText);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      console.log("Successfully obtained access token");
      return data.access_token;
    } catch (parseError) {
      console.error("Error parsing auth response:", parseError, "Response was:", responseText);
      throw new Error(`Failed to parse auth response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in getAccessToken:", error);
    throw error;
  }
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
    console.log(`Initiating STK push for ${phone}, amount: ${amount}`);
    
    // Get Safaricom API credentials
    const accessToken = await getAccessToken();
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    
    if (!shortcode || !passkey) {
      console.error("Missing MPESA_SHORTCODE or MPESA_PASSKEY");
      throw new Error("Missing required API credentials");
    }
    
    console.log("Generating STK push parameters");
    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);
    
    // Format phone number (remove + if present and ensure it starts with 254)
    let formattedPhone = phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }
    // If it starts with 0, replace with 254
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    }
    // If it doesn't start with 254, add it
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }
    
    console.log(`Formatted phone number: ${formattedPhone}`);
    
    const data = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount), // Ensure amount is an integer
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: description,
    };
    
    console.log("STK push request data:", JSON.stringify(data));
    
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      }
    );
    
    console.log(`STK push response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`STK push response body: ${responseText}`);
    
    // Check for network errors or non-2xx responses
    if (!response.ok) {
      try {
        // Try to parse as JSON if possible
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.errorMessage || `M-PESA API error: ${response.status}`);
      } catch (e) {
        // If not valid JSON, use the text
        throw new Error(`M-PESA API error: ${response.status} - ${responseText.substring(0, 100)}`);
      }
    }
    
    try {
      const responseData = JSON.parse(responseText);
      console.log("STK push successful:", JSON.stringify(responseData));
      return responseData;
    } catch (parseError) {
      console.error("Error parsing STK push response:", parseError);
      throw new Error("Failed to parse STK push response");
    }
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
    
    // Log all available environment variables (without revealing values)
    console.log("Available environment variables: ", Object.keys(Deno.env.toObject()).join(", "));
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Received request data:", JSON.stringify(requestData));
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { phone, amount, callbackUrl, reference, description } = requestData;
    
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
    try {
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
    } catch (stkError) {
      console.error("STK push error:", stkError);
      return new Response(
        JSON.stringify({ 
          error: stkError.message || "Failed to initiate M-PESA payment",
          details: stkError.stack || "No stack trace available"
        }),
        {
          status: 400, // Use 400 instead of 500 to prevent Edge Function error
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.stack || "No stack trace available"
      }),
      {
        status: 400, // Use 400 instead of 500 to prevent Edge Function error
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
