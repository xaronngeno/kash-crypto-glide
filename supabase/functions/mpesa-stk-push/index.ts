
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
      throw new Error("Missing required M-PESA API credentials");
    }
    
    // Log the first and last 3 characters of the key for debugging (avoid logging full credentials)
    console.log("M-PESA consumer key found:", 
      consumerKey.substring(0, 3) + "..." + consumerKey.substring(consumerKey.length - 3));
    console.log("M-PESA consumer secret found:", 
      consumerSecret.substring(0, 3) + "..." + consumerSecret.substring(consumerSecret.length - 3));
    
    const auth = encodeCredentials(consumerKey, consumerSecret);
    
    // Make the request to Safaricom
    // Note: For live environment, change the URL
    let authUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    
    // Check if we're using production credentials (this is a simple heuristic)
    if (!consumerKey.toLowerCase().includes("test") && 
        !consumerKey.toLowerCase().includes("sandbox") && 
        consumerKey.length > 20) {
      authUrl = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
      console.log("Using production M-PESA environment");
    } else {
      console.log("Using sandbox M-PESA environment");
    }
    
    console.log("Auth URL:", authUrl);
    
    const response = await fetch(
      authUrl,
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
    console.log("Raw auth response:", responseText);
    
    if (!response.ok) {
      // Try to stringify the error response for better debugging
      try {
        const errorData = JSON.parse(responseText);
        console.error("Parsed auth error:", JSON.stringify(errorData));
        throw new Error(`Failed to get M-PESA access token: ${response.status} ${response.statusText} - ${errorData.errorMessage || JSON.stringify(errorData)}`);
      } catch (parseError) {
        // If parsing fails, use the raw text
        console.error("Auth error (raw):", responseText);
        throw new Error(`Failed to get M-PESA access token: ${response.status} ${response.statusText} - ${responseText}`);
      }
    }
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      if (!data.access_token) {
        console.error("Auth response missing access_token:", data);
        throw new Error("M-PESA API returned invalid response format - missing access token");
      }
      
      console.log("Successfully obtained access token:", 
        data.access_token.substring(0, 10) + "...");
      return data.access_token;
    } catch (parseError) {
      console.error("Error parsing auth response:", parseError, "Response was:", responseText);
      throw new Error(`Failed to parse M-PESA auth response: ${parseError.message}`);
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
      throw new Error("Missing required M-PESA API credentials");
    }
    
    console.log("Shortcode found:", shortcode);
    console.log("Passkey found:", passkey.substring(0, 3) + "..." + passkey.substring(passkey.length - 3));
    
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
      CallBackURL: callbackUrl || "https://example.com/callback",
      AccountReference: accountReference || "KashApp",
      TransactionDesc: description || "Purchase USDT",
    };
    
    console.log("STK push request data:", JSON.stringify(data));
    
    // Determine if we should use production or sandbox URL
    let pushUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    
    // Check if we're using production credentials
    if (!shortcode.includes("test") && 
        !shortcode.includes("sandbox") && 
        shortcode.length > 4) {
      pushUrl = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      console.log("Using production M-PESA STK push URL");
    } else {
      console.log("Using sandbox M-PESA STK push URL");
    }
    
    console.log("STK push URL:", pushUrl);
    
    const response = await fetch(
      pushUrl,
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
    console.log(`STK push raw response: ${responseText}`);
    
    // Check for network errors or non-2xx responses
    if (!response.ok) {
      try {
        // Try to parse as JSON if possible
        const errorJson = JSON.parse(responseText);
        console.error("STK push error (parsed):", JSON.stringify(errorJson));
        throw new Error(errorJson.errorMessage || `M-PESA API error: ${response.status} - ${JSON.stringify(errorJson)}`);
      } catch (e) {
        // If not valid JSON, use the text
        console.error("STK push error (raw):", responseText);
        throw new Error(`M-PESA API error: ${response.status} - ${responseText.substring(0, 200)}`);
      }
    }
    
    try {
      const responseData = JSON.parse(responseText);
      console.log("STK push successful:", JSON.stringify(responseData));
      return responseData;
    } catch (parseError) {
      console.error("Error parsing STK push response:", parseError);
      throw new Error(`Failed to parse M-PESA STK push response: ${parseError.message}`);
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
    const envVars = Object.keys(Deno.env.toObject());
    console.log("Available environment variables: ", envVars.join(", "));
    console.log("M-PESA related variables present:", 
      envVars.includes("MPESA_CONSUMER_KEY"), 
      envVars.includes("MPESA_CONSUMER_SECRET"),
      envVars.includes("MPESA_SHORTCODE"),
      envVars.includes("MPESA_PASSKEY")
    );
    
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
      
      // Format the error message for better client-side display
      const errorMessage = stkError.message || "Failed to initiate M-PESA payment";
      const errorDetails = {
        error: errorMessage,
        code: "MPESA_API_ERROR",
        details: stkError.stack || "No stack trace available",
        time: new Date().toISOString()
      };
      
      return new Response(
        JSON.stringify(errorDetails),
        {
          status: 400, // Use 400 instead of 500 to prevent Edge Function error
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Format the general error for better client-side display
    const errorDetails = {
      error: error.message || "Internal server error",
      code: "EDGE_FUNCTION_ERROR",
      details: error.stack || "No stack trace available",
      time: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 400, // Use 400 instead of 500 to prevent Edge Function error
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
