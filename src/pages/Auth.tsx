
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, X, User, Phone } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define different authentication stages
enum AuthStage {
  EMAIL_INPUT = 'email_input',
  PASSWORD_INPUT = 'password_input',
  SIGNUP = 'signup',
  EMAIL_VERIFICATION = 'email_verification',
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authStage, setAuthStage] = useState<AuthStage>(AuthStage.EMAIL_INPUT);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    };
    
    checkUser();
  }, [navigate]);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: "checking-only", // Dummy password to check if email exists
      });
      
      if (error && error.message.includes("Invalid login credentials")) {
        // Email doesn't exist, move to signup stage
        setAuthStage(AuthStage.SIGNUP);
      } else if (error) {
        // Some other error occurred with the login check
        if (error.message.includes("Email not confirmed")) {
          setAuthStage(AuthStage.EMAIL_VERIFICATION);
        } else {
          // If error but not "invalid credentials", move to password stage anyway
          // Could be wrong password but email exists
          setAuthStage(AuthStage.PASSWORD_INPUT);
        }
      } else {
        // User exists and credentials are valid (shouldn't happen with dummy password)
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
  
  // Handler for user signup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Split name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Move to email verification stage
      setAuthStage(AuthStage.EMAIL_VERIFICATION);
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Clears email and returns to email input stage
  const handleReset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setAuthStage(AuthStage.EMAIL_INPUT);
  };
  
  // Renders the stage-specific form
  const renderAuthForm = () => {
    switch (authStage) {
      case AuthStage.EMAIL_INPUT:
        return (
          <form className="space-y-6 w-full" onSubmit={handleEmailCheck}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-50"
                autoFocus
                required
              />
            </div>

            <KashButton 
              type="submit" 
              fullWidth 
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white mt-4"
            >
              {loading ? 'Processing...' : 'Continue'}
            </KashButton>
          </form>
        );
        
      case AuthStage.PASSWORD_INPUT:
        return (
          <div className="space-y-6 w-full">
            <div className="bg-green-50 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center bg-green-200 rounded-full w-8 h-8 mr-3">
                  <span className="font-medium text-green-800">
                    {email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-green-800">{email}</span>
              </div>
              <button 
                type="button" 
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Change email"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handlePasswordLogin}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-gray-50"
                    autoFocus
                    required
                  />
                </div>

                <KashButton 
                  type="submit" 
                  fullWidth 
                  disabled={loading}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {loading ? 'Signing in...' : 'Log in'}
                </KashButton>
              </div>
            </form>
          </div>
        );
        
      case AuthStage.SIGNUP:
        return (
          <div className="space-y-6 w-full">
            <div className="bg-blue-50 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-800">{email}</span>
              </div>
              <button 
                type="button" 
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Change email"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-gray-50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Mobile phone number
                </label>
                <div className="flex">
                  <div className="flex items-center justify-center bg-gray-50 border border-gray-300 border-r-0 rounded-l-md px-3">
                    <span className="text-gray-500">+254</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7XX XXX XXX"
                    className="w-full rounded-l-none bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="signupPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-gray-50"
                  required
                />
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  By continuing you agree to the <a href="#" className="text-blue-600 hover:underline">Terms</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>
              </div>

              <KashButton 
                type="submit" 
                fullWidth 
                disabled={loading}
                className="bg-black hover:bg-gray-800 text-white mt-2"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </KashButton>
            </form>
          </div>
        );
        
      case AuthStage.EMAIL_VERIFICATION:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-md p-4">
              <h3 className="font-medium text-blue-700 mb-2">Check your email</h3>
              <p className="text-sm text-blue-600">
                We've sent a verification link to <strong>{email}</strong>. 
                Click the link in the email to verify your account.
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
                onClick={handleReset}
                disabled={loading}
                className="border-black text-black hover:bg-gray-50"
              >
                Use a different email
              </KashButton>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="pt-6 px-6">
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white font-bold">K</span>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Welcome to Kash</h2>
          <p className="mt-2 text-center text-sm text-gray-600 mb-8">
            Log in or sign up to get started.
          </p>
          
          <div className="w-full max-w-md mx-auto">
            {renderAuthForm()}
          </div>
        </div>
      </div>
      
      <footer className="py-6 px-6 flex flex-col items-center">
        <div className="mb-4">
          <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-full bg-gray-50">
            Help
          </button>
        </div>
        <div className="flex justify-center space-x-4 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-700">Terms</a>
          <a href="#" className="hover:text-gray-700">Privacy</a>
          <a href="#" className="hover:text-gray-700">Cookies</a>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
