// Define the Wallet interface
interface Wallet {
  id: string;
  name: string;
  icon: string;
  address: string;
  seedPhrase?: string;
  privateKey?: string;
}

// Define the WalletData interface for blockchain storage
interface WalletData {
  seedPhraseHash: string;
  connectedWallets?: Wallet[];
}

// Mock implementation of the blockchain service for testing
class BlockchainService {
  // Storage key for localStorage
  private readonly STORAGE_KEY = 'ucid_blockchain_wallets';

  constructor() {
    console.log('Mock blockchain service initialized');
    this.loadWalletsFromStorage();
  }

  // Load wallets from localStorage
  private loadWalletsFromStorage(): Map<string, WalletData> {
    try {
      const storedWallets = localStorage.getItem(this.STORAGE_KEY);
      if (storedWallets) {
        // Convert the stored JSON object back to a Map
        const walletsObj = JSON.parse(storedWallets);
        const walletsMap = new Map<string, WalletData>();

        Object.keys(walletsObj).forEach(key => {
          walletsMap.set(key, walletsObj[key]);
        });

        console.log(`Loaded ${walletsMap.size} wallets from storage`);
        return walletsMap;
      }
    } catch (error) {
      console.error('Error loading wallets from storage:', error);
    }

    return new Map<string, WalletData>();
  }

