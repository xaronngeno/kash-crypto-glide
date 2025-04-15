
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, X, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

const FloatingTradeButton = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleBuy = () => {
    navigate('/buy');
    setIsOpen(false);
  };

  const handleSell = () => {
    navigate('/sell-usdt');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
      <TooltipProvider>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <button className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg border border-gray-200">
              <ArrowUpDown className="h-6 w-6 text-gray-700" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-xl bg-gray-900 text-white border-t-0 px-0">
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8">
              <DrawerClose asChild>
                <button className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                  <X className="h-6 w-6 text-white" />
                </button>
              </DrawerClose>
            </div>
            <div className="pt-16 pb-10 px-6">
              <div className="space-y-4">
                <div 
                  onClick={handleBuy}
                  className="flex items-center gap-3 p-4 hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ArrowDown className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-xl font-medium">Buy USDT</span>
                </div>
                
                <div 
                  onClick={handleSell}
                  className="flex items-center gap-3 p-4 hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ArrowUp className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-xl font-medium">Sell USDT</span>
                </div>
              </div>
              
              <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
                Convert USDT to M-PESA or M-PESA to USDT
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="sr-only">Trade USDT</span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="px-2 py-1">Trade USDT</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default FloatingTradeButton;
