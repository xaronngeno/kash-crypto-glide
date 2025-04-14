import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Receive from "./pages/Receive";
import Send from "./pages/Send";
import Buy from "./pages/Buy";
import TransactionHistory from "./pages/History";
import Settings from "./pages/Settings";
import TransactionConfirmation from "./pages/TransactionConfirmation";
import SwapCrypto from "./pages/SwapCrypto";
import SearchCrypto from "./pages/SearchCrypto";
import SellUsdt from "./pages/SellUsdt";
import CoinDetail from "./pages/CoinDetail";
import AdminAssignIds from "./pages/AdminAssignIds";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";

// Initialize the query client outside of the component
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Auth verification callback route */}
              <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
              
              {/* User app routes */}
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
              <Route path="/mpesa" element={
                <ProtectedRoute>
                  <SellUsdt />
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
              <Route path="/coin/:coinId" element={
                <ProtectedRoute>
                  <CoinDetail />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <TransactionHistory />
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
              
              {/* Admin routes with AdminRoute protection */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } />
              <Route path="/admin/assign-ids" element={
                <AdminRoute>
                  <AdminAssignIds />
                </AdminRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