  // Save wallets to localStorage
  private saveWalletsToStorage(wallets: Map<string, WalletData>): void {
    try {
      // Convert Map to a plain object for JSON serialization
      const walletsObj: Record<string, WalletData> = {};
      wallets.forEach((value, key) => {
        walletsObj[key] = value;
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(walletsObj));
      console.log(`Saved ${wallets.size} wallets to storage`);
    } catch (error) {
      console.error('Error saving wallets to storage:', error);
    }
  }



  // Hash the seed phrase before storing it using browser-compatible methods
  private hashSeedPhrase(seedPhrase: string): string {
    // Simple hash function that works in browsers
    // This is not cryptographically secure but works for demo purposes
    let hash = 0;
    for (let i = 0; i < seedPhrase.length; i++) {
      const char = seedPhrase.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex string and ensure it's positive
    const hexHash = (hash >>> 0).toString(16).padStart(8, '0');

    // Make it longer to simulate a real hash
    return hexHash.repeat(8);
  }

  // Register a new wallet in the mock blockchain
  async registerWallet(uid: string, seedPhrase: string, connectedWallets?: Wallet[]): Promise<boolean> {
    try {
      // Load current wallets
      const wallets = this.loadWalletsFromStorage();

      // Check if wallet already exists
      if (wallets.has(uid)) {
        console.error(`Wallet with UID ${uid} already exists`);
        return false;
      }

      // Hash the seed phrase
      const seedPhraseHash = this.hashSeedPhrase(seedPhrase);

      // Make a deep copy of connected wallets to ensure they're properly stored
      let walletsCopy: Wallet[] | undefined = undefined;
      if (connectedWallets && connectedWallets.length > 0) {
        walletsCopy = JSON.parse(JSON.stringify(connectedWallets));
        console.log(`Storing ${walletsCopy.length} connected wallets for UID: ${uid}`);

        // Log each wallet being stored
        walletsCopy.forEach((wallet, index) => {
          console.log(`Wallet ${index + 1}:`, {
            id: wallet.id,
            name: wallet.name,
            icon: wallet.icon,
            address: wallet.address,
            hasSeedPhrase: !!wallet.seedPhrase,
            hasPrivateKey: !!wallet.privateKey
          });
        });
      }

      // Store the wallet data
      wallets.set(uid, {
        seedPhraseHash,
        connectedWallets: walletsCopy
      });

      // Save to storage
      this.saveWalletsToStorage(wallets);

      console.log(`Wallet registered on mock blockchain with UID: ${uid}`);
      return true;
    } catch (error) {
      console.error('Error registering wallet on mock blockchain:', error);
      return false;
    }
  }

  // Verify wallet credentials against the mock blockchain
  async verifyWallet(uid: string, seedPhrase: string): Promise<boolean> {
    try {
      // Load current wallets
      const wallets = this.loadWalletsFromStorage();

      // Check if wallet exists
      if (!wallets.has(uid)) {
        console.error(`Wallet with UID ${uid} does not exist`);
        return false;
      }

      // Hash the seed phrase
      const seedPhraseHash = this.hashSeedPhrase(seedPhrase);

      // Compare the hashes
      const storedWalletData = wallets.get(uid);
      const isValid = storedWalletData && storedWalletData.seedPhraseHash === seedPhraseHash;

      if (isValid) {
        console.log(`Wallet with UID ${uid} verified successfully`);
      } else {
        console.error(`Invalid seed phrase for wallet with UID ${uid}`);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying wallet on mock blockchain:', error);
      return false;
    }
  }

  // Check if a wallet exists in the mock blockchain
  async walletExists(uid: string): Promise<boolean> {
    const wallets = this.loadWalletsFromStorage();
    return wallets.has(uid);
  }

  // Get connected wallets for a specific UID
  async getConnectedWallets(uid: string): Promise<Wallet[] | null> {
    try {
      // Load current wallets
      const wallets = this.loadWalletsFromStorage();

      // Check if wallet exists
      if (!wallets.has(uid)) {
        console.error(`Wallet with UID ${uid} does not exist`);
        return null;
      }

      // Get the wallet data
      const walletData = wallets.get(uid);

      // Debug log to see what's in the wallet data
      console.log(`Retrieved wallet data for UID ${uid}:`, JSON.stringify(walletData, null, 2));

      if (walletData?.connectedWallets && walletData.connectedWallets.length > 0) {
        console.log(`Found ${walletData.connectedWallets.length} connected wallets for UID ${uid}`);

        // Log each wallet being retrieved
        walletData.connectedWallets.forEach((wallet, index) => {
          console.log(`Retrieved wallet ${index + 1}:`, {
            id: wallet.id,
            name: wallet.name,
            icon: wallet.icon,
            address: wallet.address,
            hasSeedPhrase: !!wallet.seedPhrase,
            hasPrivateKey: !!wallet.privateKey
          });
        });

        // Return a deep copy to ensure we don't have reference issues
        return JSON.parse(JSON.stringify(walletData.connectedWallets));
      } else {
        console.log(`No connected wallets found for UID ${uid}`);
        return null;
      }
    } catch (error) {
      console.error('Error getting connected wallets:', error);
      return null;
    }
  }

  // Update connected wallets for a specific UID
  async updateConnectedWallets(uid: string, connectedWallets: Wallet[]): Promise<boolean> {
    try {
      // Load current wallets
      const wallets = this.loadWalletsFromStorage();

      // Check if wallet exists
      if (!wallets.has(uid)) {
        console.error(`Wallet with UID ${uid} does not exist`);
        return false;
      }

      // Get the wallet data
      const walletData = wallets.get(uid);
      if (!walletData) {
        console.error(`Wallet data for UID ${uid} is null`);
        return false;
      }

      // Make a deep copy of connected wallets to ensure they're properly stored
      const walletsCopy = JSON.parse(JSON.stringify(connectedWallets));
      console.log(`Updating ${walletsCopy.length} connected wallets for UID: ${uid}`);

      // Log each wallet being stored
      walletsCopy.forEach((wallet: Wallet, index: number) => {
        console.log(`Wallet ${index + 1}:`, {
          id: wallet.id,
          name: wallet.name,
          icon: wallet.icon,
          address: wallet.address,
          hasSeedPhrase: !!wallet.seedPhrase,
          hasPrivateKey: !!wallet.privateKey
        });
      });

      // Update connected wallets
      walletData.connectedWallets = walletsCopy;

      // Save to storage
      this.saveWalletsToStorage(wallets);

      console.log(`Connected wallets updated for UID: ${uid}`);
      return true;
    } catch (error) {
      console.error('Error updating connected wallets:', error);
      return false;
    }
  }

  // Debug method to list all wallets (for testing purposes)
  async listAllWallets(): Promise<string[]> {
    const wallets = this.loadWalletsFromStorage();
    return Array.from(wallets.keys());
  }

  // Debug method to clear all wallets (for testing purposes)
  async clearAllWallets(): Promise<boolean> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Cleared all wallets from storage');
      return true;
    } catch (error) {
      console.error('Error clearing wallets from storage:', error);
      return false;
    }
  }

  // Debug method to dump all wallet data (for testing purposes)
  async dumpAllWalletData(): Promise<Record<string, WalletData>> {
    const wallets = this.loadWalletsFromStorage();
    const walletsObj: Record<string, WalletData> = {};
    wallets.forEach((value, key) => {
      walletsObj[key] = value;
    });
    console.log("All wallet data:", JSON.stringify(walletsObj, null, 2));
    return walletsObj;
  }



  // Debug method to fix connected wallets (for testing purposes)
  async fixConnectedWallets(uid: string): Promise<boolean> {
    try {
      // Load current wallets
      const wallets = this.loadWalletsFromStorage();

      // Check if wallet exists
      if (!wallets.has(uid)) {
        console.error(`Wallet with UID ${uid} does not exist`);
        return false;
      }

      // Get the wallet data
      const walletData = wallets.get(uid);
      if (!walletData) {
        console.error(`Wallet data for UID ${uid} is null`);
        return false;
      }

      // Check if connected wallets exist
      if (!walletData.connectedWallets || walletData.connectedWallets.length === 0) {
        console.log(`No connected wallets found for UID ${uid}`);
        return false;
      }

      // Make a deep copy of connected wallets to ensure they're properly stored
      const walletsCopy = JSON.parse(JSON.stringify(walletData.connectedWallets));
      console.log(`Fixing ${walletsCopy.length} connected wallets for UID: ${uid}`);

      // Log each wallet being fixed
      walletsCopy.forEach((wallet: Wallet, index: number) => {
        console.log(`Wallet ${index + 1}:`, {
          id: wallet.id,
          name: wallet.name,
          icon: wallet.icon,
          address: wallet.address,
          hasSeedPhrase: !!wallet.seedPhrase,
          hasPrivateKey: !!wallet.privateKey
        });
      });

      // Update connected wallets
      walletData.connectedWallets = walletsCopy;

      // Save to storage
      this.saveWalletsToStorage(wallets);

      console.log(`Connected wallets fixed for UID: ${uid}`);
      return true;
    } catch (error) {
      console.error('Error fixing connected wallets:', error);
      return false;
    }
  }
}

// Export as a singleton
export default new BlockchainService();
