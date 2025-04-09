
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { KashButton } from '@/components/ui/KashButton';
import { KashCard } from '@/components/ui/KashCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminAssignIds = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Check if the current user has admin access (email ending with @kash.africa)
  const isAdmin = user?.email?.endsWith('@kash.africa') || false;
  
  const handleAssignIds = async () => {
    if (!isAdmin || !session) {
      toast({
        title: "Access denied",
        description: "You don't have permission to perform this action",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the assign-user-ids edge function
      const { data, error } = await supabase.functions.invoke('assign-user-ids', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      
      if (error) throw error;
      
      setResults(data);
      
      toast({
        title: "IDs assigned",
        description: data.message,
      });
    } catch (error) {
      console.error('Error assigning IDs:', error);
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign user IDs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Redirect non-admins to dashboard
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Admin: Assign User IDs</h1>
      
      <KashCard className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Assign IDs to Existing Users</h2>
          <p className="mb-4 text-gray-600">
            This will generate a unique 8-digit numeric ID for all existing users who don't have one.
          </p>
          
          <KashButton 
            onClick={handleAssignIds} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Assign IDs to All Users'}
          </KashButton>
        </div>
      </KashCard>
      
      {results && (
        <KashCard>
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Results</h2>
            <p className="mb-4 font-medium">{results.message}</p>
            
            <div className="border rounded divide-y">
              {results.results?.map((result: any, index: number) => (
                <div key={index} className="p-3 flex justify-between items-center">
                  <div className="truncate flex-1">
                    <span className="font-mono text-sm">{result.id}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {result.status === 'assigned' ? (
                      <>
                        <span className="text-green-600 font-medium">Assigned</span>
                        <span className="font-mono font-bold">{result.numeric_id}</span>
                      </>
                    ) : (
                      <span className="text-red-600 font-medium">Failed: {result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </KashCard>
      )}
    </div>
  );
};

export default AdminAssignIds;
