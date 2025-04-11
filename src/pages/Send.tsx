
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { SendStep, useSendCrypto } from '@/hooks/useSendCrypto';
import SelectCoin from '@/components/send/SelectCoin';
import SelectNetwork from '@/components/send/SelectNetwork';
import EnterDetails from '@/components/send/EnterDetails';

const Send = () => {
  const { 
    currentStep,
    availableTokens,
    selectedToken,
    selectedNetwork,
    handleTokenSelect,
    handleNetworkSelect,
    resetFlow,
    validateAddress,
    handleContinue
  } = useSendCrypto();

  return (
    <MainLayout title="Send" showBack>
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-1">Send Crypto</h2>
          {currentStep === SendStep.SELECT_COIN && (
            <p className="text-gray-600">Select a cryptocurrency to send</p>
          )}
          {currentStep === SendStep.SELECT_NETWORK && (
            <p className="text-gray-600">Select network for {selectedToken?.symbol}</p>
          )}
          {currentStep === SendStep.ENTER_DETAILS && (
            <p className="text-gray-600">
              Enter recipient and amount
            </p>
          )}
        </div>

        {currentStep === SendStep.SELECT_COIN && (
          <SelectCoin 
            availableTokens={availableTokens}
            onSelectToken={handleTokenSelect}
          />
        )}

        {currentStep === SendStep.SELECT_NETWORK && selectedToken && (
          <SelectNetwork
            selectedToken={selectedToken}
            onNetworkSelect={handleNetworkSelect}
            onBack={resetFlow}
          />
        )}

        {currentStep === SendStep.ENTER_DETAILS && selectedToken && selectedNetwork && (
          <EnterDetails
            selectedToken={selectedToken}
            selectedNetwork={selectedNetwork}
            onBack={() => handleNetworkSelect(selectedNetwork)}
            onContinue={(amount, recipient, memo) => handleContinue(amount, recipient, memo)}
            validateAddress={validateAddress}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Send;
