
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, CreditCard, LogOut, Trash2, ChevronRight, Key, Eye, EyeOff, Lock, Copy } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isAuthenticated, loading: authLoading } = useAuth();
  const [currencyDisplay, setCurrencyDisplay] = useState('USD');
  const [profile, setProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    numeric_id?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  // Mock seed phrase - in a real app, this would be securely stored and retrieved
  const mockSeedPhrase = "point coffee twist knock deposit differ yard adjust battle reason million elite";
  
  useEffect(() => {
    // Immediately redirect if not authenticated and not loading
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { state: { from: location } });
      return;
    }
    
    // Only fetch profile if authenticated
    if (isAuthenticated && user) {
      const fetchUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone, numeric_id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching profile:', error);
          } else {
            setProfile(data);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, navigate]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const toggleCurrency = () => {
    const newCurrency = currencyDisplay === 'USD' ? 'KES' : 'USD';
    setCurrencyDisplay(newCurrency);
    toast({
      title: "Display currency changed",
      description: `Currency changed to ${newCurrency}`,
    });
  };

  // Format user's full name based on available profile data
  const getUserDisplayName = () => {
    if (!profile) return user?.email || 'User';
    
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) {
      return profile.first_name;
    }
    return user?.email || 'User';
  };
  
  const authFormSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
  });
  
  const authForm = useForm<z.infer<typeof authFormSchema>>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      password: "",
    },
  });
  
  const onAuthSubmit = async (data: z.infer<typeof authFormSchema>) => {
    // In a real app, verify password with Supabase or your auth provider
    try {
      // Mock authentication - in real app, verify with Supabase
      setTimeout(() => {
        setIsAuthDialogOpen(false);
        setShowSeedPhrase(true);
        
        toast({
          title: "Authentication successful",
          description: "You can now view your secure information.",
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Please check your password and try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewSecureInfo = () => {
    setIsAuthDialogOpen(true);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <MainLayout title="Settings">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-kash-green" />
        </div>
      </MainLayout>
    );
  }
  
  // If not authenticated, redirect immediately
  if (!isAuthenticated) {
    return (
      <MainLayout title="Settings">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 mb-4">You need to be logged in to view this page.</p>
          <p className="text-gray-400 text-sm">Redirecting to login...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        {/* Profile Section */}
        <KashCard>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-kash-green/10 flex items-center justify-center">
              <User size={24} className="text-kash-green" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold">{getUserDisplayName()}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {profile?.phone && (
                <p className="text-sm text-gray-500">{profile.phone}</p>
              )}
              {/* Only show User ID if it exists in the profile */}
              {profile?.numeric_id && (
                <div className="mt-2 flex items-center">
                  <p className="text-xs text-gray-500 mr-1">User ID: {profile.numeric_id}</p>
                  <button onClick={() => {
                    if (profile.numeric_id) {
                      navigator.clipboard.writeText(profile.numeric_id.toString());
                      toast({
                        title: "User ID copied",
                        description: "User ID has been copied to clipboard.",
                      });
                    }
                  }} className="text-kash-green hover:text-kash-green/80">
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </KashCard>
        
        {/* Security Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Security</h2>
          <KashCard className="divide-y divide-gray-100">
            <div className="py-3 px-1">
              <button className="w-full flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-800">Change Password</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="py-3 px-1">
              <button className="w-full flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-800">Enable 2FA</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </KashCard>
        </div>
        
        {/* Wallet Recovery Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Wallet Recovery</h2>
          <KashCard className="divide-y divide-gray-100">
            <div className="py-3 px-1">
              <button 
                className="w-full flex items-center justify-between"
                onClick={handleViewSecureInfo}
              >
                <div className="flex items-center">
                  <Lock size={18} className="mr-2 text-kash-green" />
                  <span className="text-gray-800">Wallet Seed Phrase</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
              
              {showSeedPhrase && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Seed Phrase</span>
                    <button 
                      onClick={() => setShowSeedPhrase(false)}
                      className="text-sm text-kash-green flex items-center"
                    >
                      <EyeOff size={16} className="mr-1" />
                      Hide
                    </button>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded text-sm font-mono">
                    {mockSeedPhrase}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This seed phrase gives access to all your individual wallet addresses. Never share it with anyone.
                  </p>
                </div>
              )}
            </div>
          </KashCard>
        </div>
        
        {/* KYC Verification */}
        <div>
          <h2 className="text-lg font-semibold mb-3">KYC Verification</h2>
          <KashCard>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Identity Verification</h3>
                <p className="text-sm text-gray-500 mt-1">Verify your identity to unlock all features</p>
              </div>
              <div className="flex items-center">
                <KashButton size="sm">Verify Now</KashButton>
              </div>
            </div>
          </KashCard>
        </div>
        
        {/* Preferences */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Preferences</h2>
          <KashCard className="divide-y divide-gray-100">
            <div className="py-3 px-1">
              <button 
                className="w-full flex items-center justify-between"
                onClick={toggleCurrency}
              >
                <span className="text-gray-800">Currency Display</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{currencyDisplay}</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </button>
            </div>
            <div className="py-3 px-1">
              <button className="w-full flex items-center justify-between">
                <span className="text-gray-800">Notifications</span>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </KashCard>
        </div>
        
        {/* Account Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Account Actions</h2>
          <KashCard className="divide-y divide-gray-100">
            <div className="py-3 px-1">
              <button 
                className="w-full flex items-center text-gray-800"
                onClick={handleLogout}
              >
                <LogOut size={18} className="mr-2" />
                <span>Log Out</span>
              </button>
            </div>
            <div className="py-3 px-1">
              <button className="w-full flex items-center text-kash-error">
                <Trash2 size={18} className="mr-2" />
                <span>Delete Account</span>
              </button>
            </div>
          </KashCard>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>App Version 1.0.0</p>
          <p className="mt-1">© 2023 Kash. All rights reserved.</p>
        </div>
      </div>
      
      {/* Authentication Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authenticate to Continue</DialogTitle>
            <DialogDescription>
              Please enter your password to view your secure information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...authForm}>
            <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-4">
              <FormField
                control={authForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <KashButton type="submit">
                  Authenticate
                </KashButton>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Settings;
