
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ProfileData, fetchProfile } from '@/utils/profileUtils';

export type AuthSessionState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: ProfileData | null;
  isAuthenticated: boolean;
};

export const useAuthSession = (): AuthSessionState & {
  signOut: () => Promise<void>;
} => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

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

  return {
    session,
    user,
    loading,
    profile,
    isAuthenticated: !!session && !!user,
    signOut
  };
};
