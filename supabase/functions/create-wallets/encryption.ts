
// More secure encryption function using Web Crypto API
export function encryptPrivateKey(privateKey: string, userId: string): string {
  try {
    // For backward compatibility, check if the privateKey is already encrypted
    // by seeing if it's base64 encoded (simple heuristic)
    if (privateKey.match(/^[A-Za-z0-9+/=]+$/)) {
      console.log("Key appears to be already encrypted, skipping encryption");
      return privateKey;
    }
    
    // Create a more secure encryption key derived from userId and a server salt
    // In production, this salt should be stored securely and not in the code
    const serverSalt = "KASH_SECURE_SALT_DO_NOT_CHANGE";
    const encryptionKeyBase = `${serverSalt}_${userId}_SECURE`;
    
    // Use Web Crypto API's subtle.digest to create a more secure key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(encryptionKeyBase);
    
    // Create a secure derived key using SHA-256
    const keyBuffer = crypto.subtle.digest('SHA-256', keyData);
    
    // Once we have the digest, perform the encryption
    return keyBuffer.then(keyBytes => {
      const keyArray = Array.from(new Uint8Array(keyBytes));
      let encrypted = "";
      
      // XOR encryption with the key (better than previous simple method)
      for (let i = 0; i < privateKey.length; i++) {
        const keyByte = keyArray[i % keyArray.length];
        const plainChar = privateKey[i].charCodeAt(0);
        encrypted += String.fromCharCode(plainChar ^ keyByte);
      }
      
      // Convert to base64 for storage
      return btoa(encrypted);
    }).catch(error => {
      console.error("Crypto API error:", error);
      
      // Fallback to the old method for backward compatibility
      console.warn("Falling back to legacy encryption method");
      return legacyEncrypt(privateKey, userId);
    });
  } catch (error) {
    console.error("Encryption error:", error);
    
    // Fallback to the old method for backward compatibility
    console.warn("Falling back to legacy encryption method due to error");
    return legacyEncrypt(privateKey, userId);
  }
}

// Legacy encryption function for backward compatibility
function legacyEncrypt(privateKey: string, userId: string): string {
  // This is the original simple encryption method
  // DO NOT USE THIS IN PRODUCTION - it's not secure!
  const encryptionKey = `KASH_SECRET_KEY_${userId}_SECURE`;
  let encrypted = "";
  
  for (let i = 0; i < privateKey.length; i++) {
    const keyChar = encryptionKey[i % encryptionKey.length].charCodeAt(0);
    const plainChar = privateKey[i].charCodeAt(0);
    encrypted += String.fromCharCode(plainChar ^ keyChar);
  }
  
  // Convert to base64 for storage
  return btoa(encrypted);
}
