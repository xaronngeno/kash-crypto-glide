
import { ArrowLeft, Bell, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  rightAction?: React.ReactNode;
}

const AppHeader = ({ 
  title, 
  showBack = false, 
  showNotification = false,
  rightAction
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show back button on main screens
  const isMainScreen = ['/dashboard', '/history', '/buy', '/send', '/settings'].includes(location.pathname);
  const shouldShowBack = showBack && !isMainScreen;

  return (
    <header className="p-4 flex items-center justify-between border-b border-gray-100">
      <div className="flex items-center">
        {shouldShowBack && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-1.5 rounded-full hover:bg-kash-lightGray"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {title && <h1 className="font-semibold text-lg">{title}</h1>}
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/search')}
          className="p-1.5 rounded-full hover:bg-kash-lightGray"
        >
          <Search size={20} />
        </button>
        {showNotification && (
          <button className="p-1.5 rounded-full hover:bg-kash-lightGray">
            <Bell size={20} />
          </button>
        )}
        {rightAction}
      </div>
    </header>
  );
};

export default AppHeader;
