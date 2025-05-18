// This script starts a Ganache instance for local blockchain development
const { exec } = require('child_process');
const ganache = require('ganache');

// Start Ganache server
const server = ganache.server({
  // Configuration options
  chain: {
    // Chain ID for the local blockchain
    chainId: 5777,
    // Network ID for the local blockchain
    networkId: 5777,
    // Time between blocks in seconds
    blockTime: 1,
  },
  // Logging options
  logging: {
    quiet: false,
    verbose: false,
  },
  // Wallet options
  wallet: {
    // Number of accounts to generate
    totalAccounts: 10,
    // Default balance for each account in ETH
    defaultBalance: 1000,
    // Deterministic accounts for consistent testing
    deterministic: true,
  },
  // Mining options
  miner: {
    // Default gas price in wei
    defaultGasPrice: 20000000000,
    // Block gas limit
    blockGasLimit: 6721975,
  },
});

// Start the server
server.listen(7545, (err, blockchain) => {
  if (err) {
    console.error('Error starting Ganache:', err);
    process.exit(1);
  }

  console.log('Ganache started on port 7545');
  console.log('Available Accounts:');
  
  // Display available accounts
  const accounts = blockchain.accounts;
  Object.keys(accounts).forEach((address, index) => {
    const account = accounts[address];
    console.log(`(${index}) ${address} (${account.balance / 1e18} ETH)`);
  });

  console.log('\nGanache is running. Press Ctrl+C to stop.');
  
  // Deploy the contract
  console.log('\nDeploying WalletStorage contract...');
  exec('node scripts/deploy.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error deploying contract: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Deployment stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
});
