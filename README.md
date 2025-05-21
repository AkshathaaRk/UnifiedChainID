## UnifiedChain ID Wallet with Blockchain Integration

A blockchain-based wallet system that allows users to create and manage digital identities across multiple blockchain networks with enhanced security and privacy. This platform gives you a foreground in blockchain of all the other wallets where we authenticate the other wallets on behalf of them as well it gives you a holdings of multiple wallet's Seed-phrase and private key.It gives you one seed phrase and UID where by remembering your UID and password you access all wallets very safely and securedly. It is better to remember one UID tahn storing and losing of multiple wallets.    

## Application 
![Image](https://github.com/user-attachments/assets/408317a1-1e8c-4ccb-bd3c-4e5b80164342)


## Features

- Create wallets with unique seed phrases and UIDs stored securely on the blockchain
- Import existing wallets by verifying seed phrases and UIDs
- Face authentication for enhanced security
- Added external Security while revealing the seed phrase as only owner of the account whould know hoew to use it.
- Cross-chain identity management
- Military-grade encryption for wallet data
- Plays as a foreground for all the other wallets and gives authentication for them on behalf of the user.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Blockchain**: Web3.js, Ethers.js, Ganache (local blockchain)
- **Authentication**: BIP39 for seed phrases, Face authentication
- **3D Visualization**: Three.js with React Three Fiber
- **Build Tools**: Vite, ESLint

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/unifiedchain-id-wallet.git
   cd unifiedchain-id-wallet
   ```

2. Install dependencies
   ```bash
   npm install
   ```

## Running the Application

### Start the Local Blockchain

```bash
npm run ganache
```

This will:
- Start a Ganache instance on port 7545
- Deploy the WalletStorage smart contract
- Display available accounts and their balances

### Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5173

## How It Works
https://youtu.be/quuwZu3rK_w

### Creating a Wallet

1. Navigate to the Dashboard
2. Click "Create New Wallet"
3. Enter your name and other required information
4. A unique seed phrase and UID will be generated
5. The wallet data is registered on the blockchain
6. Save your seed phrase securely

### Importing a Wallet

1. Navigate to the Dashboard
2. Click "Import Existing Wallet"
3. Enter your seed phrase and UID
4. The wallet data is verified against the blockchain
5. If verification is successful, your wallet is imported

## Security Features

- Seed phrases are hashed before being stored on the blockchain
- Optional face authentication for accessing wallet details
- Password protection for sensitive operations
- Code protected for Revealing Seed-phrase.

## Contact

For questions or support, please open an issue on this repository and contact to 
- Akshatha(https://github.com/AkshathaaRk)
- Abhishek(https://github.com/Abhishekmystic-KS)
- Hemalatha(https://github.com/26hemalathaV)

