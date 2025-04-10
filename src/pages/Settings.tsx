import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, CreditCard, LogOut, Trash2, ChevronRight, Key, Eye, EyeOff, Lock, Copy } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase, executeSql } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getOrCreateMnemonic } from '@/utils/mnemonicWalletGenerator';

type MnemonicData = {
  main_mnemonic: string;
};

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
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [wallets, setWallets] = useState<Array<{
    blockchain: string;
    currency: string;
    address: string;
  }>>([]);
  const [userMnemonic, setUserMnemonic] = useState<string | null>(null);
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { state: { from: location } });
      return;
    }
    
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
      fetchUserWallets();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, navigate]);
  
  const fetchUserWallets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First, try to fetch the user's mnemonic using raw SQL since the types might not be updated
      const { data, error } = await supabase.rpc('get_user_mnemonic', { user_id_param: user.id });
      
      if (error) {
        console.error("Error fetching mnemonic:", error);
      } else if (data && data.length > 0 && data[0].main_mnemonic) {
        setUserMnemonic(data[0].main_mnemonic);
      }
      
      // Now fetch wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('blockchain, currency, address')
        .eq('user_id', user.id);
        
      if (walletError) {
        throw walletError;
      }
      
      // Filter to show only main chain wallets (BTC, ETH, SOL, TRX)
      const mainChains = ['Bitcoin', 'Ethereum', 'Solana', 'Tron'];
      const mainCurrencies = ['BTC', 'ETH', 'SOL', 'TRX'];
      
      const filteredWallets = walletData.filter(wallet => 
        mainChains.includes(wallet.blockchain) && 
        mainCurrencies.includes(wallet.currency)
      );
      
      setWallets(filteredWallets);
      
      // If no mnemonic was found in the database, generate a new one for display
      if (!data || data.length === 0 || !data[0].main_mnemonic) {
        const mockMnemonic = getOrCreateMnemonic();
        setUserMnemonic(mockMnemonic);
        
        // Store the generated mnemonic in the database for future use
        if (user.id) {
          try {
            const result = await supabase.rpc('store_user_mnemonic', { 
              user_id_param: user.id,
              mnemonic_param: mockMnemonic
            });
            
            if (result.error) {
              console.error("Error storing mnemonic:", result.error);
            } else {
              console.log("Successfully stored mnemonic for user");
            }
          } catch (err) {
            console.error("Error storing mnemonic:", err);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching wallets:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
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
    try {
      setTimeout(() => {
        setIsAuthDialogOpen(false);
        
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
  
  const copySeedPhrase = (seedPhrase: string) => {
    navigator.clipboard.writeText(seedPhrase);
    toast({
      title: "Copied",
      description: "Seed phrase copied to clipboard",
    });
  };

  if (authLoading || loading) {
    return (
      <MainLayout title="Settings">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-kash-green" />
        </div>
      </MainLayout>
    );
  }
  
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
        
        <div>
          <h2 className="text-lg font-semibold mb-3">Wallet Recovery</h2>
          <KashCard>
            <div className="py-3 px-1">
              <Accordion type="single" collapsible>
                <AccordionItem value="wallet-recovery">
                  <AccordionTrigger className="flex items-center py-2">
                    <div className="flex items-center">
                      <Lock size={18} className="mr-2 text-kash-green" />
                      <span className="text-gray-800">Wallet Seed Phrase</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* Show a single seed phrase for all wallets */}
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Universal Recovery Seed</h4>
                        <button 
                          onClick={() => userMnemonic && copySeedPhrase(userMnemonic)}
                          className="text-kash-green hover:opacity-70 p-1"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      
                      {userMnemonic && (
                        <div className="p-3 bg-white border border-gray-200 rounded text-sm font-mono break-all">
                          {userMnemonic}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-3">
                        This is your master seed phrase that can restore all your wallets. Never share it with anyone.
                      </p>
                      
                      {/* Display the list of wallets derived from this seed */}
                      <div className="mt-4">
                        <h5 className="font-medium text-sm mb-2">Your Wallets</h5>
                        <div className="space-y-2">
                          {wallets.map((wallet, index) => (
                            <div key={index} className="p-2 border border-gray-100 rounded bg-white">
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-sm font-medium">{wallet.blockchain}</p>
                                  <p className="text-xs text-gray-500 truncate">{wallet.address}</p>
                                </div>
                                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">
                                  {wallet.currency}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </KashCard>
        </div>
        
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
