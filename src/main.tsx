
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import polyfills first - before any other code
import './utils/globalPolyfills';

// After polyfills imports, import the rest
import App from './App.tsx';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';

// Make sure Buffer is available in the global scope
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = globalThis.Buffer;
}

console.log("Buffer availability check:", {
  globalBuffer: typeof globalThis.Buffer,
  windowBuffer: typeof window.Buffer,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
);
