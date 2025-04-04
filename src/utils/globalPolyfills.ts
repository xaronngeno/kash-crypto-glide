
// This file provides polyfills for CommonJS modules used in the browser

// Polyfill for Node.js globals that might be used by some libraries
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
  // @ts-ignore
  window.process = { env: {} };
}

export default {};
