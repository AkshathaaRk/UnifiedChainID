import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import blockchainService from '../utils/blockchain/blockchainService';

const BlockchainTest: React.FC = () => {
  const { 
    userName, 
    uid, 
    seedPhrase, 
    setUserName, 
    importWallet 
  } = useUser();

  const [logs, setLogs] = useState<string[]>([]);
  const [testName, setTestName] = useState('');
  const [testSeedPhrase, setTestSeedPhrase] = useState('');
  const [testUid, setTestUid] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Add a log message
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    setLogs(prev => [formattedMessage, ...prev]);
  };

  // Effect to log current user state
  useEffect(() => {
    addLog(`Current user state: userName=${userName}, uid=${uid}, seedPhrase=${seedPhrase ? '(exists)' : '(none)'}`, 'info');
  }, [userName, uid, seedPhrase]);

  // Register a new wallet
  const handleRegister = async () => {
    if (!testName) {
      addLog('Please enter a name', 'error');
      return;
    }

    setIsRegistering(true);
    addLog(`Registering new wallet for ${testName}...`, 'info');

    try {
      // Call setUserName which will generate a UID and seed phrase
      // and register the wallet on the blockchain
      await setUserName(testName);
      addLog(`Wallet registered successfully for ${testName}`, 'success');
    } catch (error) {
      addLog(`Error registering wallet: ${error}`, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Import a wallet
  const handleImport = async () => {
    if (!testName) {
      addLog('Please enter a name', 'error');
      return;
    }

    if (!testSeedPhrase) {
      addLog('Please enter a seed phrase', 'error');
      return;
    }

    setIsVerifying(true);
    addLog(`Importing wallet for ${testName}...`, 'info');

    try {
      // Call importWallet which will verify the wallet on the blockchain
      const success = await importWallet(testName, testSeedPhrase, testUid || undefined);
      
      if (success) {
        addLog(`Wallet imported successfully for ${testName}`, 'success');
      } else {
        addLog('Failed to import wallet. Invalid seed phrase or UID.', 'error');
      }
    } catch (error) {
      addLog(`Error importing wallet: ${error}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Check if a wallet exists
  const handleCheckWallet = async () => {
    if (!testUid) {
      addLog('Please enter a UID to check', 'error');
      return;
    }

    addLog(`Checking if wallet with UID ${testUid} exists...`, 'info');

    try {
      const exists = await blockchainService.walletExists(testUid);
      
      if (exists) {
        addLog(`Wallet with UID ${testUid} exists`, 'success');
      } else {
        addLog(`Wallet with UID ${testUid} does not exist`, 'error');
      }
    } catch (error) {
      addLog(`Error checking wallet: ${error}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#CDA2FC] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-[#B026FF]">Blockchain Integration Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1A1A1A] border border-[#B026FF]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Name:</span> {userName || 'Not set'}</p>
              <p><span className="text-gray-400">UID:</span> {uid || 'Not set'}</p>
              <p><span className="text-gray-400">Seed Phrase:</span> {seedPhrase ? '••••••••••••' : 'Not set'}</p>
            </div>
          </div>
          
          <div className="bg-[#1A1A1A] border border-[#B026FF]/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full bg-[#222222] border border-[#B026FF]/20 rounded-md py-2 px-3 text-[#CDA2FC]"
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Seed Phrase (for import)</label>
                <input
                  type="text"
                  value={testSeedPhrase}
                  onChange={(e) => setTestSeedPhrase(e.target.value)}
                  className="w-full bg-[#222222] border border-[#B026FF]/20 rounded-md py-2 px-3 text-[#CDA2FC]"
                  placeholder="Enter seed phrase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">UID (optional for import)</label>
                <input
                  type="text"
                  value={testUid}
                  onChange={(e) => setTestUid(e.target.value)}
                  className="w-full bg-[#222222] border border-[#B026FF]/20 rounded-md py-2 px-3 text-[#CDA2FC]"
                  placeholder="Enter UID"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="px-4 py-2 bg-gradient-to-r from-[#B026FF] to-[#B026FF]/50 text-white rounded-md hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transition-all duration-300 disabled:opacity-50"
                >
                  {isRegistering ? 'Registering...' : 'Register New Wallet'}
                </button>
                
                <button
                  onClick={handleImport}
                  disabled={isVerifying}
                  className="px-4 py-2 bg-gradient-to-r from-[#B026FF] to-[#B026FF]/50 text-white rounded-md hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transition-all duration-300 disabled:opacity-50"
                >
                  {isVerifying ? 'Importing...' : 'Import Wallet'}
                </button>
                
                <button
                  onClick={handleCheckWallet}
                  className="px-4 py-2 bg-[#222222] border border-[#B026FF]/20 text-[#CDA2FC] rounded-md hover:bg-[#B026FF]/10 transition-all duration-300"
                >
                  Check Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-[#1A1A1A] border border-[#B026FF]/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-[#222222] border border-[#B026FF]/20 rounded-md p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Perform an action to see logs.</p>
            ) : (
              logs.map((log, index) => {
                const isSuccess = log.includes('[SUCCESS]');
                const isError = log.includes('[ERROR]');
                const textColor = isSuccess ? 'text-green-400' : isError ? 'text-red-400' : 'text-blue-400';
                
                return (
                  <div key={index} className={`${textColor} mb-1`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTest;
