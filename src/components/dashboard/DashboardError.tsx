
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DashboardErrorProps {
  error: string | null;
}

export const DashboardError = ({ error }: DashboardErrorProps) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {typeof error === 'string' ? error : 'Failed to load wallet data. Please try again later.'}
      </AlertDescription>
    </Alert>
  );
};
