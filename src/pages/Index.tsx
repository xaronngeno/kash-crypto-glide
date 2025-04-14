
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const fromNavigation = useRef(false);

  // Check if there's state from navigation indicating it's from bottom nav
  useEffect(() => {
    if (location.state && location.state.fromBottomNav) {
      fromNavigation.current = true;
    }
  }, [location]);

  useEffect(() => {
    // If already loading auth state, wait for it
    if (loading) return;
    
    // If coming from bottom nav and authenticated, redirect immediately
    if (fromNavigation.current && isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Always redirect to auth page by default
    const timer = setTimeout(() => {
      // Only redirect to dashboard if actually authenticated
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }, 2000); // 2 second splash screen

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, loading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-kash-green/10 flex items-center justify-center mx-auto mb-6">
          <Wallet size={40} className="text-kash-green" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Kash</h1>
        <p className="text-gray-600 text-lg">Your minimalist crypto wallet</p>
        <p className="text-gray-500 text-sm mt-4">
          {loading ? "Checking your session..." : 
           isAuthenticated ? "Redirecting to dashboard..." : 
           "Redirecting to sign in..."}
        </p>
      </div>
    </div>
  );
};

export default Index;
