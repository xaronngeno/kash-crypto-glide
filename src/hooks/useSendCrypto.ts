
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useWallets } from '@/hooks/useWallets';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { validateAddressForNetwork, detectNetworkFromAddress } from '@/utils/addressValidator';
import { Token, getCurrencyLogo, getNetworksForCurrency, calculateFee } from '@/utils/tokenUtils';

export enum SendStep {
  SELECT_COIN = 'select_coin',
  SELECT_NETWORK = 'select_network',
  ENTER_DETAILS = 'enter_details'
}

export const useSendCrypto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prices } = useCryptoPrices();
  const { assets } = useWallets({ prices });
  
  const [currentStep, setCurrentStep] = useState<SendStep>(SendStep.SELECT_COIN);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  
  useEffect(() => {
    if (assets.length > 0) {
      const tokens: Token[] = assets.map(asset => {
        const networks = getNetworksForCurrency(asset.symbol);
        
        if (asset.symbol === 'SOL' && !networks.includes('Solana')) {
          networks.push('Solana');
        }
        
        if (asset.symbol === 'USDT' && 
            assets.some(a => a.symbol === 'SOL') && 
            !networks.includes('Solana')) {
          networks.push('Solana');
        }
        
        return {
          id: asset.symbol,
          name: asset.name || asset.symbol,
          symbol: asset.symbol,
          icon: asset.symbol[0],
          decimals: 8,
          networks,
          balance: asset.amount,
          value: asset.value,
          logo: getCurrencyLogo(asset.symbol)
        };
      });
      
      setAvailableTokens(tokens);
    }
  }, [assets]);
  
  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setSelectedNetwork(null);
    setCurrentStep(SendStep.SELECT_NETWORK);
  };
  
  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    setCurrentStep(SendStep.ENTER_DETAILS);
  };
  
  const resetFlow = () => {
    setCurrentStep(SendStep.SELECT_COIN);
    setSelectedToken(null);
    setSelectedNetwork(null);
  };
  
  const validateAddress = (address: string) => {
    if (!selectedNetwork) {
      return { isValid: false, detectedNetwork: null, errorMessage: "No network selected" };
    }
    
    const isValid = validateAddressForNetwork(address, selectedNetwork);
    
    if (!isValid) {
      const detectedNetwork = detectNetworkFromAddress(address);
      
      if (detectedNetwork) {
        return { 
          isValid: false, 
          detectedNetwork, 
          errorMessage: `This appears to be a ${detectedNetwork} address, not a ${selectedNetwork} address.`
        };
      } else {
        return { 
          isValid: false, 
          detectedNetwork: null, 
          errorMessage: `This doesn't appear to be a valid ${selectedNetwork} address.`
        };
      }
    }
    
    return { isValid: true, detectedNetwork: null, errorMessage: null };
  };
  
  const handleContinue = (amount: string, recipient: string, memo: string) => {
    if (!selectedToken || !selectedNetwork) return;
    
    const isValidAddress = validateAddressForNetwork(recipient, selectedNetwork);
    
    if (!isValidAddress) {
      toast({
        title: "Invalid Address",
        description: `The address you entered doesn't match the ${selectedNetwork} network format.`,
        variant: "destructive"
      });
      return;
    }
    
    const fee = calculateFee(selectedToken.symbol, selectedNetwork);
    
    navigate('/transaction-confirmation', { 
      state: { 
        type: 'send',
        asset: {
          ...selectedToken,
          blockchain: selectedNetwork
        },
        amount: parseFloat(amount),
        recipient,
        fee,
        memo,
        network: selectedNetwork
      } 
    });
  };

  return {
    currentStep,
    availableTokens,
    selectedToken,
    selectedNetwork,
    handleTokenSelect,
    handleNetworkSelect,
    resetFlow,
    validateAddress,
    handleContinue
  };
};
