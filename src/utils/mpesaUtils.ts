
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Validate phone number (simple validation for Kenyan numbers)
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  return /^(?:\+254|0)[17]\d{8}$/.test(phoneNumber);
};

// Format phone number for the API
export const formatPhoneNumber = (phoneNumber: string): string => {
  let formattedPhone = phoneNumber.replace(/\s+/g, '');
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }
  return formattedPhone;
};

// Initiate M-PESA STK push
export const initiateMpesaPayment = async (
  phone: string, 
  amount: number,
  userId: string | undefined,
  assetAmount: string,
  assetSymbol: string
) => {
  console.log("Calling M-PESA STK push with:", {
    phone,
    amount,
  });
  
  return await supabase.functions.invoke('mpesa-stk-push', {
    body: {
      phone,
      amount: Number(amount),
      reference: `Kash-${userId?.substring(0, 8) || 'Guest'}`,
      description: `Buy ${assetAmount} ${assetSymbol} on Kash`,
    },
  });
};

// Navigate to transaction confirmation
export const navigateToConfirmation = (
  navigate: ReturnType<typeof useNavigate>,
  type: 'buy' | 'sell',
  data: Record<string, any>
) => {
  navigate('/transaction-confirmation', { state: { type, ...data } });
};
