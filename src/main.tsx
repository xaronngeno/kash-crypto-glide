
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import polyfills first - before any other code
import './utils/globalPolyfills';

// After polyfills imports, import the rest
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

// Add a debug check to make sure Buffer is properly loaded
console.log("Buffer availability check in main.tsx:", {
  globalBuffer: typeof globalThis.Buffer,
  windowBuffer: typeof window.Buffer,
  bufferMethods: globalThis.Buffer ? {
    alloc: typeof globalThis.Buffer.alloc,
    from: typeof globalThis.Buffer.from
  } : null
});

// Remove the Toaster from here as it's already included in App.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
