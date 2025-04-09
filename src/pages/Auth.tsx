
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRightCircle } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KashCard } from '@/components/ui/KashCard';
import { Link } from 'react-router-dom';

// Define different authentication stages
enum AuthStage {
  EMAIL_INPUT = 'email_input',
  PASSWORD_INPUT = 'password_input',
  EMAIL_VERIFICATION = 'email_verification',
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authStage, setAuthStage] = useState<AuthStage>(AuthStage.EMAIL_INPUT);

  // Handler for checking email and proceeding to next stage
  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if user exists with this email
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      // If we get an error indicating no user exists
      if (error && error.message.includes("Email not found")) {
        // Send magic link for account creation
        const { data: signUpData, error: signUpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          }
        });
        
        if (signUpError) {
          throw signUpError;
        }
        
        // Switch to email verification stage
        setAuthStage(AuthStage.EMAIL_VERIFICATION);
        
        toast({
          title: "Email sent",
          description: "Check your email for a sign-up link",
        });
      } else if (error) {
        // Some other error occurred
        throw error;
      } else {
        // User exists, move to password stage
        setAuthStage(AuthStage.PASSWORD_INPUT);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler for password-based login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // Navigate immediately to dashboard
      navigate('/dashboard');
      
      // Show toast after navigation has started
      setTimeout(() => {
        toast({
          title: "Login successful",
          description: "You've been successfully signed in.",
        });
      }, 100);
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for resending the verification email
  const handleResendEmail = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Email resent",
        description: "Check your email for the verification link",
      });
    } catch (error: any) {
      console.error("Email resend error:", error);
      toast({
        title: "Failed to resend email",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render appropriate form based on current authentication stage
  const renderAuthForm = () => {
    switch (authStage) {
      case AuthStage.EMAIL_INPUT:
        return (
          <form className="space-y-6" onSubmit={handleEmailCheck}>
            <KashInput
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={<Mail size={18} className="text-gray-400" />}
              required
            />

            <KashButton 
              type="submit" 
              fullWidth 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </KashButton>
          </form>
        );
        
      case AuthStage.PASSWORD_INPUT:
        return (
          <form className="space-y-6" onSubmit={handlePasswordLogin}>
            <div className="mb-2">
              <p className="text-sm text-gray-600">Logging in as: <strong>{email}</strong></p>
              <button 
                type="button" 
                onClick={() => setAuthStage(AuthStage.EMAIL_INPUT)}
                className="text-xs text-kash-green hover:underline"
              >
                Change email
              </button>
            </div>
            
            <KashInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={<Lock size={18} className="text-gray-400" />}
              required
              autoFocus
            />

            <KashButton 
              type="submit" 
              fullWidth 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </KashButton>
          </form>
        );
        
      case AuthStage.EMAIL_VERIFICATION:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-medium text-blue-700 mb-2">Check your email</h3>
              <p className="text-sm text-blue-600">
                We've sent a verification link to <strong>{email}</strong>. 
                Click the link in the email to continue.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                After verification, your account will be created with a unique ID
                and wallets will be automatically generated.
              </p>
            </div>
            
            <div className="flex flex-col space-y-4">
              <KashButton 
                type="button" 
                variant="outline"
                onClick={handleResendEmail}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend verification email'}
              </KashButton>
              
              <button 
                type="button" 
                onClick={() => setAuthStage(AuthStage.EMAIL_INPUT)}
                className="text-sm text-kash-green hover:underline self-center"
              >
                Use a different email
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:px-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Welcome to Kash</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {authStage === AuthStage.EMAIL_VERIFICATION 
              ? 'Verify your email to continue' 
              : authStage === AuthStage.PASSWORD_INPUT 
                ? 'Enter your password to sign in'
                : 'Sign in to your account or create a new one'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <KashCard className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10">
            {renderAuthForm()}
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
