
import MainLayout from '@/components/layout/MainLayout';

export const LoadingState = () => {
  return (
    <MainLayout title="Portfolio">
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kash-green mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your portfolio...</p>
        </div>
      </div>
    </MainLayout>
  );
};
