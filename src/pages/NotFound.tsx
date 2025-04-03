
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { KashButton } from "@/components/ui/KashButton";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-kash-green">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Page not found</p>
        <KashButton onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </KashButton>
      </div>
    </div>
  );
};

export default NotFound;
