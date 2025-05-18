import React, { useState } from 'react';
import * as bip39 from 'bip39';

const SeedPhraseTest: React.FC = () => {
  const [seedPhrases, setSeedPhrases] = useState<string[]>([]);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);

  const generateSeedPhrase = (): string => {
    // Use BIP39's built-in function to generate a mnemonic
    return bip39.generateMnemonic();
  };

  const testUniqueness = () => {
    const newPhrases: string[] = [];
    
    // Generate 10 seed phrases
    for (let i = 0; i < 10; i++) {
      const phrase = generateSeedPhrase();
      newPhrases.push(phrase);
    }
    
    // Check for uniqueness
    const uniquePhrases = new Set(newPhrases);
    const unique = uniquePhrases.size === newPhrases.length;
    
    setSeedPhrases(newPhrases);
    setIsUnique(unique);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-[#111111] text-[#CDA2FC]">
      <h1 className="text-2xl font-bold mb-4">Seed Phrase Generation Test</h1>
      
      <button 
        onClick={testUniqueness}
        className="px-4 py-2 bg-[#B026FF] text-white rounded-md mb-6"
      >
        Generate 10 Seed Phrases
      </button>
      
      {seedPhrases.length > 0 && (
        <div>
          <div className="mb-4">
            <span className="font-bold">All phrases unique: </span>
            <span className={isUnique ? "text-green-500" : "text-red-500"}>
              {isUnique ? "Yes" : "No"}
            </span>
          </div>
          
          <div className="grid gap-4">
            {seedPhrases.map((phrase, index) => (
              <div key={index} className="p-3 bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md">
                <div className="font-bold text-[#B026FF] mb-1">Seed Phrase {index + 1}:</div>
                <div className="break-all">{phrase}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeedPhraseTest;
