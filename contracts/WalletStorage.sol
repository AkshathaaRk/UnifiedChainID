// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract WalletStorage {
    // Structure to store wallet data
    struct WalletData {
        string seedPhraseHash; // Store hash of seed phrase, not the actual phrase
        bool exists;
    }
    
    // Mapping from UID to wallet data
    mapping(string => WalletData) private wallets;
    
    // Events
    event WalletRegistered(string uid);
    event WalletAccessed(string uid);
    
    // Register a new wallet with UID and seed phrase hash
    function registerWallet(string memory uid, string memory seedPhraseHash) public {
        require(!wallets[uid].exists, "Wallet with this UID already exists");
        
        wallets[uid] = WalletData({
            seedPhraseHash: seedPhraseHash,
            exists: true
        });
        
        emit WalletRegistered(uid);
    }
    
    // Verify wallet credentials and return success
    function verifyWallet(string memory uid, string memory seedPhraseHash) public returns (bool) {
        require(wallets[uid].exists, "Wallet with this UID does not exist");
        
        bool isValid = keccak256(abi.encodePacked(wallets[uid].seedPhraseHash)) == 
                       keccak256(abi.encodePacked(seedPhraseHash));
        
        if (isValid) {
            emit WalletAccessed(uid);
        }
        
        return isValid;
    }
    
    // Check if a wallet exists
    function walletExists(string memory uid) public view returns (bool) {
        return wallets[uid].exists;
    }
}
