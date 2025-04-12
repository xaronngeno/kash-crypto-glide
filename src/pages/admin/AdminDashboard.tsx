
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/components/AuthProvider';
import { KashCard } from '@/components/ui/KashCard';
import { Users, IdCard, Settings, Database } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has admin access (email ending with @kash.africa)
  const isAdmin = user?.email?.endsWith('@kash.africa') || false;
  
  // If not admin, redirect to main app
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }
  
  const adminModules = [
    {
      title: "User Management",
      description: "Manage users, roles and permissions",
      icon: Users,
      path: "/admin/users"
    },
    {
      title: "User IDs",
      description: "Assign and manage unique user IDs",
      icon: IdCard,
      path: "/admin/assign-ids"
    },
    {
      title: "System Settings",
      description: "Configure system settings and parameters",
      icon: Settings,
      path: "/admin/settings"
    },
    {
      title: "Database Tools",
      description: "Database maintenance and operations",
      icon: Database,
      path: "/admin/database"
    }
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module) => (
          <KashCard 
            key={module.title} 
            className="hover:shadow-md cursor-pointer transition-all"
            onClick={() => navigate(module.path)}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-kash-lightGray p-3 rounded-full mr-4">
                  <module.icon className="h-6 w-6 text-kash-green" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{module.title}</h3>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
              </div>
            </div>
          </KashCard>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
