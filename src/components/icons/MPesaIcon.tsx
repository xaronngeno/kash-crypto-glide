
import { cn } from '@/lib/utils';

interface MPesaIconProps {
  size?: number;
  className?: string;
}

const MPesaIcon = ({ size = 20, className = '' }: MPesaIconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 50 50" 
    width={size} 
    height={size} 
    className={cn('text-gray-500', className)}
  >
    <path 
      d="M25 5C14.511 5 6 13.511 6 24s8.511 19 19 19 19-8.511 19-19S35.489 5 25 5zm0 2c9.389 0 17 7.611 17 17s-7.611 17-17 17S8 33.389 8 24 15.611 7 25 7zm-7 6c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V15c0-1.103-.897-2-2-2H18zm0 2h14v10H18V15zm7 1c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 2c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1z" 
      fill="currentColor"
    />
  </svg>
);

export default MPesaIcon;
