// Simple test to verify seed phrase generation uniqueness
import * as bip39 from 'bip39';

// Function to generate a seed phrase using our implementation
const generateSeedPhrase = () => {
  try {
    // Create a Uint8Array to hold 16 bytes (128 bits) of random data
    const entropy = new Uint8Array(16);
    
    // Fill it with cryptographically secure random values
    window.crypto.getRandomValues(entropy);
    
    // Convert the random bytes to a hex string (required by bip39)
    const entropyHex = Array.from(entropy)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Convert the random entropy to a 12-word mnemonic using BIP39 standard
    const mnemonic = bip39.entropyToMnemonic(entropyHex);
    
    return mnemonic;
  } catch (error) {
    console.error("Error generating seed phrase:", error);
    return null;
  }
};

// Test function to verify uniqueness
const testSeedPhraseUniqueness = () => {
  console.log("Testing seed phrase generation uniqueness...");
  
  // Generate multiple seed phrases
  const seedPhrases = [];
  const count = 10;
  
  for (let i = 0; i < count; i++) {
    const phrase = generateSeedPhrase();
    console.log(`Seed phrase ${i + 1}: ${phrase}`);
    seedPhrases.push(phrase);
  }
  
  // Check for duplicates
  const uniquePhrases = new Set(seedPhrases);
  const isUnique = uniquePhrases.size === seedPhrases.length;
  
  console.log(`All phrases unique: ${isUnique}`);
  console.log(`Generated ${seedPhrases.length} phrases, ${uniquePhrases.size} are unique`);
  
  return isUnique;
};

// Run the test
// Note: This would typically be run in a proper test framework
// For demonstration purposes, you can run this file directly
// or call testSeedPhraseUniqueness() from the browser console
window.testSeedPhraseUniqueness = testSeedPhraseUniqueness;

export { testSeedPhraseUniqueness };
