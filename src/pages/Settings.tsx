
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, CreditCard, LogOut, Trash2, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [currencyDisplay, setCurrencyDisplay] = useState('USD');
  const [profile, setProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single();
        
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
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/signin');
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
    </MainLayout>
  );
};

export default Settings;
