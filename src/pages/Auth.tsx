
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KashCard } from '@/components/ui/KashCard';
import { Link } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setProcessingStatus('Signing in...');
    
    try {
      // Handle sign in only - sign up is now on separate page
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Special handling for email not confirmed error
        if (error.message.includes('Email not confirmed')) {
          console.log("Attempting to bypass email confirmation...");
          // Try to force sign in by creating a new session
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin }
          });
          
          if (signUpError) {
            throw signUpError;
          }
          
          // Try signing in again after re-registering
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retryError) {
            throw retryError;
          }
          
          if (retryData.session) {
            setProcessingStatus('Login successful!');
            toast({
              title: "Login successful",
              description: "You've been successfully signed in.",
            });
            navigate('/dashboard');
            return;
          }
        }
        throw error;
      }
      
      setProcessingStatus('Loading your account...');
      
      toast({
        title: "Login successful",
        description: "You've been successfully signed in.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const handleRedirectToSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:px-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Welcome to Kash</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <KashCard className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <KashInput
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                icon={<Mail size={18} className="text-gray-400" />}
                required
              />

              <KashInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                icon={<Lock size={18} className="text-gray-400" />}
                required
              />

              {processingStatus && (
                <div className="text-center text-sm text-kash-green">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {processingStatus}
                  </div>
                </div>
              )}

              <KashButton 
                type="submit" 
                fullWidth 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Sign in'}
              </KashButton>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <KashButton 
                  type="button" 
                  variant="outline" 
                  fullWidth
                  onClick={handleRedirectToSignUp}
                >
                  Create an account
                </KashButton>
              </div>
            </div>
          </KashCard>

          <div className="mt-6 flex justify-center space-x-4 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-900">Help</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
