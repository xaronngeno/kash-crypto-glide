
/**
 * Check and assign a numeric ID to a user profile if not already present
 */
export async function ensureUserHasNumericId(supabase: any, userId: string): Promise<boolean> {
  try {
    // Get user profile to check numeric ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("numeric_id")
      .eq("id", userId)
      .single();
      
    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }
    
    if (!profile || !profile.numeric_id) {
      // Assign a numeric ID if not already present
      let numeric_id;
      let idUnique = false;
      
      // Try up to 10 times to generate a unique ID
      for (let attempts = 0; attempts < 10 && !idUnique; attempts++) {
        numeric_id = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
        
        // Check if this ID already exists
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('numeric_id', numeric_id);
        
        if (!countError && count === 0) {
          idUnique = true;
        }
      }
      
      if (!idUnique) {
        throw new Error("Could not generate a unique numeric ID");
      }
      
      // Update the profile with the new numeric ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ numeric_id })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Error updating user's numeric ID: ${updateError.message}`);
      }
      
      console.log(`Assigned numeric ID ${numeric_id} to user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error ensuring numeric ID:", error);
    throw error;
  }
}
