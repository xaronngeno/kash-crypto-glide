
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, DollarSign } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';
import { KashInput } from '@/components/ui/KashInput';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Buy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  
  // Fixed exchange rate for simplicity
  const exchangeRate = 0.0083; // 1 KES = 0.0083 USDT
  const minAmount = 500; // Minimum KES amount
  const maxAmount = 100000; // Maximum KES amount
  
  const usdtAmount = amount ? (Number(amount) * exchangeRate).toFixed(2) : '0.00';
  
  // Fetch the user's phone number from their profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching profile for user", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Could not retrieve your phone number",
            variant: "destructive"
          });
        } else if (data && data.phone) {
          console.log("Found user phone:", data.phone);
          setPhone(data.phone);
        } else {
          console.log("No phone found in profile, setting default");
          // Set a default number if none is found
          setPhone('+254712345678');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setFetchingProfile(false);
      }
    };
    
    fetchUserProfile();
  }, [user, toast]);
  
  const initiateSTKPush = async () => {
    if (!amount || Number(amount) < minAmount) {
      toast({
        title: "Invalid amount",
        description: `Amount must be at least ${minAmount} KES`,
        variant: "destructive"
      });
      return;
    }
    
    if (!phone) {
      toast({
        title: "Missing phone number",
        description: "Please enter a valid M-PESA phone number",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Format phone number (ensure it has the +254 format)
      let formattedPhone = phone.replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }
      
      console.log("Calling M-PESA STK push with:", {
        phone: formattedPhone,
        amount: Number(amount),
      });
      
      // Call the Supabase Edge Function to initiate the STK push
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone: formattedPhone,
          amount: Number(amount),
          reference: `Kash-${user?.id?.substring(0, 8) || 'Guest'}`,
          description: `Buy ${usdtAmount} USDT on Kash`,
        },
      });
      
      console.log("M-PESA STK push response:", data);
      
      if (error) {
        console.error("Supabase function error:", error);
        toast({
          title: "Payment failed",
          description: error.message || "Failed to initiate M-PESA payment. Please check your credentials and try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.errorCode) {
        console.error("M-PESA error:", data);
        toast({
          title: "M-PESA error",
          description: data.errorMessage || "An error occurred with the M-PESA transaction.",
          variant: "destructive"
        });
        return;
      }
      
      // Show success message
      toast({
        title: "Payment initiated",
        description: "Please check your phone and enter M-PESA PIN to complete the purchase.",
      });
      
      // Navigate to transaction confirmation page
      navigate('/transaction-confirmation', { 
        state: { 
          type: 'buy',
          asset: 'USDT',
          amountKES: Number(amount),
          amountUSDT: Number(usdtAmount),
          phone: formattedPhone,
          checkoutRequestID: data?.CheckoutRequestID || 'pending'
        } 
      });
    } catch (error) {
      console.error('STK push error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Could not initiate M-PESA payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Buy Crypto" showBack>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-1">Buy USDT with M-PESA</h2>
          <p className="text-gray-600">
            Purchase USDT on the Tron blockchain
          </p>
        </div>
        
        <KashCard>
          <div className="space-y-5">
            {/* Phone Number (from user profile) */}
            <KashInput
              label="M-PESA Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={18} className="text-gray-400" />}
              placeholder={fetchingProfile ? "Loading..." : "Enter your M-PESA number"}
              disabled={fetchingProfile}
            />
            
            {/* Amount in KES */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Amount (KES)
                </label>
                <span className="text-xs text-gray-500">
                  Min: {minAmount} KES | Max: {maxAmount} KES
                </span>
              </div>
              <KashInput
                type="number"
                placeholder="Enter amount in KES"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                icon={<DollarSign size={18} className="text-gray-400" />}
              />
            </div>
            
            {/* Conversion Preview */}
            <div className="bg-kash-lightGray p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You will receive</span>
                <span className="text-xl font-semibold">{usdtAmount} USDT</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Exchange Rate: 1 KES = {exchangeRate} USDT
              </div>
            </div>
            
            <KashButton
              fullWidth
              disabled={!amount || Number(amount) < minAmount || loading || fetchingProfile}
              onClick={initiateSTKPush}
            >
              {loading ? 'Processing...' : 'Continue to M-PESA'}
            </KashButton>
          </div>
        </KashCard>
        
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">How it works</h3>
          <div className="space-y-3">
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                1
              </div>
              <p className="text-sm text-gray-600">Enter the amount you want to buy in KES</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                2
              </div>
              <p className="text-sm text-gray-600">You'll receive an M-PESA prompt on your phone</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                3
              </div>
              <p className="text-sm text-gray-600">Complete the payment by entering your M-PESA PIN</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 rounded-full bg-kash-green/10 text-kash-green flex items-center justify-center mr-3 flex-shrink-0">
                4
              </div>
              <p className="text-sm text-gray-600">USDT will be credited to your Kash wallet immediately</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <h4 className="font-medium text-amber-700 mb-1">Note</h4>
          <p className="text-sm text-amber-700">
            After purchasing USDT, you can swap it for any other supported cryptocurrency in the app.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Buy;
