
// Simple encryption function - in production, use a more secure method and proper key management
export function encryptPrivateKey(privateKey: string, userId: string): string {
  try {
    // This is a VERY simple encryption method for demonstration
    // In production, use a proper encryption library and secure key management
    
    // Create a simple XOR encryption with user ID as part of the key
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
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt private key");
  }
}
