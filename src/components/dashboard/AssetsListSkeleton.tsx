
import { memo } from 'react';
import { KashCard } from '@/components/ui/KashCard';
import { Skeleton } from '@/components/ui/skeleton';

const AssetsListSkeleton = () => {
  // Create an array of 4 items for skeleton placeholders
  const placeholders = Array(4).fill(0);
  
  return (
    <div className="space-y-3">
      {placeholders.map((_, index) => (
        <KashCard key={index} className="hover:bg-kash-lightGray transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-20 ml-auto" />
              <Skeleton className="h-4 w-12 mt-1 ml-auto" />
            </div>
          </div>
        </KashCard>
      ))}
    </div>
  );
};

export { AssetsListSkeleton };
