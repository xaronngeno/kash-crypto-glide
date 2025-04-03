
import { cn } from '@/lib/utils';

interface KashCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const KashCard = ({ 
  className, 
  children, 
  variant = 'default', 
  padding = 'md', 
  ...props 
}: KashCardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl bg-white',
        {
          'shadow-sm': variant === 'default',
          'border border-gray-200': variant === 'outline',
          'p-3': padding === 'sm',
          'p-5': padding === 'md',
          'p-7': padding === 'lg',
          'p-0': padding === 'none',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { KashCard };
