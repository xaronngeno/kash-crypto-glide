
import { useEffect, useRef } from 'react';

interface PullToRefreshProps {
  onRefresh: () => void;
  pullToRefreshActive: boolean;
  setPullToRefreshActive: (active: boolean) => void;
  refreshing: boolean;
}

export const PullToRefresh = ({
  onRefresh,
  pullToRefreshActive,
  setPullToRefreshActive,
  refreshing
}: PullToRefreshProps) => {
  const pullStartY = useRef(0);

  useEffect(() => {
    const content = document.documentElement;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - pullStartY.current;
      
      if (window.scrollY === 0 && pullDistance > 50 && !refreshing) {
        setPullToRefreshActive(true);
      }
    };

    const handleTouchEnd = () => {
      if (pullToRefreshActive && !refreshing) {
        onRefresh();
      }
      setPullToRefreshActive(false);
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove);
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullToRefreshActive, refreshing, onRefresh, setPullToRefreshActive]);

  if (!pullToRefreshActive) return null;

  return (
    <div className="flex justify-center py-2 text-kash-green">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kash-green"></div>
      <span className="ml-2">Release to refresh</span>
    </div>
  );
};
