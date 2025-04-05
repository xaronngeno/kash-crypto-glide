
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Increase timeout to give more time to see the splash screen
    const timer = setTimeout(() => {
      navigate('/signin');
    }, 5000); // Changed from 2000ms to 5000ms (5 seconds)

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
        <p className="text-gray-500 text-sm mt-4">Redirecting to sign in...</p>
      </div>
    </div>
  );
};

export default Index;
