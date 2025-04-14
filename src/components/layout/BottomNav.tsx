
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MPesaIcon = ({ size = 20, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 50 50" 
    width={size} 
    height={size} 
    className={cn('text-gray-500', className)}
  >
    <path 
      d="M25 5C14.511 5 6 13.511 6 24s8.511 19 19 19 19-8.511 19-19S35.489 5 25 5zm0 2c9.389 0 17 7.611 17 17s-7.611 17-17 17S8 33.389 8 24 15.611 7 25 7zm-7 6c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V15c0-1.103-.897-2-2-2H18zm0 2h14v10H18V15zm7 1c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 2c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1z" 
      fill="currentColor"
    />
  </svg>
);

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: MPesaIcon, label: "M-PESA", path: "/mpesa" },
    { icon: Clock, label: "History", path: "/history" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleNavClick = (path: string) => {
    if (path === "/") {
      // For home navigation, add state to indicate it's from bottom nav
      navigate(path, { state: { fromBottomNav: true } });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white flex justify-around py-2 z-50">
      {navItems.map((item) => (
        item.path === "/" ? (
          <button 
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            className={cn(
              "flex flex-col items-center px-3 py-2 rounded-lg transition-colors",
              location.pathname === item.path || location.pathname === "/dashboard"
                ? "text-kash-green"
                : "text-gray-500 hover:bg-kash-lightGray"
            )}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ) : (
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
        )
      ))}
    </div>
  );
};

export default BottomNav;
