
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Clock, Settings } from 'lucide-react';
import NavIconButton from './NavIconButton';
import MPesaIcon from '../icons/MPesaIcon';

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
        <NavIconButton
          key={item.path}
          icon={item.icon}
          label={item.label}
          path={item.path}
          isActive={
            item.path === "/" 
              ? location.pathname === "/" || location.pathname === "/dashboard"
              : location.pathname === item.path
          }
          onClick={item.path === "/" ? () => handleNavClick(item.path) : undefined}
        />
      ))}
    </div>
  );
};

export default BottomNav;
