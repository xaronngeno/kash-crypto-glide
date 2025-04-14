
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
    {/* Two triangles with a twisted combination */}
    <path
      d="M6 4L12 12L6 20L6 4Z M18 4L12 12L18 20L18 4Z"
      fill="currentColor"
    />
  </svg>
);

export default MPesaIcon;
