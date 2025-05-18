import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // We'll need to install this package
import * as bip39 from 'bip39'; // Import BIP39 library for seed phrase generation
import blockchainService from '../utils/blockchain/blockchainService';

// Define the Wallet interface
interface Wallet {
  id: string;
  name: string;
  icon: string;
  address: string;
  seedPhrase?: string;
  privateKey?: string;
}

// Define the context type
interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  uid: string;
  setUid: (uid: string) => void;
  seedPhrase: string;
  setSeedPhrase: (seedPhrase: string) => void;
  generateSeedPhrase: (name: string) => string;
  connectedWallets: Wallet[];
  addWallet: (wallet: Wallet) => void;
  removeWallet: (walletId: string) => void;
  updateWallet: (walletId: string, updates: Partial<Wallet>) => void;
  isUserRegistered: boolean;
  logout: () => void;
  importWallet: (name: string, seedPhrase: string, uid?: string) => Promise<boolean>;
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  userName: '',
  setUserName: () => {},
  uid: '',
  setUid: () => {},
  seedPhrase: '',
  setSeedPhrase: () => {},
  generateSeedPhrase: () => '',
  connectedWallets: [],
  addWallet: () => {},
  removeWallet: () => {},
  updateWallet: () => {},
  isUserRegistered: false,
  logout: () => {},
  importWallet: async () => false,
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// Generate a cryptographically secure UID
const generateUID = (): string => {
  // Generate a UUID v4
  const uuid = uuidv4();

  // Convert to a more user-friendly format (uppercase alphanumeric without dashes)
  return uuid.replace(/-/g, '').toUpperCase().substring(0, 16);
};

