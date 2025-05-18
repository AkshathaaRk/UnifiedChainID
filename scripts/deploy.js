// This script deploys the WalletStorage contract to Ganache
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const solc = require('solc');

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:7545'); // Default Ganache port

async function deploy() {
  try {
    // Get accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    console.log('Deploying from account:', accounts[0]);

    // Read the Solidity contract source
    const contractPath = path.resolve(__dirname, '../contracts/WalletStorage.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    // Compile the contract
    const input = {
      language: 'Solidity',
      sources: {
        'WalletStorage.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };

    console.log('Compiling contract...');
    const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Check for compilation errors
    if (compiledContract.errors) {
      compiledContract.errors.forEach(error => {
        console.error(error.formattedMessage);
      });
      throw new Error('Contract compilation failed');
    }

    // Get contract data
    const contractData = compiledContract.contracts['WalletStorage.sol']['WalletStorage'];
    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    // Create contract instance
    const contract = new web3.eth.Contract(abi);
    
    // Deploy contract
    console.log('Deploying contract...');
    const deployTx = contract.deploy({
      data: '0x' + bytecode
    });
    
    const gas = await deployTx.estimateGas();
    const deployedContract = await deployTx.send({
      from: accounts[0],
      gas
    });

    console.log('Contract deployed at address:', deployedContract.options.address);

    // Save contract data to a file for later use
    const contractOutput = {
      abi: abi,
      address: deployedContract.options.address,
      networks: {
        5777: { // Ganache network ID
          address: deployedContract.options.address
        }
      }
    };

    // Create build directory if it doesn't exist
    const buildDir = path.resolve(__dirname, '../contracts/build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Write contract data to file
    fs.writeFileSync(
      path.resolve(buildDir, 'WalletStorage.json'),
      JSON.stringify(contractOutput, null, 2)
    );

    console.log('Contract data saved to contracts/build/WalletStorage.json');
    return contractOutput;
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Execute deployment
deploy();
