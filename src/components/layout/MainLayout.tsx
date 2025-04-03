
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import AppHeader from './AppHeader';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  rightAction?: React.ReactNode;
  hideBottomNav?: boolean;
}

const MainLayout = ({ 
  children, 
  title, 
  showBack,
  showNotification = true,
  rightAction,
  hideBottomNav = false
}: MainLayoutProps) => {
  const location = useLocation();
  
  // Don't show bottom nav on auth screens
  const isAuthScreen = ['/signin', '/signup'].includes(location.pathname);
  const showNav = !isAuthScreen && !hideBottomNav;

  return (
    <div className="flex flex-col h-screen bg-white">
      <AppHeader 
        title={title} 
        showBack={showBack} 
        showNotification={showNotification}
        rightAction={rightAction}
      />
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="container mx-auto max-w-lg px-4 py-4">
          {children}
        </div>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default MainLayout;
