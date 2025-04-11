import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  profile: {
    numeric_id?: number;
    first_name?: string;
    last_name?: string;
    phone?: string;
    phone_numbers?: string[];
    kyc_status?: string;
  } | null;
  checkAndCreateWallets: (userId: string) => Promise<void>; // New method
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isAuthenticated: false,
  profile: null,
  checkAndCreateWallets: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  // Optimized profile fetching with error handling
  const fetchProfile = async (userId: string) => {
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

  // New method to check and create wallets
  const checkAndCreateWallets = async (userId: string) => {
    try {
      console.log("Checking wallets for user:", userId);
      
      // Check if wallets already exist
      const { data: existingWallets, error: walletsError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (walletsError) {
        console.error("Error checking existing wallets:", walletsError);
        return;
      }
      
      // If wallets exist, do nothing
      if (existingWallets && existingWallets.length > 0) {
        console.log("Wallets already exist for user");
        return;
      }
      
      // If no wallets exist, create them
      console.log("Creating wallets for user:", userId);
      await supabase.functions.invoke('create-wallets', {
        body: { userId: userId }
      });
    } catch (error) {
      console.error("Error in checkAndCreateWallets:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!isMounted) return;
        
        // Always update basic session state immediately
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user is available, use setTimeout to prevent auth deadlocks
        if (session?.user) {
          setTimeout(async () => {
            if (isMounted) {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
              
              // Only mark as not loading after profile is fetched
              setLoading(false);
              
              // Ensure wallets exist for user on login/signup
              if (event === 'SIGNED_IN') {
                try {
                  console.log("Verifying wallets exist for user:", session.user.id);
                  await supabase.functions.invoke('fetch-wallet-balances', {
                    body: { userId: session.user.id }
                  });
                } catch (error) {
                  console.error("Error checking user wallets:", error);
                }
              }
              
              // Log the full auth state for debugging
              console.log('Auth state after profile fetch:', {
                userId: session.user.id,
                sessionActive: !!session,
                profile: profileData ? 'found' : 'not found',
                token: session.access_token ? 'exists' : 'missing'
              });
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
        
        // Trigger wallet creation only on first sign-in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(async () => {
            if (isMounted) {
              await checkAndCreateWallets(session.user.id);
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session with a timeout to ensure we don't wait forever
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user is available
        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profileData);
              console.log('Existing session found:', {
                userId: session.user.id,
                profile: profileData ? 'loaded' : 'not found'
              });
            }
          } catch (profileError) {
            console.error("Profile fetch error:", profileError);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Add a timeout to ensure we don't wait forever
    const sessionTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log("Auth session check timed out");
        setLoading(false);
      }
    }, 3000); // 3 second maximum wait time
    
    // Run session check
    checkExistingSession();

    return () => {
      isMounted = false;
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Compute isAuthenticated based on session
  const isAuthenticated = !!session && !!user;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signOut,
      isAuthenticated,
      profile,
      checkAndCreateWallets 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
