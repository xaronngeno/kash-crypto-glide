
import { cn } from '@/lib/utils';

interface MPesaIconProps {
  size?: number;
  className?: string;
}

const MPesaIcon = ({ size = 20, className = '' }: MPesaIconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={cn('text-gray-500', className)}
  >
    <path 
      d="M12 3L1 21h22L12 3z" 
      fill="currentColor"
    />
  </svg>
);

export default MPesaIcon;
