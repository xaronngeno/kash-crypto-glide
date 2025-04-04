
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import polyfills first - before any other code
// This needs to be imported and initialized before any other dependencies
import './utils/globalPolyfills';

// Function to check if Buffer is properly available
const isBufferReady = () => {
  try {
    if (typeof globalThis.Buffer !== 'function') return false;
    if (typeof globalThis.Buffer.alloc !== 'function') return false;
    if (typeof globalThis.Buffer.from !== 'function') return false;
    
    // Test if Buffer methods actually work
    const testBuffer = globalThis.Buffer.alloc(1);
    const testBuffer2 = globalThis.Buffer.from([1, 2, 3]);
    return true;
  } catch (error) {
    console.error("Buffer is not properly initialized:", error);
    return false;
  }
};

// After polyfill imports, import the rest
import App from './App.tsx';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';

// Wait for polyfills to be initialized before rendering
const initApp = () => {
  // Double check that Buffer is ready
  if (!isBufferReady()) {
    console.error("Buffer polyfill is not ready yet. Delaying app initialization...");
    setTimeout(initApp, 100); // Try again in 100ms
    return;
  }
  
  console.log("Buffer polyfill is ready, initializing app");
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </React.StrictMode>,
  );
};

// Start the initialization process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initApp, 100));
} else {
  setTimeout(initApp, 100);
}
