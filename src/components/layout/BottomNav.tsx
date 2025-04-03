
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wallet, BarChart3, Settings, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { icon: Wallet, label: "Wallet", path: "/dashboard" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: BarChart3, label: "Activity", path: "/history" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white flex justify-around py-2 z-50">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          to={item.path}
          className={cn(
            "flex flex-col items-center px-3 py-2 rounded-lg transition-colors",
            location.pathname === item.path 
              ? "text-kash-green"
              : "text-gray-500 hover:bg-kash-lightGray"
          )}
        >
          <item.icon size={20} />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default BottomNav;
