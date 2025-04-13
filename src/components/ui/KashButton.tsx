
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface KashButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const KashButton = forwardRef<HTMLButtonElement, KashButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', fullWidth = false, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative rounded-lg font-medium transition-colors flex items-center justify-center',
          {
            'bg-kash-green text-white hover:bg-kash-green/90': variant === 'primary',
            'border border-kash-green text-kash-green hover:bg-kash-lightGray': variant === 'outline',
            'text-kash-green hover:bg-kash-lightGray': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive', // Added destructive variant
            'bg-gray-200 text-gray-700 hover:bg-gray-300': variant === 'default', // Added default variant
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
)

KashButton.displayName = 'KashButton';

export { KashButton };
