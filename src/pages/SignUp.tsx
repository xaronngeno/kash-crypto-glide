
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateAllWallets } from '@/utils/walletGenerators';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '+254',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Register user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: formData.phone
          }
        }
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        console.error("Registration error:", error);
      } else {
        toast({
          title: "Account created",
          description: "Your account has been successfully created.",
        });
        
        // Create wallets for the new user
        if (data.user) {
          try {
            // Generate wallets (now properly handling Promise)
            const wallets = await generateAllWallets();
            console.log("Generated wallets:", wallets.length);
            
            // Prepare wallet data for database storage
            const walletInserts = wallets.map(wallet => ({
              user_id: data.user!.id,
              blockchain: wallet.blockchain,
              currency: wallet.blockchain, // Use blockchain as currency for now
              address: wallet.address,
              balance: 0,
              wallet_type: wallet.walletType || 'Default'
            }));
            
            // Insert wallets into database
            const { error: walletsError } = await supabase
              .from('wallets')
              .insert(walletInserts);
              
            if (walletsError) {
              console.error("Error creating wallets:", walletsError);
              toast({
                title: "Wallet creation issue",
                description: "There was an issue creating some of your wallets. Please contact support.",
                variant: "destructive"
              });
            } else {
              console.log("Successfully created wallets for user");
            }
          } catch (walletError) {
            console.error("Error generating wallets:", walletError);
            toast({
              title: "Wallet creation failed",
              description: "Failed to create your cryptocurrency wallets. Please contact support.",
              variant: "destructive"
            });
          }
        }
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 lg:px-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Kash and start your crypto journey
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10">
            <form className="space-y-5" onSubmit={handleSignUp}>
              <KashInput
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                icon={<User size={18} className="text-gray-400" />}
                required
              />

              <KashInput
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                icon={<Mail size={18} className="text-gray-400" />}
                required
              />

              <KashInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                icon={<Phone size={18} className="text-gray-400" />}
                required
              />

              <KashInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                icon={<Lock size={18} className="text-gray-400" />}
                required
              />

              <KashInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                icon={<Lock size={18} className="text-gray-400" />}
                required
              />

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-kash-green border-gray-300 rounded focus:ring-kash-green"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the <a href="#" className="text-kash-green">Terms of Service</a> and <a href="#" className="text-kash-green">Privacy Policy</a>
                </label>
              </div>

              <KashButton 
                type="submit" 
                fullWidth 
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </KashButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/signin" className="font-medium text-kash-green hover:text-kash-green/80">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
