
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Receive from "./pages/Receive";
import Send from "./pages/Send";
import Buy from "./pages/Buy";
import History from "./pages/History";
import Settings from "./pages/Settings";
import TransactionConfirmation from "./pages/TransactionConfirmation";
import SwapCrypto from "./pages/SwapCrypto";
import SearchCrypto from "./pages/SearchCrypto";
import SellUsdt from "./pages/SellUsdt";

// Create a client
const queryClient = new QueryClient();

// Define the App component as a function component
const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/receive" element={
                <ProtectedRoute>
                  <Receive />
                </ProtectedRoute>
              } />
              <Route path="/send" element={
                <ProtectedRoute>
                  <Send />
                </ProtectedRoute>
              } />
              <Route path="/buy" element={
                <ProtectedRoute>
                  <Buy />
                </ProtectedRoute>
              } />
              <Route path="/swap" element={
                <ProtectedRoute>
                  <SwapCrypto />
                </ProtectedRoute>
              } />
              <Route path="/sell-usdt" element={
                <ProtectedRoute>
                  <SellUsdt />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchCrypto />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/transaction-confirmation" element={
                <ProtectedRoute>
                  <TransactionConfirmation />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
