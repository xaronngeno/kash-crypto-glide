
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FetchWalletsOptions {
  userId: string;
  onSuccess?: (wallets: any[]) => void;
  onError?: (error: Error) => void;
  forceRefresh?: boolean;
  retryCount?: number;
  useLocalCache?: boolean;
}

const WALLET_CACHE_KEY = 'cached_wallet_data';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches wallet balances from the Supabase edge function
 * with improved error handling, retries, and caching
 */
export const fetchWalletBalances = async ({ 
  userId, 
  onSuccess, 
  onError,
  forceRefresh = false,
  retryCount = 3, // Increased retries
  useLocalCache = true
}: FetchWalletsOptions): Promise<any[] | null> => {
  if (!userId) {
    console.log("No user ID provided for wallet fetch");
    return null;
  }

  // Try to get data from cache if allowed and not forcing refresh
  if (useLocalCache && !forceRefresh) {
    const cachedData = getCachedWallets();
    if (cachedData && cachedData.userId === userId && !isExpired(cachedData.timestamp)) {
      console.log("Using cached wallet data");
      
      if (onSuccess && cachedData.wallets) {
        onSuccess(cachedData.wallets);
      }
      
      return cachedData.wallets;
    }
  }

  try {
    console.log(`Fetching wallets for user: ${userId}${forceRefresh ? ' (forced refresh)' : ''}`);
    
    let attempt = 0;
    let lastError: Error | null = null;
    let data;
    let error;
    
    // Try multiple times with increasing backoff
    while (attempt <= retryCount) {
      if (attempt > 0) {
        // Exponential backoff: wait 500ms, then 1000ms, then 2000ms, etc.
        const backoffTime = Math.min(500 * Math.pow(2, attempt - 1), 8000);
        console.log(`Retry attempt ${attempt} after ${backoffTime}ms delay`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
      
      try {
        // Configure the request with a longer timeout
        const response = await Promise.race([
          supabase.functions.invoke('fetch-wallet-balances', {
            method: 'POST',
            body: { userId, forceRefresh },
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request timeout")), 15000)
          )
        ]);
        
        // Type assertion for TypeScript
        data = (response as any).data;
        error = (response as any).error;
        
        // If successful, break the retry loop
        if (!error) {
          break;
        }
        
        lastError = new Error(`Failed to fetch wallets: ${error.message}`);
      } catch (err) {
        console.error(`Attempt ${attempt + 1}/${retryCount + 1} failed:`, err);
        lastError = err instanceof Error ? err : new Error("Unknown fetch error");
      }
      
      attempt++;
    }
    
    if (error || !data) {
      // If all attempts failed, throw the last error
      throw lastError || new Error("Failed to fetch wallets after multiple attempts");
    }
    
    if (!data.wallets) {
      console.log("No wallets found or empty wallets response");
      return [];
    }

    const wallets = data.wallets;
    console.log(`Successfully fetched ${wallets.length} wallets`);
    
    // Cache successful responses
    if (useLocalCache && wallets.length > 0) {
      cacheWallets(userId, wallets);
    }
    
    if (onSuccess) {
      onSuccess(wallets);
    }
    
    return wallets;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
    console.error('Error fetching wallets:', errorMessage);
    
    if (onError) {
      onError(err instanceof Error ? err : new Error(errorMessage));
    }
    
    // If we have valid cached data, return it as fallback
    if (useLocalCache) {
      const cachedData = getCachedWallets();
      if (cachedData && cachedData.userId === userId) {
        console.log("Falling back to cached wallet data after error");
        return cachedData.wallets;
      }
    }
    
    return null;
  }
};

// Helper function to cache wallet data
function cacheWallets(userId: string, wallets: any[]) {
  try {
    localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify({
      userId,
      wallets,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Failed to cache wallet data:", e);
  }
}

// Helper function to get cached wallet data
function getCachedWallets(): { userId: string, wallets: any[], timestamp: number } | null {
  try {
    const cached = localStorage.getItem(WALLET_CACHE_KEY);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (e) {
    console.warn("Failed to read cached wallet data:", e);
    return null;
  }
}

// Helper function to check if cache is expired
function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
}
