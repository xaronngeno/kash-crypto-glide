
// This file serves as a wrapper to properly export tweetnacl
import * as tweetnaclModule from 'tweetnacl';

// Re-export everything
export const tweetnacl = tweetnaclModule;

// Also provide a default export for modules expecting it
export default tweetnaclModule;
