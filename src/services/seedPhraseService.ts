
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the seed phrase for a user from Supabase
 */
export const fetchSeedPhrase = async (userId: string, password: string): Promise<string> => {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  console.log("Fetching seed phrase for user:", userId);
  
  // Fetch the seed phrase through the Supabase edge function
  const { data, error } = await supabase.functions.invoke('get-seed-phrase', {
    method: 'POST',
    body: { userId, password }
  });

  if (error) {
    throw new Error(`Failed to fetch seed phrase: ${error.message}`);
  }

  if (!data?.seedPhrase) {
    throw new Error("No seed phrase found for this user");
  }

  console.log("Seed phrase retrieved successfully");
  return data.seedPhrase;
};
