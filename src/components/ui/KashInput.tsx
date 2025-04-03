
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface KashInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const KashInput = forwardRef<HTMLInputElement, KashInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-kash-green/20 focus:border-kash-green transition-colors',
              {
                'pl-10': icon,
                'border-kash-error focus:ring-kash-error/20 focus:border-kash-error': error,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-kash-error">{error}</p>}
      </div>
    );
  }
);

KashInput.displayName = 'KashInput';

export { KashInput };
