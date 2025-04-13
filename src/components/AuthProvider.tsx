
import React, { createContext, useContext, useEffect, useState } from 'react';
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
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isAuthenticated: false,
  profile: null,
});

export const useAuth = () => useContext(AuthContext);

// Define AuthProvider as a function component to ensure hooks work properly
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

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

  useEffect(() => {
    let isMounted = true;
    
    const handleHashChange = async () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error parsing hash URL:', error);
          } else if (data.session) {
            console.log('Successfully authenticated from redirect');
            window.location.hash = '';
          }
        } catch (err) {
          console.error('Failed to parse hash URL:', err);
        }
      }
    };
    
    handleHashChange();
    
    // Set up the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential React state update issues
          setTimeout(async () => {
            if (isMounted) {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
              
              setLoading(false);
              
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
      }
    );

    // Check for existing sessions
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
    
    const sessionTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log("Auth session check timed out");
        setLoading(false);
      }
    }, 3000);
    
    checkExistingSession();

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      isMounted = false;
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
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

  const isAuthenticated = !!session && !!user;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signOut,
      isAuthenticated,
      profile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the component
export { AuthProvider };
