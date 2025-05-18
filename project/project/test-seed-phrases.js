// Simple test script to verify seed phrase generation
const bip39 = require('bip39');

// Function to generate a seed phrase using our implementation
function generateSeedPhrase(name) {
  try {
    // Create a Uint8Array to hold 16 bytes (128 bits) of random data
    const entropy = new Uint8Array(16);
    
    // Fill it with cryptographically secure random values
    crypto.getRandomValues(entropy);
    
    // Convert the random bytes to a hex string (required by bip39)
    const entropyHex = Array.from(entropy)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Convert the random entropy to a 12-word mnemonic using BIP39 standard
    const mnemonic = bip39.entropyToMnemonic(entropyHex);
    
    console.log(`Generated unique BIP39 seed phrase for ${name}: ${mnemonic}`);
    return mnemonic;
  } catch (error) {
    console.error("Error generating seed phrase:", error);
    return null;
  }
}

// Test function to verify uniqueness
function testSeedPhraseUniqueness() {
  console.log("Testing seed phrase generation uniqueness...");
  
  // Generate multiple seed phrases for different users
  const users = [
    "Alice", 
    "Bob", 
    "Charlie", 
    "Dave", 
    "Eve", 
    "Frank", 
    "Grace", 
    "Heidi", 
    "Ivan", 
    "Judy"
  ];
  
  const seedPhrases = [];
  
  for (const user of users) {
    const phrase = generateSeedPhrase(user);
    if (phrase) {
      seedPhrases.push(phrase);
    }
  }
  
  // Check for duplicates
  const uniquePhrases = new Set(seedPhrases);
  const isUnique = uniquePhrases.size === seedPhrases.length;
  
  console.log(`All phrases unique: ${isUnique}`);
  console.log(`Generated ${seedPhrases.length} phrases, ${uniquePhrases.size} are unique`);
  
  return isUnique;
}

// Create a global crypto object for Node.js environment
if (typeof crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    }
  };
}

// Run the test
testSeedPhraseUniqueness();
