import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Copy, Check, PlusCircle, Download, ArrowLeft } from 'lucide-react';

interface UserRegistrationProps {
  onComplete: () => void;
}

type RegistrationStep =
  | 'initial' // Choose between create or import
  | 'create-name' // Enter name for new wallet
  | 'create-seed' // Show generated seed phrase
  | 'import-name' // Enter name for imported wallet
  | 'import-details'; // Enter seed phrase and optional UID

const UserRegistration: React.FC<UserRegistrationProps> = ({ onComplete }) => {
  const { setUserName, setSeedPhrase, generateSeedPhrase, importWallet } = useUser();

  // State for all steps
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('initial');

  // State for create flow
  const [name, setName] = useState('');
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState('');
  const [copied, setCopied] = useState(false);

  // State for import flow
  const [importName, setImportName] = useState('');
  const [importSeedPhrase, setImportSeedPhrase] = useState<string[]>(Array(12).fill(''));
  const [importUid, setImportUid] = useState('');

  // Error states
  const [nameError, setNameError] = useState('');
  const [importNameError, setImportNameError] = useState('');
  const [importSeedPhraseError, setImportSeedPhraseError] = useState('');

  // Add state for the 6-digit code
  const [revealCode, setRevealCode] = useState('');
  const [revealCodeError, setRevealCodeError] = useState('');

  // Helper to validate 6-digit code
  const isValidRevealCode = (code: string) => {
    if (!/^\d{6}$/.test(code)) return false;
    // Check for duplicate digits
    const digits = code.split('');
    if (new Set(digits).size !== 6) return false;
    // Check for consecutive digits
    for (let i = 1; i < digits.length; i++) {
      if (Math.abs(Number(digits[i]) - Number(digits[i - 1])) === 1) return false;
    }
    return true;
  };

  // Handle create wallet name submission
  const handleCreateNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError('Please enter your name');
      return;
    }

    try {
      // Generate a truly random seed phrase using BIP39
      const seedPhrase = generateSeedPhrase(name.trim());
      console.log("Generated seed phrase:", seedPhrase);

      // Verify the seed phrase has 12 words
      if (!seedPhrase || seedPhrase.split(' ').length !== 12) {
        console.error("Invalid seed phrase generated - doesn't have 12 words");
        // Try generating again with a timestamp to ensure uniqueness
        const retryPhrase = generateSeedPhrase(name.trim() + Date.now());

        if (!retryPhrase || retryPhrase.split(' ').length !== 12) {
          throw new Error("Failed to generate a valid seed phrase after retry");
        }

        setGeneratedSeedPhrase(retryPhrase);
      } else {
        setGeneratedSeedPhrase(seedPhrase);
      }

      // Move to seed phrase step
      setCurrentStep('create-seed');
    } catch (error) {
      console.error("Error in seed phrase generation:", error);
      alert("There was an error generating your seed phrase. Please try again.");
    }
  };

  // Handle create wallet completion
  const handleCreateComplete = () => {
    // Set the user name in context (this will also generate a UID)
    setUserName(name.trim());

    // Explicitly set the seed phrase in the context to ensure it's the same one we displayed
    if (generatedSeedPhrase && generatedSeedPhrase.split(' ').length === 12) {
      setSeedPhrase(generatedSeedPhrase);
      console.log("Saving seed phrase to context:", generatedSeedPhrase);
    }

    // Notify parent component that registration is complete
    onComplete();
  };

  // Handle import wallet name submission
  const handleImportNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!importName.trim()) {
      setImportNameError('Please enter your name');
      return;
    }

    // Move to import details step
    setCurrentStep('import-details');
  };

  // Handle import wallet details submission
  const handleImportDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate seed phrase - check if any word is empty
    if (importSeedPhrase.some(word => !word.trim())) {
      setImportSeedPhraseError('Please enter all 12 words of your seed phrase');
      return;
    }

    // Join the array of words into a space-separated string
    const seedPhraseString = importSeedPhrase.map(word => word.trim()).join(' ');

    // Set loading state or indicator here if needed

    try {
      // Import the wallet and verify on blockchain
      const success = await importWallet(
        importName.trim(),
        seedPhraseString,
        importUid.trim() || undefined
      );

      if (success) {
        console.log("Wallet imported and verified successfully");
        // Notify parent component that registration is complete
        onComplete();
      } else {
        // Handle failed import
        if (importUid.trim()) {
          setImportSeedPhraseError('Invalid seed phrase or UID. Please check your details and try again.');
        } else {
          setImportSeedPhraseError('Failed to register new wallet. Please try again.');
        }
      }
    } catch (error) {
      console.error("Error during wallet import:", error);
      setImportSeedPhraseError('An error occurred during wallet import. Please try again.');
    }
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSeedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep === 'create-name' || currentStep === 'import-name') {
      setCurrentStep('initial');
    } else if (currentStep === 'import-details') {
      setCurrentStep('import-name');
    }
  };

  // Handle change for individual seed phrase word inputs
  const handleSeedPhraseWordChange = (index: number, value: string) => {
    const newSeedPhrase = [...importSeedPhrase];
    newSeedPhrase[index] = value;
    setImportSeedPhrase(newSeedPhrase);

    // Clear error if all words are filled
    if (newSeedPhrase.every(word => word.trim())) {
      setImportSeedPhraseError('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#B026FF]/30 rounded-lg w-full max-w-md p-6 shadow-[0_0_20px_rgba(176,38,255,0.3)]">
        {/* Initial Step - Choose between create or import */}
        {currentStep === 'initial' && (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-[#CDA2FC]">Welcome to UnifiedChain ID</h2>

            <p className="text-gray-300 mb-6">
              Create your unified identity to manage all your blockchain wallets in one place.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep('create-name')}
                className="w-full py-4 bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md hover:bg-[#B026FF]/10 transition-all duration-300 flex items-center justify-between px-4"
              >
                <div className="flex items-center">
                  <PlusCircle className="text-[#CDA2FC] mr-3" size={20} />
                  <div className="text-left">
                    <p className="text-[#CDA2FC] font-medium">Create New Wallet</p>
                    <p className="text-gray-400 text-sm">Generate a new wallet with a unique seed phrase</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCurrentStep('import-name')}
                className="w-full py-4 bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md hover:bg-[#B026FF]/10 transition-all duration-300 flex items-center justify-between px-4"
              >
                <div className="flex items-center">
                  <Download className="text-[#CDA2FC] mr-3" size={20} />
                  <div className="text-left">
                    <p className="text-[#CDA2FC] font-medium">Import Existing Wallet</p>
                    <p className="text-gray-400 text-sm">Restore your wallet using a seed phrase</p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Create Wallet - Name Step */}
        {currentStep === 'create-name' && (
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={goBack}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-3"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-[#CDA2FC]">Create New Wallet</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Enter your name to create a new wallet with a unique seed phrase.
            </p>

            <form onSubmit={handleCreateNameSubmit}>
              <div className="mb-6">
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="userName"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError('');
                  }}
                  placeholder="Enter your name"
                  className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                />
                {nameError && (
                  <p className="mt-2 text-red-400 text-sm">{nameError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#B026FF] to-[#B026FF]/50 text-white rounded-md hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </form>
          </>
        )}

        {/* Create Wallet - Seed Phrase Step */}
        {currentStep === 'create-seed' && (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-[#CDA2FC]">Your Seed Phrase</h2>

            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                This is your unique 12-word seed phrase. Please write it down and keep it safe.<br />
                <span className="text-yellow-400">Note: Pick a 6-digit number (no repeats, no consecutive digits) below. You will need this number and your password to reveal your seed phrase in the settings page after logging in.</span>
              </p>

              <div className="relative">
                <div className="bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md p-4 text-[#CDA2FC]">
                  <div className="grid grid-cols-3 gap-2">
                    {generatedSeedPhrase && generatedSeedPhrase.split(' ').length === 12 ? (
                      generatedSeedPhrase.split(' ').map((word, index) => (
                        <div key={index} className="flex">
                          <span className="text-[#B026FF]/70 mr-1">{index + 1}.</span>
                          <span>{word}</span>
                        </div>
                      ))
                    ) : (
                      // Fallback to display 12 placeholder words if seed phrase is not valid
                      Array(12).fill(0).map((_, index) => {
                        // Use a more diverse set of placeholder words
                        const placeholders = [
                          "digital", "dream", "energy", "engine", "escape", "exchange",
                          "family", "famous", "garden", "history", "bridge", "butterfly"
                        ];
                        return (
                          <div key={index} className="flex">
                            <span className="text-[#B026FF]/70 mr-1">{index + 1}.</span>
                            <span>{placeholders[index]}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Pick a 6-digit number</label>
                <input
                  type="text"
                  maxLength={6}
                  value={revealCode}
                  onChange={e => {
                    setRevealCode(e.target.value.replace(/[^0-9]/g, ''));
                    setRevealCodeError('');
                  }}
                  placeholder="e.g. 135792"
                  className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                />
                {revealCodeError && <p className="mt-2 text-red-400 text-sm">{revealCodeError}</p>}
              </div>

              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
                <p className="text-yellow-400 text-sm">
                  Warning: Never share your seed phrase with anyone. Anyone with your seed phrase can access your wallet.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!isValidRevealCode(revealCode)) {
                    setRevealCodeError('Enter a valid 6-digit number (no repeats, no consecutive digits)');
                    return;
                  }
                  // Save code to localStorage or context for later verification
                  localStorage.setItem('ucid_revealCode', revealCode);
                  handleCreateComplete();
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#B026FF] to-[#B026FF]/50 text-white rounded-md hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transition-all duration-300"
              >
                I've Saved My Seed Phrase
              </button>
            </div>
          </>
        )}

        {/* Import Wallet - Name Step */}
        {currentStep === 'import-name' && (
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={goBack}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-3"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-[#CDA2FC]">Import Existing Wallet</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Enter your name to begin importing your existing wallet.
            </p>

            <form onSubmit={handleImportNameSubmit}>
              <div className="mb-6">
                <label htmlFor="importName" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="importName"
                  value={importName}
                  onChange={(e) => {
                    setImportName(e.target.value);
                    if (e.target.value.trim()) setImportNameError('');
                  }}
                  placeholder="Enter your name"
                  className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                />
                {importNameError && (
                  <p className="mt-2 text-red-400 text-sm">{importNameError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#B026FF] to-[#B026FF]/50 text-white rounded-md hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </form>
          </>
        )}

        {/* Import Wallet - Details Step */}
        {currentStep === 'import-details' && (
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={goBack}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-3"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-[#CDA2FC]">Import Wallet Details</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Enter each word of your 12-word seed phrase in order and optional UID to restore your wallet.
            </p>

            <form onSubmit={handleImportDetailsSubmit}>
              <div className="mb-4">
                <label htmlFor="seedPhrase" className="block text-sm font-medium text-gray-300 mb-2">
                  Seed Phrase (required)
                </label>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  {importSeedPhrase.map((word, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-gray-500 text-xs mr-2 w-5">{index + 1}.</span>
                      <input
                        type="text"
                        value={word}
                        onChange={(e) => handleSeedPhraseWordChange(index, e.target.value)}
                        placeholder={`Word ${index + 1}`}
                        className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-2 px-3 text-[#CDA2FC] text-sm focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                      />
                    </div>
                  ))}
                </div>
                {importSeedPhraseError && (
                  <p className="mt-2 text-red-400 text-sm">{importSeedPhraseError}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="uid" className="block text-sm font-medium text-gray-300 mb-2">
                  UID (optional)
                </label>
                <input
                  type="text"
                  id="uid"
                  value={importUid}
                  onChange={(e) => setImportUid(e.target.value)}
                  placeholder="Enter your UID if you have one"
                  className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                />
                <p className="mt-2 text-gray-400 text-xs">
                  If you don't provide a UID, a new one will be generated for you.
                </p>
              </div>

              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-6">
                <p className="text-yellow-400 text-sm">
                  Warning: Make sure you're entering your seed phrase correctly. Never share your seed phrase with anyone.
                </p>
              </div>

              <div className="flex justify-end items-center">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#B026FF] to-[#B026FF]/50 text-white rounded-md hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transition-all duration-300"
                >
                  Import Wallet
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default UserRegistration;
