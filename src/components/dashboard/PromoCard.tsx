
import { KashCard } from '@/components/ui/KashCard';
import { KashButton } from '@/components/ui/KashButton';

export const PromoCard = () => {
  return (
    <KashCard className="mt-6 bg-gradient-to-br from-kash-green/10 to-kash-green/5 border-none">
      <div className="text-center p-4">
        <h3 className="font-semibold text-lg mb-2">Coming Soon - Digital Credit Card</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create Your Digital Credit Card. This feature is coming soon! Stay tuned for updates.
        </p>
        <KashButton>Get Notified</KashButton>
      </div>
    </KashCard>
  );
};
