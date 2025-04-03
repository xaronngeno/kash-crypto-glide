
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to sign in after a brief splash screen
    const timer = setTimeout(() => {
      navigate('/signin');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-kash-green/10 flex items-center justify-center mx-auto mb-6">
          <Wallet size={40} className="text-kash-green" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Kash</h1>
        <p className="text-gray-600 text-lg">Your minimalist crypto wallet</p>
      </div>
    </div>
  );
};

export default Index;
