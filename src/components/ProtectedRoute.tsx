
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <Loader2 className="h-12 w-12 animate-spin text-kash-green mb-4" />
        <p className="text-gray-500">Verifying your account...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // When redirecting to auth, store the current location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