// Generate a truly random seed phrase using BIP39 standard
const generateSeedPhrase = (name: string): string => {
  try {
    // Use BIP39's built-in function to generate a mnemonic
    // This automatically creates secure random entropy and converts it to a mnemonic
    const mnemonic = bip39.generateMnemonic();

    console.log(`Generated unique BIP39 seed phrase for ${name}`);
    return mnemonic;
  } catch (error) {
    console.error("Error generating seed phrase:", error);

    // Fallback method in case the BIP39 library fails
    const fallbackWordList = [
      "abandon", "ability", "access", "account", "achieve", "across", "action", "address", "advance", "advice",
      "air", "animal", "apple", "autumn", "beach", "bird", "branch", "bridge", "butterfly", "cactus",
      "build", "catch", "change", "choose", "collect", "connect", "create", "dance", "decide", "discover",
      "brave", "bright", "calm", "careful", "clever", "curious", "eager", "early", "easy", "empty",
      "digital", "dream", "energy", "engine", "escape", "exchange", "family", "famous", "garden", "history"
    ];

    // Create a truly random seed phrase with fallback method
    const getRandomWord = () => {
      const randomBytes = new Uint32Array(1);
      window.crypto.getRandomValues(randomBytes);
      return fallbackWordList[randomBytes[0] % fallbackWordList.length];
    };

    // Generate 12 unique words
    const seedPhrase: string[] = [];
    while (seedPhrase.length < 12) {
      const word = getRandomWord();
      if (!seedPhrase.includes(word)) {
        seedPhrase.push(word);
      }
    }

    console.log(`Generated fallback seed phrase for ${name}`);
    return seedPhrase.join(' ');
  }
};

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [userName, setUserName] = useState<string>(() => {
    const storedName = localStorage.getItem('ucid_userName');
    return storedName || '';
  });

  const [uid, setUid] = useState<string>(() => {
    const storedUid = localStorage.getItem('ucid_uid');
    return storedUid || '';
  });

  const [seedPhrase, setSeedPhrase] = useState<string>(() => {
    const storedSeedPhrase = localStorage.getItem('ucid_seedPhrase');
    return storedSeedPhrase || '';
  });

  const [connectedWallets, setConnectedWallets] = useState<Wallet[]>(() => {
    const storedWallets = localStorage.getItem('ucid_wallets');
    return storedWallets ? JSON.parse(storedWallets) : [];
  });

  // Determine if user is registered
  const isUserRegistered = Boolean(userName && uid);

  // Update localStorage when state changes
  useEffect(() => {
    if (userName) {
      localStorage.setItem('ucid_userName', userName);
    }
  }, [userName]);

  useEffect(() => {
    if (uid) {
      localStorage.setItem('ucid_uid', uid);
    }
  }, [uid]);

  useEffect(() => {
    if (seedPhrase) {
      localStorage.setItem('ucid_seedPhrase', seedPhrase);
    }
  }, [seedPhrase]);

  // Update localStorage and blockchain when connected wallets change
  useEffect(() => {
    localStorage.setItem('ucid_wallets', JSON.stringify(connectedWallets));

    // If user is registered, update connected wallets in blockchain
    if (isUserRegistered && uid) {
      (async () => {
        try {
          const updated = await blockchainService.updateConnectedWallets(uid, connectedWallets);
          if (updated) {
            console.log(`Connected wallets updated in blockchain for UID: ${uid}`);
          } else {
            console.error(`Failed to update connected wallets in blockchain for UID: ${uid}`);
          }
        } catch (error) {
          console.error('Error updating connected wallets in blockchain:', error);
        }
      })();
    }
  }, [connectedWallets, isUserRegistered, uid]);

  // Set user name, generate UID and seed phrase if not already set
  const handleSetUserName = async (name: string) => {
    setUserName(name);

    // Generate a new UID if one doesn't exist
    if (!uid) {
      const newUid = generateUID();
      setUid(newUid);
    }

    // Generate a new seed phrase if one doesn't exist
    if (!seedPhrase) {
      const newSeedPhrase = generateSeedPhrase(name);
      console.log("Generated new seed phrase:", newSeedPhrase);
      setSeedPhrase(newSeedPhrase);

      // Register the wallet on blockchain with connected wallets
      try {
        const registered = await blockchainService.registerWallet(
          uid,
          newSeedPhrase,
          connectedWallets.length > 0 ? connectedWallets : undefined
        );

        if (registered) {
          console.log("Wallet registered on blockchain successfully with connected wallets");
        } else {
          console.error("Failed to register wallet on blockchain");
        }
      } catch (error) {
        console.error("Error registering wallet on blockchain:", error);
      }
    } else {
      console.log("Using existing seed phrase:", seedPhrase);

      // Update connected wallets in blockchain if they exist
      if (connectedWallets.length > 0) {
        try {
          const updated = await blockchainService.updateConnectedWallets(uid, connectedWallets);
          if (updated) {
            console.log(`Connected wallets updated in blockchain for UID: ${uid}`);
          } else {
            console.error(`Failed to update connected wallets in blockchain for UID: ${uid}`);
          }
        } catch (error) {
          console.error('Error updating connected wallets in blockchain:', error);
        }
      }
    }
  };

  // Add a new wallet
  const addWallet = async (wallet: Wallet) => {
    // Check if wallet already exists
    if (!connectedWallets.some(w => w.id === wallet.id)) {
      // Add to local state
      const updatedWallets = [...connectedWallets, wallet];
      setConnectedWallets(updatedWallets);

      // If user is registered, update connected wallets in blockchain
      if (isUserRegistered && uid) {
        try {
          console.log(`Updating connected wallets in blockchain for UID: ${uid}`);
          console.log("New wallet being added:", {
            id: wallet.id,
            name: wallet.name,
            icon: wallet.icon,
            hasSeedPhrase: !!wallet.seedPhrase,
            hasPrivateKey: !!wallet.privateKey
          });

          const updated = await blockchainService.updateConnectedWallets(uid, updatedWallets);
          if (updated) {
            console.log(`Connected wallets updated in blockchain for UID: ${uid}`);
          } else {
            console.error(`Failed to update connected wallets in blockchain for UID: ${uid}`);
          }
        } catch (error) {
          console.error('Error updating connected wallets in blockchain:', error);
        }
      } else {
        console.log("User not registered or UID not set, skipping blockchain update");
      }
    } else {
      console.log(`Wallet with ID ${wallet.id} already exists, not adding`);
    }
  };

  // Remove a wallet
  const removeWallet = async (walletId: string) => {
    // Update local state
    const updatedWallets = connectedWallets.filter(wallet => wallet.id !== walletId);
    setConnectedWallets(updatedWallets);

    // If user is registered, update connected wallets in blockchain
    if (isUserRegistered && uid) {
      try {
        console.log(`Removing wallet ${walletId} from blockchain for UID: ${uid}`);

        const updated = await blockchainService.updateConnectedWallets(uid, updatedWallets);
        if (updated) {
          console.log(`Connected wallets updated in blockchain after removal for UID: ${uid}`);
        } else {
          console.error(`Failed to update connected wallets in blockchain after removal for UID: ${uid}`);
        }
      } catch (error) {
        console.error('Error updating connected wallets in blockchain after removal:', error);
      }
    }
  };

  // Update a wallet
  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    // Update local state
    const updatedWallets = connectedWallets.map(wallet =>
      wallet.id === walletId ? { ...wallet, ...updates } : wallet
    );
    setConnectedWallets(updatedWallets);

    // If user is registered, update connected wallets in blockchain
    if (isUserRegistered && uid) {
      try {
        console.log(`Updating wallet ${walletId} in blockchain for UID: ${uid}`);
        console.log("Updates:", updates);

        const updated = await blockchainService.updateConnectedWallets(uid, updatedWallets);
        if (updated) {
          console.log(`Connected wallets updated in blockchain after wallet update for UID: ${uid}`);
        } else {
          console.error(`Failed to update connected wallets in blockchain after wallet update for UID: ${uid}`);
        }
      } catch (error) {
        console.error('Error updating connected wallets in blockchain after wallet update:', error);
      }
    }
  };

  // Logout function to clear all user data
  const logout = () => {
    // Clear state
    setUserName('');
    setUid('');
    setSeedPhrase('');
    setConnectedWallets([]);

    // Clear localStorage
    localStorage.removeItem('ucid_userName');
    localStorage.removeItem('ucid_uid');
    localStorage.removeItem('ucid_seedPhrase');
    localStorage.removeItem('ucid_wallets');

    console.log('User logged out successfully');
  };

  // Import wallet function
  const importWallet = async (name: string, importedSeedPhrase: string, importedUid?: string): Promise<boolean> => {
    // Set the user name
    setUserName(name);

    // Use provided UID or generate a new one
    const walletUid = importedUid || generateUID();

    try {
      console.log(`Attempting to import wallet for ${name}`);
      console.log(`Seed phrase: ${importedSeedPhrase}`);
      console.log(`UID: ${importedUid || 'Not provided, will generate new'}`);

      // Get list of registered wallets for debugging
      const registeredWallets = await blockchainService.listAllWallets();
      console.log("Currently registered wallets:", registeredWallets);

      // Verify wallet credentials on blockchain if UID is provided
      if (importedUid) {
        console.log(`Verifying wallet with UID: ${importedUid}`);

        // Check if wallet exists first
        const exists = await blockchainService.walletExists(importedUid);
        console.log(`Wallet with UID ${importedUid} exists: ${exists}`);

        if (!exists) {
          console.log(`Wallet with UID ${importedUid} does not exist. Will attempt to register it.`);

          // Register the wallet since it doesn't exist
          const registered = await blockchainService.registerWallet(
            importedUid,
            importedSeedPhrase,
            connectedWallets.length > 0 ? connectedWallets : undefined
          );
          console.log(`Registration result: ${registered ? 'Success' : 'Failed'}`);

          if (registered) {
            setUid(importedUid);
            setSeedPhrase(importedSeedPhrase);
            // Always fetch and set connected wallets after registration
            const storedConnectedWallets = await blockchainService.getConnectedWallets(importedUid);
            setConnectedWallets(storedConnectedWallets && storedConnectedWallets.length > 0 ? JSON.parse(JSON.stringify(storedConnectedWallets)) : []);
            console.log('New wallet registered successfully');
            return true;
          } else {
            console.error("Failed to register wallet on blockchain");
            return false;
          }
        }

        // Verify the wallet
        const isValid = await blockchainService.verifyWallet(importedUid, importedSeedPhrase);
        console.log(`Verification result: ${isValid ? 'Valid' : 'Invalid'}`);

        if (isValid) {
          console.log("Wallet verified on blockchain successfully");
          setUid(importedUid);
          setSeedPhrase(importedSeedPhrase);

          // Retrieve connected wallets from blockchain
          const storedConnectedWallets = await blockchainService.getConnectedWallets(importedUid);
          setConnectedWallets(storedConnectedWallets && storedConnectedWallets.length > 0 ? JSON.parse(JSON.stringify(storedConnectedWallets)) : []);
          console.log('Wallet imported successfully');
          return true;
        } else {
          console.error("Invalid wallet credentials");
          return false;
        }
      } else {
        // If no UID provided, treat as new wallet
        console.log(`Registering new wallet with generated UID: ${walletUid}`);
        setUid(walletUid);
        setSeedPhrase(importedSeedPhrase);

        // Register as new wallet on blockchain with connected wallets
        const registered = await blockchainService.registerWallet(
          walletUid,
          importedSeedPhrase,
          connectedWallets.length > 0 ? connectedWallets : undefined
        );
        console.log(`Registration result: ${registered ? 'Success' : 'Failed'}`);

        if (registered) {
          console.log("New wallet registered on blockchain successfully");
          // Always fetch and set connected wallets after registration
          const storedConnectedWallets = await blockchainService.getConnectedWallets(walletUid);
          setConnectedWallets(storedConnectedWallets && storedConnectedWallets.length > 0 ? JSON.parse(JSON.stringify(storedConnectedWallets)) : []);
          return true;
        } else {
          console.error("Failed to register new wallet on blockchain");
          return false;
        }
      }
    } catch (error) {
      console.error("Error during wallet import:", error);
      return false;
    }
  };



  return (
    <UserContext.Provider
      value={{
        userName,
        setUserName: handleSetUserName,
        uid,
        setUid,
        seedPhrase,
        setSeedPhrase,
        generateSeedPhrase: (name: string) => generateSeedPhrase(name),
        connectedWallets,
        addWallet,
        removeWallet,
        updateWallet,
        isUserRegistered,
        logout,
        importWallet,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
