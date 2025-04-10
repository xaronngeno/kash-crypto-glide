
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const signUpSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const handleSignUp = async (values: SignUpFormValues) => {
    setLoading(true);
    setProcessingStatus('Validating information...');
    
    try {
      // Split name into first and last name
      setProcessingStatus('Creating your account...');
      const nameParts = values.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Register user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
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
        // Generate wallets immediately
        setProcessingStatus('Generating secure wallets...');
        
        if (data.user) {
          try {
            console.log("Calling wallet creation edge function");
            
            const { data: walletData, error: walletError } = await supabase.functions.invoke('create-wallets', {
              method: 'POST',
              body: { userId: data.user.id }
            });
            
            if (walletError) {
              console.error("Error calling wallet creation function:", walletError);
              toast({
                title: "Wallet creation warning",
                description: "Your account was created, but there was an issue setting up your wallets.",
                variant: "default"
              });
            } else {
              console.log("Wallets created successfully:", walletData);
              toast({
                title: "Account created",
                description: "Your account has been created with secure wallets!",
              });
            }
          } catch (walletError) {
            console.error("Error in wallet creation process:", walletError);
            toast({
              title: "Account created",
              description: "Your account was created, but there was an issue setting up your wallets.",
              variant: "default"
            });
          } finally {
            // Navigate to dashboard after wallet creation attempt is done
            navigate('/dashboard');
          }
        } else {
          toast({
            title: "Account created",
            description: "Your account has been successfully created.",
          });
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProcessingStatus('');
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <KashInput
                          {...field}
                          placeholder="Enter your name"
                          icon={<User size={18} className="text-gray-400" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <KashInput
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          icon={<Mail size={18} className="text-gray-400" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <KashInput
                          {...field}
                          type="password"
                          placeholder="Create a password"
                          icon={<Lock size={18} className="text-gray-400" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <KashInput
                          {...field}
                          type="password"
                          placeholder="Confirm your password"
                          icon={<Lock size={18} className="text-gray-400" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 text-kash-green border-gray-300 rounded focus:ring-kash-green"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-gray-900">
                          I agree to the <a href="#" className="text-kash-green">Terms of Service</a> and <a href="#" className="text-kash-green">Privacy Policy</a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {processingStatus && (
                  <div className="text-center text-sm text-kash-green">
                    <div className="flex items-center justify-center mb-2">
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </KashButton>
              </form>
            </Form>

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
