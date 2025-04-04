
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';

// Import polyfills
import './utils/globalPolyfills';

// Wait for polyfills to be initialized before rendering
const initApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </React.StrictMode>,
  );
};

// Give a small delay to ensure Buffer is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initApp, 100));
} else {
  setTimeout(initApp, 100);
}
