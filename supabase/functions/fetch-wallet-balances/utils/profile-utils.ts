
import { corsHeaders } from '../../_shared/cors.ts';

/**
 * Ensures that a user profile exists in the database
 * Creates one if it doesn't exist
 */
export async function ensureUserProfile(supabase: any, userId: string) {
  try {
    // First check if the user exists in the profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error checking user profile:", profileError);
    }
    
    // If user profile doesn't exist, create it
    if (!userProfile) {
      console.log("User profile doesn't exist, creating one");
      // Get user info from auth.users if available
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        console.error("Error getting auth user:", authError);
      }
      
      // Create a new profile entry
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser?.user?.email || null,
          numeric_id: Math.floor(Math.random() * 89999999) + 10000000 // Generate a random 8-digit ID
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Failed to create user profile:", insertError);
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }
      
      console.log("Created new user profile");
      return newProfile;
    }
    
    return userProfile;
  } catch (error) {
    console.error("Error ensuring user profile exists:", error);
    throw error;
  }
}
