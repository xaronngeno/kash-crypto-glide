
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { KashButton } from '@/components/ui/KashButton';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const handleBack = () => {
    navigate('/admin');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="px-4 py-4 mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={handleBack}
              className="p-2 mr-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Admin Portal - {title}
            </h1>
          </div>
          <KashButton 
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </KashButton>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
