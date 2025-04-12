
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { KashButton } from '@/components/ui/KashButton';
import { KashCard } from '@/components/ui/KashCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layout/AdminLayout';

const AdminAssignIds = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const handleAssignIds = async () => {
    if (!session) {
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
  
  return (
    <AdminLayout title="Assign User IDs">
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
    </AdminLayout>
  );
};

export default AdminAssignIds;
