
import React, { useState } from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

const Image: React.FC<ImageProps> = ({ src, alt, className, fallback, ...props }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        {alt?.[0] || '?'}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={handleError} {...props} />;
};

export default Image;
