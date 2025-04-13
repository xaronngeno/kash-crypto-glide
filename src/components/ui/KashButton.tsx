
import React from 'react';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KashButtonProps extends ButtonProps {
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const KashButton = React.forwardRef<HTMLButtonElement, KashButtonProps>(
  ({ className, children, variant, size, loading, disabled, fullWidth, icon, ...props }, ref) => {
    return (
      <Button
        className={cn(
          fullWidth && "w-full",
          className
        )}
        variant={variant}
        size={size}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
    );
  }
);

KashButton.displayName = 'KashButton';
