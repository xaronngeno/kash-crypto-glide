import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { KashCard } from '@/components/ui/KashCard';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    
    try {
      // Explicitly request a numeric OTP for email verification
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // Set OTP type to numeric explicitly
          channel: 'email',
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Verification code sent",
        description: "We've sent a verification code to your email.",
      });
      
      setShowOtpInput(true);
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code sent to your email",
        variant: "destructive"
      });
      return;
    }

    setVerifyingOtp(true);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpValue,
        type: 'email'
      });

      if (error) throw error;

      toast({
        title: "Verification successful",
        description: "You've been successfully authenticated.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:px-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Welcome to Kash</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showOtpInput ? 'Enter the verification code sent to your email' : 'Log in or sign up to get started'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <KashCard className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10">
            {!showOtpInput ? (
              <form className="space-y-6" onSubmit={handleContinue}>
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
            ) : (
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Verification Code
                  </label>
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup className="gap-2 justify-center">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-12 border-gray-300 focus:border-kash-green" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <KashButton 
                  type="submit" 
                  fullWidth 
                  disabled={verifyingOtp || otpValue.length !== 6}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify'}
                </KashButton>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={loading}
                    className="text-sm font-medium text-kash-green hover:text-kash-green/80"
                  >
                    {loading ? 'Sending...' : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
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
