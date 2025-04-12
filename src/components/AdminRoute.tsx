
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Check if the user is an admin (email ends with @kash.africa)
  const isAdmin = user?.email?.endsWith('@kash.africa') || false;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <Loader2 className="h-12 w-12 animate-spin text-kash-green mb-4" />
        <p className="text-gray-500">Verifying admin access...</p>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
