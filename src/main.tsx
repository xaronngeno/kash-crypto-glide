
// Import polyfills first and make sure they're applied before any other imports
import './utils/globalPolyfills';

// Add a small delay to ensure polyfills are fully loaded
const initApp = () => {
  // Continue with the rest of the imports
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App.tsx';
  import './index.css';
  import { Toaster } from '@/components/ui/toaster';
  import { BrowserRouter } from 'react-router-dom';

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </React.StrictMode>,
  )
};

// Give a small delay to ensure Buffer is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initApp, 50));
} else {
  setTimeout(initApp, 50);
}
