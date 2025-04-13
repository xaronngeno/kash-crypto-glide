
import { supabase } from '@/integrations/supabase/client';

export type ProfileData = {
  numeric_id?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_numbers?: string[];
  kyc_status?: string;
};

export const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('numeric_id, first_name, last_name, phone, phone_numbers, kyc_status')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
};
