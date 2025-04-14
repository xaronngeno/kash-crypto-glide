
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavIconButtonProps {
  icon: LucideIcon | React.FC<{ size?: number; className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavIconButton = ({ icon: Icon, label, path, isActive, onClick }: NavIconButtonProps) => {
  const className = cn(
    "flex flex-col items-center px-3 py-2 rounded-lg transition-colors",
    isActive ? "text-kash-green" : "text-gray-500 hover:bg-kash-lightGray"
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        <Icon size={20} />
        <span className="text-xs mt-1">{label}</span>
      </button>
    );
  }

  return (
    <Link to={path} className={className}>
      <Icon size={20} />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default NavIconButton;
