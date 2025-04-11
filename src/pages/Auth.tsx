import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, X, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

enum AuthStage {
  EMAIL_INPUT = 'email_input',
  PASSWORD_INPUT = 'password_input',
  SIGNUP = 'signup',
  EMAIL_VERIFICATION = 'email_verification',
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authStage, setAuthStage] = useState<AuthStage>(AuthStage.EMAIL_INPUT);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  useEffect(() => {
    setError(null);
  }, [authStage]);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        return;
      }
      
      if (data.session) {
        console.log("User already authenticated, redirecting");
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    };
    
    checkUser();
  }, [navigate, location]);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Checking email existence:", email);
      
      const { data: existingUsers, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .limit(1);
      
      if (userError) {
        console.error("Error checking email:", userError);
        throw userError;
      }
      
      if (!existingUsers || existingUsers.length === 0) {
        console.log("Email not found in profiles, proceeding to signup");
        setAuthStage(AuthStage.SIGNUP);
      } else {
        console.log("Email found, proceeding to password input");
        setAuthStage(AuthStage.PASSWORD_INPUT);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      try {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          }
        });
        
        if (otpError && otpError.message.includes("Email not found")) {
          console.log("Email not found via OTP check, proceeding to signup");
          setAuthStage(AuthStage.SIGNUP);
        } else {
          setAuthStage(AuthStage.PASSWORD_INPUT);
        }
      } catch (otpError: any) {
        console.error("OTP check error:", otpError);
        setError(error?.message || "Failed to check email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password) {
      setError("Please enter your password");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      console.log("Login successful:", data.session ? "Session created" : "No session");
      
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      setTimeout(() => {
        toast({
          title: "Login successful",
          description: "You've been successfully signed in.",
        });
      }, 100);
    } catch (error: any) {
      console.error("Authentication error:", error);
      setError(error?.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    
    setLoading(true);
    
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
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Signup response:", {
        user: data?.user?.id || "none",
        session: data?.session ? "created" : "none",
        emailConfirm: data?.user?.identities?.[0]?.identity_data?.email_verified || false
      });
      
      if (data?.user?.identities?.length === 0) {
        setAuthStage(AuthStage.EMAIL_VERIFICATION);
        toast({
          title: "Email already registered",
          description: "This email is already registered but not confirmed. Please check your email for verification.",
        });
      } else if (data?.user && !data.session) {
        setAuthStage(AuthStage.EMAIL_VERIFICATION);
        toast({
          title: "Verification email sent",
          description: "Please check your email to verify your account.",
        });
      } else if (data?.session) {
        navigate('/dashboard');
        toast({
          title: "Account created",
          description: "Your account has been created and you are now logged in.",
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setAuthStage(AuthStage.EMAIL_INPUT);
    setError(null);
  };
  
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-gray-50 pr-10"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

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
            
            <div className="flex justify-between text-sm">
              <button 
                onClick={() => setAuthStage(AuthStage.SIGNUP)} 
                className="text-kash-green hover:underline"
              >
                Create account
              </button>
              <button 
                onClick={() => toast({
                  title: "Password Reset",
                  description: "This feature is coming soon.",
                })} 
                className="text-kash-green hover:underline"
              >
                Forgot password?
              </button>
            </div>
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
                <div className="relative">
                  <Input
                    id="signupPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full bg-gray-50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-gray-50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
            
            <div className="text-center">
              <button 
                onClick={() => setAuthStage(AuthStage.PASSWORD_INPUT)} 
                className="text-sm text-kash-green hover:underline"
              >
                I already have an account
              </button>
            </div>
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
              
              <button 
                onClick={() => {
                  toast({
                    title: "Verification email",
                    description: "If you didn't receive the email, please check your spam folder or try again later.",
                  });
                }}
                className="text-sm text-kash-green hover:underline"
              >
                Didn't receive an email?
              </button>
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
          <button 
            onClick={() => toast({
              title: "Help",
              description: "Need assistance? Contact us at support@kash.app",
            })}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-full bg-gray-50"
          >
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
