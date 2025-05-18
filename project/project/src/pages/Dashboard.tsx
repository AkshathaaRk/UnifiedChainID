import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, X, CheckCircle, AlertCircle, Loader, LogOut, Camera } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import UserRegistration from '../components/UserRegistration';
import blockchainService from '../utils/blockchain/blockchainService';
import {
  isBraveBrowser,
  isChromeBrowser,
  isAppInstalled,
  isExtensionInstalled,
  activateExtension,
  walletExtensionIds
} from '../utils/browserDetection';

interface Wallet {
  id: string;
  name: string;
  icon: string;
  address: string;
  seedPhrase?: string;
  privateKey?: string;
  appScheme?: string;
  playStoreUrl?: string;
  chromeStoreUrl?: string;
}

type WalletDetailStep = 'seedPhrase' | 'privateKey' | 'confirmation';
type WalletAction = 'show' | 'edit' | 'remove' | null;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Get user data from context
  const {
    userName,
    uid,
    seedPhrase: userSeedPhrase,
    connectedWallets: userWallets,
    addWallet,
    removeWallet,
    updateWallet,
    isUserRegistered,
    logout
  } = useUser();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUid, setShowUid] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [walletSelectionStep, setWalletSelectionStep] = useState<'select' | 'search'>('select');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [connectedWallets, setConnectedWallets] = useState<Wallet[]>([]);
  const [showRegistration, setShowRegistration] = useState(!isUserRegistered);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [faceAuthEnabled, setFaceAuthEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFaceAuthModal, setShowFaceAuthModal] = useState(false);
  const [userPassword, setUserPassword] = useState(''); // Store the user's password
  const [faceAuthStep, setFaceAuthStep] = useState<'scan' | 'processing' | 'success' | 'error'>('scan');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Change password modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Reveal seed phrase modal states
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [seedPhrasePassword, setSeedPhrasePassword] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [storedSeedPhrase, setStoredSeedPhrase] = useState(userSeedPhrase || '');
  const [webcamRef, setWebcamRef] = useState<React.RefObject<HTMLVideoElement> | null>(null);

  // QR code scanner states
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [uidInput, setUidInput] = useState('');
  const [seedPhraseInput, setSeedPhraseInput] = useState('');
  const [showScanResultModal, setShowScanResultModal] = useState(false);
  const [qrScannerInitialized, setQrScannerInitialized] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Effect to sync wallets from context
  useEffect(() => {
    setConnectedWallets(userWallets);
  }, [userWallets]);

  // Effect to update stored seed phrase when user seed phrase changes
  useEffect(() => {
    if (userSeedPhrase) {
      setStoredSeedPhrase(userSeedPhrase);
    }
  }, [userSeedPhrase]);

  // Effect to start webcam when face auth modal opens
  useEffect(() => {
    if (showFaceAuthModal && faceAuthStep === 'scan') {
      startWebcam();
    }
  }, [showFaceAuthModal, faceAuthStep]);

  // Wallet detail modal states
  const [showWalletDetailModal, setShowWalletDetailModal] = useState(false);
  const [walletDetailStep, setWalletDetailStep] = useState<WalletDetailStep>('seedPhrase');
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(''));
  const [privateKey, setPrivateKey] = useState('');
  const [customWalletName, setCustomWalletName] = useState('');
  const [isCustomWallet, setIsCustomWallet] = useState(false);

  // Wallet menu states
  const [menuOpenWalletId, setMenuOpenWalletId] = useState<string | null>(null);
  const [walletAction, setWalletAction] = useState<WalletAction>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Wallet authentication states
  const [showWalletAuthModal, setShowWalletAuthModal] = useState(false);
  const [walletAuthPassword, setWalletAuthPassword] = useState('');
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);
  const [pendingWalletAction, setPendingWalletAction] = useState<WalletAction>(null);

  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState<{
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  }>({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [newPasswordErrors, setNewPasswordErrors] = useState<{
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  }>({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
      appScheme: 'metamask://',
      chromeStoreUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=app.phantom',
      appScheme: 'phantom://',
      chromeStoreUrl: 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa'
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: '🔐',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
      appScheme: 'trust://',
      chromeStoreUrl: 'https://chrome.google.com/webstore/detail/trust-wallet/egjidjbpglichdcondbcbdnbeeppgdph'
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      icon: '🔷',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.okinc.okex.gp',
      appScheme: 'okx://',
      chromeStoreUrl: 'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge'
    },
  ];

  // Handle opening wallet in Chrome (Chrome Web Store or Play Store)
  const handleOpenWalletInChrome = async (walletId: string | null) => {
    if (!walletId) return;

    const wallet = walletOptions.find(w => w.id === walletId);
    if (!wallet) return;

    try {
      // Check if we're in a Chrome-based browser
      const isBrave = await isBraveBrowser();
      const isChrome = isChromeBrowser();

      if (isBrave || isChrome) {
        // If in Chrome or Brave, first check if the extension is already installed
        if (wallet.id in walletExtensionIds) {
          const extensionId = walletExtensionIds[wallet.id as keyof typeof walletExtensionIds];
          const isExtensionAvailable = await isExtensionInstalled(extensionId);

          if (isExtensionAvailable) {
            // Extension is already installed, try to activate it
            setNotificationMessage(`Opening ${wallet.name} extension...`);
            setNotificationType('success');

            // Try to activate the extension directly
            const activated = await activateExtension(extensionId);

            if (!activated) {
              // If activation failed, try to open using chrome-extension:// protocol
              window.open(`chrome-extension://${extensionId}/popup.html`, '_blank');
            }
          } else {
            // Extension not installed, open Chrome Web Store
            window.open(wallet.chromeStoreUrl, '_blank');

            setNotificationMessage(`Opening ${wallet.name} extension in Chrome Web Store`);
            setNotificationType('info');
          }
        } else {
          // No extension ID available, open Chrome Web Store
          window.open(wallet.chromeStoreUrl, '_blank');

          setNotificationMessage(`Opening ${wallet.name} extension in Chrome Web Store`);
          setNotificationType('info');
        }
      } else {
        // For other browsers, open the Play Store URL
        window.open(wallet.playStoreUrl, '_blank');

        setNotificationMessage(`Opening ${wallet.name} in Play Store`);
        setNotificationType('info');
      }

      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error(`Error opening wallet in Chrome:`, error);
      setNotificationMessage(`Error opening ${wallet.name}: ${error}`);
      setNotificationType('error');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      // Close the popup
      setShowWalletPopup(false);
      setWalletSelectionStep('select');
      setSelectedWallet(null);
    }
  };

  // Handle opening wallet in app directly
  const handleOpenWalletInApp = async (walletId: string | null) => {
    if (!walletId) return;

    const wallet = walletOptions.find(w => w.id === walletId);
    if (!wallet) return;

    // Show checking notification
    setNotificationMessage(`Checking if ${wallet.name} is installed...`);
    setNotificationType('info');
    setShowNotification(true);

    try {
      // 1. First check if the wallet extension is installed (for Chrome/Brave browsers)
      const isBrave = await isBraveBrowser();
      const isChrome = isChromeBrowser();

      // Always generate a new timestamp for every click
      const timestamp = Date.now() + '-' + Math.floor(Math.random() * 1000000);
      console.log(`Starting wallet activation process at ${timestamp}...`);

      if ((isBrave || isChrome) && wallet.id === 'metamask') {
        // Always try to use the injected provider for MetaMask
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            setNotificationMessage('Requesting MetaMask connection...');
            setNotificationType('info');
            setShowNotification(true);
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            setNotificationMessage('MetaMask popup opened.');
            setNotificationType('success');
            setShowNotification(true);
          } catch (err) {
            setNotificationMessage('MetaMask request was handled (possibly rejected).');
            setNotificationType('info');
            setShowNotification(true);
          }
        } else {
          // Only use window.open as a fallback if provider is not available
          setNotificationMessage('MetaMask provider not found. Trying fallback...');
          setNotificationType('warning');
          setShowNotification(true);
          window.open(`chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html?t=${timestamp}`, '_blank');
        }
        setTimeout(() => {
          setShowWalletPopup(false);
          setWalletSelectionStep('select');
          setSelectedWallet(null);
          setShowNotification(false);
        }, 3000);
        return;
      }

      if ((isBrave || isChrome) && wallet.id in walletExtensionIds) {
        const extensionId = walletExtensionIds[wallet.id as keyof typeof walletExtensionIds];

        console.log(`Checking for ${wallet.name} extension (${extensionId})...`);

        // For MetaMask, we'll use a special approach to ensure it opens
        if (wallet.id === 'metamask') {
          console.log('Attempting to open MetaMask...');

          setNotificationMessage(`Opening ${wallet.name} browser extension...`);
          setNotificationType('info');
          setShowNotification(true);

          // Try multiple methods to open MetaMask
          let metamaskOpened = false;

          // Method 1: Try direct activation through our utility
          console.log(`Activating MetaMask extension via utility...`);
          const activated = await activateExtension(extensionId);

          if (activated) {
            console.log('MetaMask activation initiated');
            metamaskOpened = true;
          }

          // Method 2: If ethereum object exists, try to directly request accounts
          // This is a more direct approach that often works better
          if (!metamaskOpened && typeof (window as any).ethereum !== 'undefined') {
            try {
              console.log('Trying direct ethereum.request call...');

              // Create a button to simulate user interaction (helps bypass security restrictions)
              const tempButton = document.createElement('button');
              tempButton.style.display = 'none';
              document.body.appendChild(tempButton);

              tempButton.onclick = async () => {
                try {
                  await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                  console.log('MetaMask request sent successfully');
                  metamaskOpened = true;
                } catch (err) {
                  console.log('MetaMask request handled (possibly rejected)');
                  metamaskOpened = true; // Even if rejected, the popup appeared
                }
              };

              // Trigger the click
              tempButton.click();

              // Clean up
              setTimeout(() => {
                document.body.removeChild(tempButton);
              }, 100);
            } catch (err) {
              console.error('Error in direct ethereum request:', err);
            }
          }

          // Method 3: Try opening specific MetaMask pages directly
          if (!metamaskOpened) {
            const metamaskPages = [
              'notification.html',
              'home.html',
              'popup.html'
            ];

            for (const page of metamaskPages) {
              if (metamaskOpened) break;

              try {
                console.log(`Trying to open MetaMask ${page}...`);
                const pageWindow = window.open(
                  `chrome-extension://${extensionId}/${page}?t=${timestamp}`,
                  `metamask-${page}`,
                  'width=360,height=600,location=0,menubar=0,resizable=0,scrollbars=0,status=0,toolbar=0'
                );

                if (pageWindow) {
                  console.log(`MetaMask ${page} opened successfully`);
                  metamaskOpened = true;
                  break;
                }
              } catch (pageErr) {
                console.error(`Error opening MetaMask ${page}:`, pageErr);
              }
            }
          }

          // Update notification based on result
          if (metamaskOpened) {
            setNotificationMessage(`${wallet.name} extension opened successfully`);
            setNotificationType('success');
          } else {
            // Last resort: try to open the extension page directly
            try {
              console.log('Last resort: Opening MetaMask extension page directly...');
              window.open(`chrome-extension://${extensionId}/home.html?t=${timestamp}`, '_blank');

              setNotificationMessage(`Attempted to open ${wallet.name}. If it didn't open, please click on the MetaMask icon in your browser toolbar.`);
              setNotificationType('warning');
            } catch (lastErr) {
              console.error('Failed to open MetaMask:', lastErr);
              setNotificationMessage(`Could not open ${wallet.name}. Please click on the MetaMask icon in your browser toolbar.`);
              setNotificationType('error');
            }
          }

          // Close the popup and return early
          setTimeout(() => {
            setShowWalletPopup(false);
            setWalletSelectionStep('select');
            setSelectedWallet(null);
            setShowNotification(false);
          }, 3000);

          return;
        }

        // For other wallets, check if they're installed first
        const isExtensionAvailable = await isExtensionInstalled(extensionId);

        if (isExtensionAvailable) {
          console.log(`${wallet.name} extension detected!`);

          // Extension is installed, activate it directly
          setNotificationMessage(`Opening ${wallet.name} browser extension...`);
          setNotificationType('success');
          setShowNotification(true);

          // Try to activate the extension directly
          console.log(`Activating ${wallet.name} extension...`);
          const activated = await activateExtension(extensionId);

          if (!activated) {
            console.log(`Fallback: Opening ${wallet.name} extension popup directly...`);
            // If activation failed, try to open using chrome-extension:// protocol with timestamp
            window.open(`chrome-extension://${extensionId}/popup.html?t=${timestamp}`, '_blank');
          }

          // Close the popup and return early
          setTimeout(() => {
            setShowWalletPopup(false);
            setWalletSelectionStep('select');
            setSelectedWallet(null);
            setShowNotification(false);
          }, 3000);

          return;
        } else {
          // Extension not detected, check if the wallet app is installed
          console.log(`${wallet.name} extension not detected, checking for app...`);
          const isAppAvailable = await isAppInstalled(wallet.appScheme);

          if (isAppAvailable) {
            // If app is installed, open the wallet directly in the native app
            console.log(`${wallet.name} app detected, opening...`);
            setNotificationMessage(`Opening ${wallet.name} app...`);
            setNotificationType('success');
            setShowNotification(true);

            // Open the app using its URL scheme
            window.location.href = `${wallet.appScheme}?t=${timestamp}`;

            // Close the popup and return early
            setTimeout(() => {
              setShowWalletPopup(false);
              setWalletSelectionStep('select');
              setSelectedWallet(null);
              setShowNotification(false);
            }, 3000);

            return;
          } else {
            // Neither extension nor app is installed, offer installation options
            console.log(`${wallet.name} not detected, offering installation options...`);

            // For Chrome/Brave, prioritize extension installation
            if (isBrave || isChrome) {
              setNotificationMessage(`${wallet.name} extension not found.`);
              setNotificationType('warning');
              setShowNotification(true);

              // Ask if user wants to install the extension
              if (confirm(`${wallet.name} extension is not installed. Would you like to install it now?`)) {
                console.log(`Opening Chrome Web Store for ${wallet.name}...`);
                // Open Chrome Web Store for the extension
                window.open(wallet.chromeStoreUrl, '_blank');
              }
            } else {
              // For other browsers, offer app installation
              setNotificationMessage(`${wallet.name} app not installed.`);
              setNotificationType('warning');
              setShowNotification(true);

              // Ask if user wants to install the app
              if (confirm(`${wallet.name} is not installed. Would you like to install it now?`)) {
                console.log(`Opening Play Store for ${wallet.name}...`);
                window.open(wallet.playStoreUrl, '_blank');
              }
            }
          }
        }
      } else {
        // Not in Chrome/Brave or no extension ID available, check for app
        console.log(`Checking if ${wallet.name} app is installed...`);
        const isAppAvailable = await isAppInstalled(wallet.appScheme);

        if (isAppAvailable) {
          // If installed, open the wallet directly in the native app
          console.log(`${wallet.name} app detected, opening...`);
          setNotificationMessage(`Opening ${wallet.name} app...`);
          setNotificationType('success');
          setShowNotification(true);

          // Always create a new iframe for every attempt
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `${wallet.appScheme}?t=${timestamp}`;
          document.body.appendChild(iframe);

          // Remove the iframe after a short delay
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        } else {
          // App not installed, offer installation
          setNotificationMessage(`${wallet.name} app not installed.`);
          setNotificationType('warning');
          setShowNotification(true);

          // Ask if user wants to install the app
          if (confirm(`${wallet.name} is not installed. Would you like to install it now?`)) {
            console.log(`Opening Play Store for ${wallet.name}...`);
            window.open(wallet.playStoreUrl, '_blank');
          }
        }
      }
    } catch (error) {
      // Handle any errors during the process
      console.error(`Error handling wallet app opening:`, error);
      setNotificationMessage(`Error opening ${wallet.name}: ${error}`);
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      // Hide notification after a delay
      setTimeout(() => setShowNotification(false), 3000);

      // Close the popup
      setShowWalletPopup(false);
      setWalletSelectionStep('select');
      setSelectedWallet(null);
    }
  };

  // Check if a wallet is already connected
  const isWalletConnected = (walletId: string): boolean => {
    return connectedWallets.some(wallet => wallet.id === walletId);
  };

  // Connect a wallet to the user's account
  const connectWallet = async (walletId: string) => {
    const walletToConnect = walletOptions.find(wallet => wallet.id === walletId);
    if (walletToConnect) {
      // Add the wallet to connected wallets if not already connected
      if (!isWalletConnected(walletId)) {
        const newWallet: Wallet = {
          ...walletToConnect,
          address: '' // Empty address until user adds details
          // Note: We're not setting privateKey here, so it will be undefined
        };

        try {
          // Add to context (now async)
          await addWallet(newWallet);
          console.log(`${walletToConnect.name} connected and synced with blockchain`);

          // Set active wallet ID for the detail modal
          setActiveWalletId(walletId);

          // Prepare for seed phrase and private key input
          setSeedPhrase(Array(12).fill(''));
          setPrivateKey('');
          setIsViewMode(false);
          setWalletAction('edit');
          setWalletDetailStep('seedPhrase');

          // Close the wallet selection popup and open the detail modal
          setShowWalletPopup(false);
          setShowWalletDetailModal(true);
        } catch (error) {
          console.error("Error connecting wallet:", error);

          // Show error message
          setShowNotification(true);
          setNotificationMessage(`Error connecting ${walletToConnect.name}. Please try again.`);
          setNotificationType('error');
          setTimeout(() => setShowNotification(false), 3000);

          // Close the popup
          setShowWalletPopup(false);
          setWalletSelectionStep('select');
          setSelectedWallet(null);
        }
      } else {
        // If wallet is already connected, just close the popup
        setShowWalletPopup(false);
        setWalletSelectionStep('select');
        setSelectedWallet(null);
      }
    }
  };

  const toggleWalletMenu = (walletId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpenWalletId === walletId) {
      setMenuOpenWalletId(null);
    } else {
      setMenuOpenWalletId(walletId);
    }
  };

  const handleWalletAction = async (action: WalletAction, walletId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenWalletId(null);

    if (action === 'remove') {
      try {
        // Get wallet info for the notification
        const wallet = connectedWallets.find(w => w.id === walletId);
        const walletName = wallet ? wallet.name : 'Wallet';

        // Remove the wallet from context (now async)
        await removeWallet(walletId);

        // Show success notification
        setShowNotification(true);
        setNotificationMessage(`${walletName} removed successfully`);
        setNotificationType('success');
        setTimeout(() => setShowNotification(false), 3000);

        console.log(`Wallet ${walletId} removed and blockchain updated`);
      } catch (error) {
        console.error("Error removing wallet:", error);

        // Show error notification
        setShowNotification(true);
        setNotificationMessage("Error removing wallet. Please try again.");
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
      }
      return;
    }

    // For show or edit actions, require authentication first
    setPendingWalletId(walletId);
    setPendingWalletAction(action);

    // Show authentication modal
    setWalletAuthPassword('');
    setShowWalletAuthModal(true);
  };

  const openWalletDetails = (walletId: string) => {
    // Store the wallet ID and action for after authentication
    setPendingWalletId(walletId);
    setPendingWalletAction('edit');

    // Show authentication modal
    setWalletAuthPassword('');
    setShowWalletAuthModal(true);
  };

  // Function to handle wallet authentication
  const handleWalletAuth = () => {
    // Check if the entered password matches the user's password
    if (userPassword && walletAuthPassword === userPassword && pendingWalletId) {
      // Authentication successful, proceed to show wallet details
      setActiveWalletId(pendingWalletId);
      setWalletDetailStep('seedPhrase');

      // Check if wallet already has seed phrase and private key
      const wallet = connectedWallets.find(w => w.id === pendingWalletId);
      if (wallet && wallet.seedPhrase) {
        setSeedPhrase(wallet.seedPhrase.split(' '));
        setPrivateKey(wallet.privateKey || '');
        setIsViewMode(true); // Default to view mode if wallet already has details
      } else {
        setSeedPhrase(Array(12).fill(''));
        setPrivateKey('');
        setIsViewMode(false); // Default to edit mode if wallet doesn't have details
      }

      setWalletAction(pendingWalletAction);

      // Close auth modal and show wallet detail modal
      setShowWalletAuthModal(false);
      setShowWalletDetailModal(true);

      // Reset pending states
      setPendingWalletId(null);
      setPendingWalletAction(null);
      setWalletAuthPassword('');

      console.log("Wallet authentication successful with password:", walletAuthPassword);
    } else {
      // Show error message for invalid password
      console.log("Authentication failed - Entered:", walletAuthPassword, "Stored:", userPassword);
      alert("Invalid password. Please try again.");
    }
  };

  const closeWalletAuthModal = () => {
    setShowWalletAuthModal(false);
    setPendingWalletId(null);
    setPendingWalletAction(null);
    setWalletAuthPassword('');
  };

  // Password validation function
  const validatePassword = (password: string, setErrors: React.Dispatch<React.SetStateAction<{
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  }>>) => {
    // Check for minimum length of 6 characters
    const hasMinLength = password.length >= 6;

    // Check for at least one uppercase letter
    const hasUppercase = /[A-Z]/.test(password);

    // Check for at least one number
    const hasNumber = /[0-9]/.test(password);

    // Check for at least one special character
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // Update error states
    setErrors({
      length: !hasMinLength,
      uppercase: !hasUppercase,
      number: !hasNumber,
      special: !hasSpecial
    });

    // Return true if all criteria are met
    return hasMinLength && hasUppercase && hasNumber && hasSpecial;
  };

  // Check if password meets all requirements
  const isPasswordValid = (errors: { length: boolean; uppercase: boolean; number: boolean; special: boolean; }) => {
    return !errors.length && !errors.uppercase && !errors.number && !errors.special;
  };

  const handleSeedPhraseChange = (index: number, value: string) => {
    if (isViewMode) return; // Don't allow changes in view mode

    const newSeedPhrase = [...seedPhrase];
    newSeedPhrase[index] = value;
    setSeedPhrase(newSeedPhrase);
  };

  const handleSeedPhraseSubmit = () => {
    // Always proceed to the next step, regardless of view mode
    setWalletDetailStep('privateKey');
  };

  const handlePrivateKeySubmit = async () => {
    setWalletDetailStep('confirmation');

    // Update the wallet with seed phrase and private key
    if (activeWalletId && !isViewMode) {
      try {
        // Find the wallet to update
        const wallet = connectedWallets.find(w => w.id === activeWalletId);

        if (wallet) {
          // Only include privateKey if it's not empty
          const updateData: { seedPhrase: string; privateKey?: string } = {
            seedPhrase: seedPhrase.join(' ')
          };

          // Only add privateKey if it's not empty
          if (privateKey && privateKey.trim() !== '') {
            updateData.privateKey = privateKey;
          }

          // Update the wallet in context (now async)
          await updateWallet(activeWalletId, updateData);

          console.log(`Wallet ${activeWalletId} updated and blockchain synced`);

          // Show success notification
          setShowNotification(true);
          setNotificationMessage("Wallet details updated successfully");
          setNotificationType('success');
          setTimeout(() => setShowNotification(false), 3000);
        }
      } catch (error) {
        console.error("Error updating wallet:", error);

        // Show error notification
        setShowNotification(true);
        setNotificationMessage("Error updating wallet details. Please try again.");
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
      }
    }
  };

  const closeWalletDetailModal = () => {
    setShowWalletDetailModal(false);
    setActiveWalletId(null);
    setWalletAction(null);
    setIsCustomWallet(false);
    setCustomWalletName('');
  };

  const toggleEditMode = () => {
    setIsViewMode(!isViewMode);
  };

  const toggleFaceAuth = () => {
    if (!faceAuthEnabled) {
      // If enabling face auth, show the face auth setup modal
      setShowFaceAuthModal(true);
      setFaceAuthStep('scan');
      // Create a new webcam reference
      setWebcamRef(React.createRef<HTMLVideoElement>());
    } else {
      // If disabling face auth, just toggle it off
      setFaceAuthEnabled(false);
    }
  };

  const closeFaceAuthModal = () => {
    setShowFaceAuthModal(false);
    // Stop the webcam if it's running
    if (webcamRef && webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      webcamRef.current.srcObject = null;
    }
  };

  const startWebcam = async () => {
    if (webcamRef && webcamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });
        webcamRef.current.srcObject = stream;
        webcamRef.current.play();
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setFaceAuthStep('error');
      }
    }
  };

  const captureAndVerifyFace = () => {
    // Simulate face detection and verification process
    setFaceAuthStep('processing');

    // Simulate processing delay
    setTimeout(() => {
      // 80% chance of success for demo purposes
      const isSuccess = Math.random() < 0.8;

      if (isSuccess) {
        setFaceAuthStep('success');
        // Wait a moment to show success message before closing
        setTimeout(() => {
          setFaceAuthEnabled(true);

          // If this was initiated from wallet authentication, proceed with wallet auth
          if (pendingWalletId) {
            // Authentication successful, proceed to show wallet details
            setActiveWalletId(pendingWalletId);
            setWalletDetailStep('seedPhrase');

            // Check if wallet already has seed phrase and private key
            const wallet = connectedWallets.find(w => w.id === pendingWalletId);
            if (wallet && wallet.seedPhrase) {
              setSeedPhrase(wallet.seedPhrase.split(' '));
              setPrivateKey(wallet.privateKey || '');
              setIsViewMode(pendingWalletAction === 'show'); // View mode if action was 'show'
            } else {
              setSeedPhrase(Array(12).fill(''));
              setPrivateKey('');
              setIsViewMode(false); // Default to edit mode if wallet doesn't have details
            }

            setWalletAction(pendingWalletAction);

            // Show wallet detail modal after face auth is closed
            setTimeout(() => {
              setShowWalletDetailModal(true);
            }, 100);

            // Reset pending states
            setPendingWalletId(null);
            setPendingWalletAction(null);
          }

          closeFaceAuthModal();
        }, 1500);
      } else {
        setFaceAuthStep('error');
      }
    }, 2000);
  };

  const togglePassword = () => {
    if (!passwordEnabled) {
      // If enabling password, show the password setup modal
      setShowPasswordModal(true);
      // Reset password fields and errors
      setPassword('');
      setConfirmPassword('');
      setPasswordErrors({
        length: false,
        uppercase: false,
        number: false,
        special: false
      });
    } else {
      // If disabling password, just toggle it off
      setPasswordEnabled(false);
    }
  };

  const handlePasswordSubmit = () => {
    // Validate password meets all requirements and matches confirmation
    const isValid = isPasswordValid(passwordErrors) && password === confirmPassword;

    if (isValid) {
      // Store the user's password
      setUserPassword(password);
      setPasswordEnabled(true);
      setShowPasswordModal(false);

      // Log to console for debugging (remove in production)
      console.log("Password set:", password);

      // Reset password fields
      setPassword('');
      setConfirmPassword('');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setConfirmPassword('');
    // Reset password errors
    setPasswordErrors({
      length: false,
      uppercase: false,
      number: false,
      special: false
    });
  };

  // Handle password input with validation
  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword, setPasswordErrors);
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCurrentPasswordError(null);
    setNewPasswordErrors({
      length: false,
      uppercase: false,
      number: false,
      special: false
    });
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCurrentPasswordError(null);
    setNewPasswordErrors({
      length: false,
      uppercase: false,
      number: false,
      special: false
    });
  };

  // Handle new password input with validation
  const handleNewPasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPwd = e.target.value;
    setNewPassword(newPwd);
    validatePassword(newPwd, setNewPasswordErrors);
  };

  const handleChangePasswordSubmit = () => {
    // Check if current password matches the user's password
    if (!userPassword || currentPassword !== userPassword) {
      setCurrentPasswordError("Invalid current password");
      console.log("Password mismatch - Current:", currentPassword, "Stored:", userPassword);
      return;
    }

    // Validate new password meets all requirements and matches confirmation
    const isValid = isPasswordValid(newPasswordErrors) && newPassword === confirmNewPassword;

    if (isValid) {
      // Update the stored password
      setUserPassword(newPassword);
      setPasswordEnabled(true);
      setShowChangePasswordModal(false);

      // Log to console for debugging (remove in production)
      console.log("Password changed from:", userPassword, "to:", newPassword);

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setCurrentPasswordError(null);
    }
  };

  const openSeedPhraseModal = () => {
    setShowSeedPhraseModal(true);
    setSeedPhrasePassword('');
    setIsPasswordVerified(false);
    console.log("Opening seed phrase modal, current seed phrase:", storedSeedPhrase);
  };

  const closeSeedPhraseModal = () => {
    setShowSeedPhraseModal(false);
    setSeedPhrasePassword('');
    setIsPasswordVerified(false);
  };

  const [revealCodeInput, setRevealCodeInput] = useState('');
  const [revealCodeError, setRevealCodeError] = useState('');
  const storedRevealCode = localStorage.getItem('ucid_revealCode') || '';

  const verifySeedPhrasePassword = () => {
    // Check password and 6-digit code
    if (!userPassword || seedPhrasePassword !== userPassword) {
      alert('Invalid password. Please try again.');
      return;
    }
    if (!storedRevealCode || revealCodeInput !== storedRevealCode) {
      setRevealCodeError('Invalid 6-digit code. Please try again.');
      return;
    }
    setRevealCodeError('');
    setIsPasswordVerified(true);
  };

  // QR code scanner functions
  const initializeQrScanner = () => {
    if (scannerRef.current && !qrScannerInitialized) {
      try {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        scanner.render(
          (decodedText) => {
            // Handle the scanned code
            setScanResult(decodedText);
            setShowScanResultModal(true);
            scanner.clear();
          },
          (error) => {
            // Handle scan failure
            console.error("QR code scan error:", error);
          }
        );

        setQrScannerInitialized(true);
      } catch (error) {
        console.error("Failed to initialize QR scanner:", error);
      }
    }
  };

  const openQrScanner = () => {
    setShowQrScanner(true);
    // Initialize scanner in the next render cycle
    setTimeout(() => {
      initializeQrScanner();
    }, 100);
  };

  const closeQrScanner = () => {
    setShowQrScanner(false);
    setQrScannerInitialized(false);
    setScanResult('');
  };

  const openQrGenerator = () => {
    setShowQrGenerator(true);
  };

  const closeQrGenerator = () => {
    setShowQrGenerator(false);
  };

  const handleScanResultSubmit = async () => {
    // Process the scan result
    try {
      // Parse the QR code data
      // Expected format: UID:xxx|SEED:yyy
      const parts = scanResult.split('|');
      if (parts.length === 2) {
        const uidPart = parts[0].split(':');
        const seedPart = parts[1].split(':');

        if (uidPart.length === 2 && seedPart.length === 2 && uidPart[0] === 'UID' && seedPart[0] === 'SEED') {
          const uid = uidPart[1];
          const seedPhrase = seedPart[1];

          // Verify the wallet on the blockchain
          const isValid = await blockchainService.verifyWallet(uid, seedPhrase);

          if (isValid) {
            // Create a new wallet from imported seed phrase
            const newWallet: Wallet = {
              id: uid,
              name: `Scanned Wallet (${new Date().toLocaleDateString()})`,
              icon: '📱', // Scan icon
              address: '', // No default address
              seedPhrase: seedPhrase
              // Not setting privateKey at all, so it will be undefined
            };

            try {
              // Add to context (now async)
              await addWallet(newWallet);
              console.log(`Scanned wallet added and synced with blockchain`);

              // Show success message
              setShowNotification(true);
              setNotificationMessage('Wallet verified and imported successfully!');
              setNotificationType('success');
              setTimeout(() => setShowNotification(false), 3000);
            } catch (error) {
              console.error("Error adding scanned wallet to context:", error);

              // Show error notification
              setShowNotification(true);
              setNotificationMessage("Error adding scanned wallet. Please try again.");
              setNotificationType("error");
              setTimeout(() => setShowNotification(false), 3000);
            }
          } else {
            // Register as a new wallet
            const registered = await blockchainService.registerWallet(uid, seedPhrase);

            if (registered) {
              // Create a new wallet
              const newWallet: Wallet = {
                id: uid,
                name: `New Scanned Wallet (${new Date().toLocaleDateString()})`,
                icon: '📱', // Scan icon
                address: '', // No default address
                seedPhrase: seedPhrase
                // Not setting privateKey at all, so it will be undefined
              };

              try {
                // Add to context (now async)
                await addWallet(newWallet);
                console.log(`New scanned wallet added and synced with blockchain`);

                // Show success message
                setShowNotification(true);
                setNotificationMessage('New wallet registered successfully!');
                setNotificationType('success');
                setTimeout(() => setShowNotification(false), 3000);
              } catch (error) {
                console.error("Error adding new scanned wallet to context:", error);

                // Show error notification
                setShowNotification(true);
                setNotificationMessage("Error adding new wallet. Please try again.");
                setNotificationType("error");
                setTimeout(() => setShowNotification(false), 3000);
              }
            } else {
              // Show error message
              setShowNotification(true);
              setNotificationMessage('Failed to register wallet on blockchain. Please try again.');
              setNotificationType('error');
              setTimeout(() => setShowNotification(false), 3000);
            }
          }
        } else {
          // Invalid format
          setShowNotification(true);
          setNotificationMessage('Invalid QR code format. Expected UID:xxx|SEED:yyy');
          setNotificationType('error');
          setTimeout(() => setShowNotification(false), 3000);
        }
      } else {
        // Invalid format
        setShowNotification(true);
        setNotificationMessage('Invalid QR code format. Expected UID:xxx|SEED:yyy');
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error("Error processing scan result:", error);
      // Show error message
      setShowNotification(true);
      setNotificationMessage('An error occurred while processing the QR code. Please try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotification(false), 3000);
    }

    // Close the modal
    setShowScanResultModal(false);
    // Reset scan result
    setScanResult('');
  };

  const closeScanResultModal = () => {
    setShowScanResultModal(false);
    setScanResult('');
  };

  const handleUidSubmit = async () => {
    // Validate the UID and seed phrase
    if (uidInput && seedPhraseInput) {
      try {
        console.log(`Attempting to verify wallet with UID: ${uidInput}`);
        console.log(`Seed phrase: ${seedPhraseInput}`);

        // Get list of registered wallets for debugging
        const registeredWallets = await blockchainService.listAllWallets();
        console.log("Currently registered wallets:", registeredWallets);

        // Verify the wallet on the blockchain
        const isValid = await blockchainService.verifyWallet(uidInput, seedPhraseInput);
        console.log(`Verification result: ${isValid ? 'Valid' : 'Invalid'}`);

        if (isValid) {
          // Create a new wallet from imported seed phrase
          const newWallet: Wallet = {
            id: uidInput,
            name: `Imported Wallet (${new Date().toLocaleDateString()})`,
            icon: '📥', // Import icon
            address: '', // No default address
            seedPhrase: seedPhraseInput
            // Not setting privateKey at all, so it will be undefined
          };

          try {
            // Add to context (now async)
            await addWallet(newWallet);
            console.log(`Imported wallet added and synced with blockchain`);

            // Show success message
            setShowNotification(true);
            setNotificationMessage('Wallet verified and imported successfully!');
            setNotificationType('success');
            setTimeout(() => setShowNotification(false), 3000);
          } catch (error) {
            console.error("Error adding imported wallet to context:", error);

            // Show error notification
            setShowNotification(true);
            setNotificationMessage("Error adding imported wallet. Please try again.");
            setNotificationType("error");
            setTimeout(() => setShowNotification(false), 3000);
          }
        } else {
          console.log(`Attempting to register new wallet with UID: ${uidInput}`);

          // Register as a new wallet
          const registered = await blockchainService.registerWallet(uidInput, seedPhraseInput);
          console.log(`Registration result: ${registered ? 'Success' : 'Failed'}`);

          if (registered) {
            // Create a new wallet
            const newWallet: Wallet = {
              id: uidInput,
              name: `New Wallet (${new Date().toLocaleDateString()})`,
              icon: '📥', // Import icon
              address: '', // No default address
              seedPhrase: seedPhraseInput
              // Not setting privateKey at all, so it will be undefined
            };

            try {
              // Add to context (now async)
              await addWallet(newWallet);
              console.log(`New imported wallet added and synced with blockchain`);

              // Show success message
              setShowNotification(true);
              setNotificationMessage('New wallet registered successfully!');
              setNotificationType('success');
              setTimeout(() => setShowNotification(false), 3000);
            } catch (error) {
              console.error("Error adding new imported wallet to context:", error);

              // Show error notification
              setShowNotification(true);
              setNotificationMessage("Error adding new wallet. Please try again.");
              setNotificationType("error");
              setTimeout(() => setShowNotification(false), 3000);
            }
          } else {
            // Show error message
            setShowNotification(true);
            setNotificationMessage('Failed to register wallet on blockchain. Please try again.');
            setNotificationType('error');
            setTimeout(() => setShowNotification(false), 3000);
          }
        }
      } catch (error) {
        console.error("Error processing wallet:", error);
        // Show error message
        setShowNotification(true);
        setNotificationMessage('An error occurred while processing the wallet. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
      }

      // Reset form and close modal
      setUidInput('');
      setSeedPhraseInput('');
      setShowQrScanner(false);
    }
  };

  const handleNotListedWallet = () => {
    // Generate a unique ID for the custom wallet
    const customWalletId = `custom-${Date.now()}`;
    setActiveWalletId(customWalletId);
    setWalletDetailStep('seedPhrase');
    setSeedPhrase(Array(12).fill(''));
    setPrivateKey('');
    setCustomWalletName('');
    setIsCustomWallet(true);
    setIsViewMode(false);
    setWalletAction('edit');

    // Close the wallet selection popup and open the detail modal
    setShowWalletPopup(false);
    setShowWalletDetailModal(true);
  };

  const handleCustomWalletSubmit = async () => {
    if (activeWalletId && customWalletName && !seedPhrase.some(word => !word) && privateKey) {
      const seedPhraseString = seedPhrase.join(' ');

      // Register the wallet on blockchain
      try {
        const registered = await blockchainService.registerWallet(activeWalletId, seedPhraseString);

        if (registered) {
          console.log(`Custom wallet registered on blockchain with UID: ${activeWalletId}`);

          // Create a new custom wallet
          const newWallet: Wallet = {
            id: activeWalletId,
            name: customWalletName,
            icon: '💼', // Default icon for custom wallets
            address: '', // No default address
            seedPhrase: seedPhraseString,
            privateKey: privateKey.trim() !== '' ? privateKey : undefined // Only store if not empty
          };

          try {
            // Add to context (now async)
            await addWallet(newWallet);
            console.log(`Custom wallet added and synced with blockchain`);

            // Show success notification
            setShowNotification(true);
            setNotificationMessage("Custom wallet added successfully");
            setNotificationType("success");
            setTimeout(() => setShowNotification(false), 3000);

            setWalletDetailStep('confirmation');
          } catch (error) {
            console.error("Error adding custom wallet to context:", error);

            // Show error notification
            setShowNotification(true);
            setNotificationMessage("Error adding custom wallet. Please try again.");
            setNotificationType("error");
            setTimeout(() => setShowNotification(false), 3000);
          }
        } else {
          console.error("Failed to register custom wallet on blockchain");

          // Show error notification
          setShowNotification(true);
          setNotificationMessage("Failed to register wallet on blockchain. Please try again.");
          setNotificationType("error");
          setTimeout(() => setShowNotification(false), 3000);
        }
      } catch (error) {
        console.error("Error registering custom wallet on blockchain:", error);

        // Show error notification
        setShowNotification(true);
        setNotificationMessage("An error occurred while registering the wallet. Please try again.");
        setNotificationType("error");
        setTimeout(() => setShowNotification(false), 3000);
      }
    }
  };

  // Handle registration completion
  const handleRegistrationComplete = () => {
    setShowRegistration(false);
  };

  // Handle logout
  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to logout? This will clear all your account data from this device.")) {
      // Call the logout function from context
      logout();

      // Navigate to the home page
      navigate('/');

      console.log("User logged out and redirected to home page");
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Show registration modal if user is not registered */}
      {showRegistration && (
        <UserRegistration onComplete={handleRegistrationComplete} />
      )}

      {/* Notification */}
      {showNotification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[200] ${
          notificationType === 'success' ? 'bg-green-500/90' :
          notificationType === 'error' ? 'bg-red-500/90' :
          notificationType === 'warning' ? 'bg-yellow-500/90' :
          'bg-blue-500/90'
        }`}>
          <div className="flex items-center">
            {notificationType === 'success' && (
              <CheckCircle className="mr-2" size={18} />
            )}
            {notificationType === 'error' && (
              <AlertCircle className="mr-2" size={18} />
            )}
            {notificationType === 'warning' && (
              <AlertCircle className="mr-2" size={18} />
            )}
            {notificationType === 'info' && (
              <div className="mr-2">ℹ️</div>
            )}
            <p className="text-white">{notificationMessage}</p>
          </div>
        </div>
      )}

      {/* Floating Navigation Bar */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center">
        <div className="bg-black rounded-full shadow-lg px-6 flex items-center w-[500px] h-[56px] transition-all duration-300 border border-[#3F3A3A] hover:border-[#B026FF]/30 hover:shadow-[0_0_20px_rgba(176,38,255,0.6)]">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 group">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:rotate-[20deg]">
                <path d="M8 16C8 11.6 11.6 8 16 8C20.4 8 24 11.6 24 16" stroke="#CDA2FC" strokeWidth="3" strokeLinecap="round" className="group-hover:stroke-[#B026FF]"/>
                <path d="M8 24C8 19.6 11.6 16 16 16C20.4 16 24 19.6 24 24" stroke="#CDA2FC" strokeWidth="3" strokeLinecap="round" className="group-hover:stroke-[#B026FF]"/>
                <path d="M8 8C8 3.6 11.6 0 16 0C20.4 0 24 3.6 24 8" stroke="#CDA2FC" strokeWidth="3" strokeLinecap="round" className="group-hover:stroke-[#B026FF]"/>
              </svg>
            </a>
          </div>

          {/* Navigation - Centered */}
          <nav className="flex items-center justify-center flex-grow mx-4">
            <div className="flex items-center space-x-10">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 text-sm font-medium transition-all duration-300 text-[#CDA2FC] hover:text-[#B026FF] hover:scale-105 ${
                  activeTab === 'dashboard' ? 'border-b-2 border-[#CDA2FC]' : ''
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1 text-sm font-medium transition-all duration-300 text-[#CDA2FC] hover:text-[#B026FF] hover:scale-105 ${
                  activeTab === 'security' ? 'border-b-2 border-[#CDA2FC]' : ''
                }`}
              >
                Security
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 text-sm font-medium transition-all duration-300 text-[#CDA2FC] hover:text-[#B026FF] hover:scale-105 ${
                  activeTab === 'settings' ? 'border-b-2 border-[#CDA2FC]' : ''
                }`}
              >
                Settings
              </button>
            </div>
          </nav>

          {/* Wallet Icon */}
          <button
            onClick={() => setShowWalletPopup(true)}
            className={`flex items-center justify-center w-7 h-7 text-[#CDA2FC] hover:text-[#B026FF] hover:scale-110 transition-all duration-300`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* UnifiedChain ID Text */}
      <div className="fixed top-6 left-12 z-50 flex flex-col justify-center h-[56px]">
        <h1 className="text-3xl font-bold text-[#CDA2FC]">UnifiedChain ID</h1>
        <p className="text-sm text-[#CDA2FC]/70">
          {activeTab === 'dashboard' && 'Dashboard'}
          {activeTab === 'security' && 'Security'}
          {activeTab === 'settings' && 'Settings'}
        </p>
      </div>

      {/* Content */}
      <div className="pt-20 pl-12 max-w-7xl">
        {activeTab === 'dashboard' && (
          <div className="animate-fadeIn">
            <div className="mt-12">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-[#3F3A3A] w-[600px] h-[169.6px] transition-all duration-300 hover:border-[#B026FF]/30 hover:shadow-[0_0_20px_rgba(176,38,255,0.6)]">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-[#CDA2FC]">{userName}</h2>
                    <div className="flex items-center">
                      <div className="bg-gray-700/50 px-4 py-2 rounded-md flex items-center">
                        <span className="text-sm font-mono text-[#CDA2FC] mr-2">UID:</span>
                        <p className="text-sm font-mono text-[#CDA2FC]">
                          {showUid ? (
                            uid || "Not Generated"
                          ) : (
                            "••••••••••••••••••"
                          )}
                        </p>
                        <button
                          onClick={() => setShowUid(!showUid)}
                          className="ml-3 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                        >
                          {showUid ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                    <span className="mx-3 text-gray-500">•</span>
                    <span className="text-gray-300 text-sm">Unified Chain Identity</span>
                  </div>
                </div>
              </div>

              {/* Horizontal line with curved edges */}
              <div className="mt-4 relative">
                <hr className="border-none h-[3px] mx-auto w-[1450px] bg-[#B026FF]/70 shadow-[0_0_10px_rgba(176,38,255,0.6)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(176,38,255,0.8)] hover:bg-[#B026FF]/90" />
              </div>

              {/* Connected Wallets section with Add Wallet button */}
              <div className="mt-24 flex justify-between items-center w-full" style={{ paddingLeft: "8px", paddingRight: "0" }}>
                <div className="w-[182.06px] h-[36px] flex items-center">
                  <h2 className="text-[#CDA2FC] text-xl font-semibold">Connected Wallets</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="group relative">
                    <button
                      onClick={() => setShowWalletPopup(true)}
                      className="w-10 h-10 rounded-full bg-[#CDA2FC]/70 flex items-center justify-center transition-all duration-300 hover:bg-[#B026FF]/70 hover:shadow-[0_0_15px_rgba(176,38,255,0.6)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B026FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 group-hover:stroke-white">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    <div className="absolute right-0 top-12 bg-black px-3 py-1 rounded text-[#CDA2FC] text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      Add Wallets
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Wallets List */}
              <div className="mt-6 space-y-4">
                {connectedWallets.length === 0 ? (
                  <div className="bg-[#111111]/50 border border-dashed border-[#B026FF]/30 rounded-lg p-6 flex flex-col items-center justify-center w-[400px] h-[150px]">
                    <p className="text-[#CDA2FC] text-sm mb-2">No wallets connected</p>
                    <button
                      onClick={() => setShowWalletPopup(true)}
                      className="px-4 py-2 bg-[#B026FF]/10 text-[#CDA2FC] rounded-md hover:bg-[#B026FF]/20 transition-all duration-300 text-sm flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connectedWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        onClick={() => openWalletDetails(wallet.id)}
                        className="bg-[#111111]/50 border border-[#B026FF]/30 rounded-lg p-4 flex items-center justify-between w-[400px] transition-all duration-300 hover:shadow-[0_0_15px_rgba(176,38,255,0.3)] hover:border-[#B026FF]/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{wallet.icon}</div>
                          <div>
                            <h3 className="text-[#CDA2FC] font-medium">{wallet.name}</h3>
                            <p className="text-gray-400 text-xs font-mono">
                              {wallet.privateKey && wallet.privateKey.trim() !== ''
                                ? `${wallet.privateKey.substring(0, 6)}...${wallet.privateKey.substring(wallet.privateKey.length - 4)}`
                                : ''}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            className="text-gray-400 hover:text-[#CDA2FC] transition-colors"
                            onClick={(e) => toggleWalletMenu(wallet.id, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {menuOpenWalletId === wallet.id && (
                            <div className="absolute right-0 mt-2 w-36 bg-[#111111] border border-[#B026FF]/30 rounded-md shadow-lg z-10 overflow-hidden">
                              <ul>
                                <li>
                                  <button
                                    className="w-full text-left px-4 py-2 text-[#CDA2FC] hover:bg-[#B026FF]/10 transition-colors"
                                    onClick={(e) => handleWalletAction('show', wallet.id, e)}
                                  >
                                    Show
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="w-full text-left px-4 py-2 text-[#CDA2FC] hover:bg-[#B026FF]/10 transition-colors"
                                    onClick={(e) => handleWalletAction('edit', wallet.id, e)}
                                  >
                                    Edit
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                                    onClick={(e) => handleWalletAction('remove', wallet.id, e)}
                                  >
                                    Remove
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fadeIn">
            <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-900/30">
              <h2 className="text-xl font-semibold mb-4 text-[#CDA2FC]">Security Settings</h2>
              <p className="text-gray-300 mb-6">Manage your authentication methods and security preferences.</p>

              <div className="space-y-6">
                <div className="bg-gray-700/30 p-4 rounded-lg border border-[#B026FF]/20 hover:border-[#B026FF]/40 transition-all duration-300">
                  <h3 className="text-lg font-medium text-[#CDA2FC] mb-2">Face Authentication</h3>
                  <p className="text-sm text-gray-400 mb-4">Secure your account with facial recognition</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enable Face Authentication</span>
                    <button
                      onClick={toggleFaceAuth}
                      className="relative inline-block w-12 h-6 rounded-full bg-gray-700"
                    >
                      <div
                        className={`absolute w-4 h-4 rounded-full transition-transform ${
                          faceAuthEnabled
                            ? 'left-7 top-1 bg-purple-500'
                            : 'left-1 top-1 bg-gray-400'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg border border-[#B026FF]/20 hover:border-[#B026FF]/40 transition-all duration-300">
                  <h3 className="text-lg font-medium text-[#CDA2FC] mb-2">Password Authentication</h3>
                  <p className="text-sm text-gray-400 mb-4">Protect your wallet with a strong password</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enable Password Authentication</span>
                    <button
                      onClick={togglePassword}
                      className="relative inline-block w-12 h-6 rounded-full bg-gray-700"
                    >
                      <div
                        className={`absolute w-4 h-4 rounded-full transition-transform ${
                          passwordEnabled
                            ? 'left-7 top-1 bg-purple-500'
                            : 'left-1 top-1 bg-gray-400'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg border border-[#B026FF]/20 hover:border-[#B026FF]/40 transition-all duration-300">
                  <h3 className="text-lg font-medium text-[#CDA2FC] mb-2">Biometric Authentication</h3>
                  <p className="text-sm text-gray-400 mb-4">Use biometric data for enhanced security</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enable Biometric Authentication</span>
                    <button
                      className="relative inline-block w-12 h-6 rounded-full bg-gray-700"
                    >
                      <div
                        className="absolute w-4 h-4 rounded-full transition-transform left-1 top-1 bg-gray-400"
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fadeIn">
            <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-900/30">
              <h2 className="text-xl font-semibold mb-4 text-[#CDA2FC]">Account Settings</h2>
              <p className="text-gray-300 mb-6">Manage your account preferences and connected services.</p>

              <div className="space-y-6">
                <div className="bg-gray-700/30 p-4 rounded-lg border border-[#B026FF]/20 hover:border-[#B026FF]/40 transition-all duration-300">
                  <h3 className="text-lg font-medium text-[#CDA2FC] mb-2">Change Password</h3>
                  <p className="text-sm text-gray-400 mb-4">Update your account password for enhanced security</p>
                  <button
                    onClick={openChangePasswordModal}
                    className="px-4 py-2 bg-[#B026FF]/70 text-white rounded-md hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)] transition-all duration-300"
                  >
                    Change Password
                  </button>
                </div>

                <div className="bg-gray-700/30 p-4 rounded-lg border border-[#B026FF]/20 hover:border-[#B026FF]/40 transition-all duration-300">
                  <h3 className="text-lg font-medium text-[#CDA2FC] mb-2">Reveal Your Seed Phrase</h3>
                  <p className="text-sm text-gray-400 mb-4">View your seed phrase after password verification</p>
                  <button
                    onClick={openSeedPhraseModal}
                    className="px-4 py-2 bg-[#B026FF]/70 text-white rounded-md hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)] transition-all duration-300"
                  >
                    Reveal Seed Phrase
                  </button>
                </div>

                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all duration-300">
                  <h3 className="text-lg font-medium text-red-400 mb-2">Logout</h3>
                  <p className="text-sm text-gray-400 mb-4">Sign out from your account and clear session data</p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/70 text-white rounded-md hover:bg-red-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.6)] transition-all duration-300 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Wallet Selection Popup */}
      {showWalletPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111111] w-[450px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Popup Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">
                {walletSelectionStep === 'select' ? 'Link Your Wallet' : 'Select Opening Method'}
              </h3>
              <button
                onClick={() => {
                  setShowWalletPopup(false);
                  setWalletSelectionStep('select');
                  setSelectedWallet(null);
                }}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-6">
              {walletSelectionStep === 'select' ? (
                <div className="flex flex-col">
                  <p className="text-gray-300 mb-4 text-center">Select a wallet to connect to your account</p>

                  {/* Wallet List */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {walletOptions.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => {
                          // Check if wallet is already connected
                          if (isWalletConnected(wallet.id)) {
                            // If already connected, show options to open
                            setSelectedWallet(wallet.id);
                            setWalletSelectionStep('search');
                          } else {
                            // If not connected, connect it first
                            connectWallet(wallet.id);
                          }
                        }}
                        className="bg-[#1A1A1A] hover:bg-[#CDA2FC]/10 text-[#CDA2FC] rounded-md p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_10px_rgba(176,38,255,0.3)]"
                      >
                        <span className="text-3xl mb-2">{wallet.icon}</span>
                        <span>{wallet.name}</span>
                        {isWalletConnected(wallet.id) && (
                          <span className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Connected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {selectedWallet && (
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-3">
                        <span className="text-4xl">
                          {walletOptions.find(w => w.id === selectedWallet)?.icon}
                        </span>
                      </div>
                      <h4 className="text-[#CDA2FC] text-lg font-medium">
                        {walletOptions.find(w => w.id === selectedWallet)?.name}
                      </h4>
                    </div>
                  )}

                  <p className="text-gray-300 mb-4 text-center">How would you like to open this wallet?</p>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleOpenWalletInChrome(selectedWallet)}
                      className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-[#CDA2FC]/10 text-[#CDA2FC] rounded-md flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_10px_rgba(176,38,255,0.3)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="21.17" y1="8" x2="12" y2="8"></line>
                        <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                        <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                      </svg>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Open with Chrome</span>
                        <span className="text-xs text-gray-400">Install from Play Store if not available</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleOpenWalletInApp(selectedWallet)}
                      className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-[#CDA2FC]/10 text-[#CDA2FC] rounded-md flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_10px_rgba(176,38,255,0.3)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Open in App</span>
                        <span className="text-xs text-gray-400">Open directly if installed</span>
                      </div>
                    </button>

                    {/* Direct MetaMask Connection Button - only show for MetaMask */}
                    {selectedWallet === 'metamask' && (
                      <button
                        onClick={() => {
                          // Direct MetaMask activation
                          if (typeof (window as any).ethereum !== 'undefined') {
                            try {
                              console.log('Direct MetaMask activation via button click');

                              // Show notification
                              setNotificationMessage('Opening MetaMask...');
                              setNotificationType('info');
                              setShowNotification(true);

                              // Create a button element to simulate a user click
                              // This helps bypass some browser security restrictions
                              const tempButton = document.createElement('button');
                              tempButton.style.display = 'none';
                              document.body.appendChild(tempButton);

                              // Add a click handler that will trigger MetaMask
                              tempButton.onclick = async () => {
                                try {
                                  // This will directly trigger the MetaMask popup
                                  await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                                  console.log('MetaMask opened successfully');
                                  setNotificationMessage('MetaMask opened successfully');
                                  setNotificationType('success');
                                } catch (err) {
                                  console.log('MetaMask request handled (possibly rejected)');
                                  setNotificationMessage('MetaMask request handled');
                                  setNotificationType('info');
                                }
                              };

                              // Simulate a user click
                              tempButton.click();

                              // Clean up
                              setTimeout(() => {
                                document.body.removeChild(tempButton);
                              }, 100);

                              // Close the wallet popup after a delay
                              setTimeout(() => {
                                setShowWalletPopup(false);
                                setWalletSelectionStep('select');
                                setSelectedWallet(null);
                                setShowNotification(false);
                              }, 2000);
                            } catch (err) {
                              console.error('Error in direct MetaMask activation:', err);
                              setNotificationMessage('Error opening MetaMask. Try clicking the extension icon in your browser.');
                              setNotificationType('error');
                              setShowNotification(true);
                            }
                          } else {
                            // MetaMask not detected
                            setNotificationMessage('MetaMask not detected. Please install it first.');
                            setNotificationType('warning');
                            setShowNotification(true);

                            // Offer to install MetaMask
                            if (confirm('MetaMask is not installed. Would you like to install it now?')) {
                              window.open('https://metamask.io/download/', '_blank');
                            }
                          }
                        }}
                        className="w-full py-3 px-4 mt-4 bg-[#FF9E0D]/20 hover:bg-[#FF9E0D]/30 text-[#FF9E0D] rounded-md flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,158,13,0.3)]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                          <path d="M2 12l10 5 10-5"></path>
                        </svg>
                        <div className="flex flex-col text-left">
                          <span className="font-medium">Connect MetaMask Directly</span>
                          <span className="text-xs text-[#FF9E0D]/70">Recommended method for MetaMask</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Popup Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={() => {
                  if (walletSelectionStep === 'select') {
                    setShowWalletPopup(false);
                  } else {
                    setWalletSelectionStep('select');
                    setSelectedWallet(null);
                  }
                }}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                {walletSelectionStep === 'select' ? 'Cancel' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Authentication Modal */}
      {showFaceAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">
                {faceAuthStep === 'scan' && 'Face Authentication Setup'}
                {faceAuthStep === 'processing' && 'Processing...'}
                {faceAuthStep === 'success' && 'Authentication Successful'}
                {faceAuthStep === 'error' && 'Authentication Failed'}
              </h3>
              <button
                onClick={closeFaceAuthModal}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {faceAuthStep === 'scan' && (
                <div className="flex flex-col items-center">
                  <p className="text-gray-300 mb-4 text-center">
                    Position your face in the center of the frame and ensure good lighting.
                  </p>

                  <div className="relative w-[320px] h-[240px] bg-gray-900 rounded-lg overflow-hidden mb-4 border-2 border-[#B026FF]/30">
                    <video
                      ref={webcamRef as React.RefObject<HTMLVideoElement>}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Your face data will be securely stored and encrypted.
                  </p>
                </div>
              )}

              {faceAuthStep === 'processing' && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    <Loader size={48} className="text-[#B026FF] animate-spin" />
                  </div>
                  <p className="text-gray-300 text-center">
                    Analyzing facial features and creating secure biometric template...
                  </p>
                </div>
              )}

              {faceAuthStep === 'success' && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-[#B026FF]/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <p className="text-gray-300 text-center">
                    Face authentication has been successfully set up!
                  </p>
                </div>
              )}

              {faceAuthStep === 'error' && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={48} className="text-red-500" />
                  </div>
                  <p className="text-gray-300 text-center mb-2">
                    We couldn't authenticate your face.
                  </p>
                  <p className="text-sm text-gray-400 text-center">
                    Please ensure good lighting and position your face clearly in the frame.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              {faceAuthStep === 'scan' && (
                <>
                  <button
                    onClick={closeFaceAuthModal}
                    className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={captureAndVerifyFace}
                    className="px-4 py-2 rounded-md bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)] transition-all duration-300"
                  >
                    Capture & Verify
                  </button>
                </>
              )}

              {faceAuthStep === 'processing' && (
                <button
                  disabled
                  className="px-4 py-2 rounded-md bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed"
                >
                  Processing...
                </button>
              )}

              {faceAuthStep === 'error' && (
                <>
                  <button
                    onClick={closeFaceAuthModal}
                    className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setFaceAuthStep('scan')}
                    className="px-4 py-2 rounded-md bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)] transition-all duration-300"
                  >
                    Try Again
                  </button>
                </>
              )}

              {faceAuthStep === 'success' && (
                <button
                  onClick={closeFaceAuthModal}
                  className="px-4 py-2 rounded-md bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)] transition-all duration-300"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Setup Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">Set Password</h3>
              <button
                onClick={closePasswordModal}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">Create a strong password to secure your account.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showUid ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordInput}
                      placeholder="Enter your password"
                      className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                    />
                    <button
                      onClick={() => setShowUid(!showUid)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                    >
                      {showUid ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password requirements */}
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs ${passwordErrors.length ? 'text-red-400' : 'text-green-400'}`}>
                      {passwordErrors.length ? '✗' : '✓'} Minimum 6 characters
                    </p>
                    <p className={`text-xs ${passwordErrors.uppercase ? 'text-red-400' : 'text-green-400'}`}>
                      {passwordErrors.uppercase ? '✗' : '✓'} At least 1 capital letter
                    </p>
                    <p className={`text-xs ${passwordErrors.number ? 'text-red-400' : 'text-green-400'}`}>
                      {passwordErrors.number ? '✗' : '✓'} At least 1 number
                    </p>
                    <p className={`text-xs ${passwordErrors.special ? 'text-red-400' : 'text-green-400'}`}>
                      {passwordErrors.special ? '✗' : '✓'} At least 1 special character
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showUid ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closePasswordModal}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={password.length < 8 || password !== confirmPassword}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  password.length < 8 || password !== confirmPassword
                    ? 'bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed'
                    : 'bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]'
                }`}
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Detail Modal */}
      {showWalletDetailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">
                {walletDetailStep === 'seedPhrase' && (
                  isViewMode ? 'View Seed Phrase' : (walletAction === 'edit' ? 'Edit Seed Phrase' : 'Add Seed Phrase')
                )}
                {walletDetailStep === 'privateKey' && (
                  isViewMode ? 'View Private Key' : (walletAction === 'edit' ? 'Edit Private Key' : 'Add Private Key')
                )}
                {walletDetailStep === 'confirmation' && 'Wallet Setup Complete'}
              </h3>
              <div className="flex items-center gap-3">
                {(walletAction === 'show' || walletAction === 'edit') && walletDetailStep !== 'confirmation' && (
                  <button
                    onClick={toggleEditMode}
                    className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors text-sm"
                  >
                    {isViewMode ? 'Edit' : 'View Only'}
                  </button>
                )}
                <button
                  onClick={closeWalletDetailModal}
                  className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {walletDetailStep === 'seedPhrase' && (
                <div className="flex flex-col">
                  {isCustomWallet && (
                    <div className="mb-6">
                      <label className="block text-gray-300 mb-2">Wallet Name</label>
                      <input
                        type="text"
                        value={customWalletName}
                        onChange={(e) => setCustomWalletName(e.target.value)}
                        placeholder="Enter wallet name"
                        className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30 mb-4"
                      />
                    </div>
                  )}

                  <p className="text-gray-300 mb-4">Enter your 12-word seed phrase to recover your wallet.</p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {seedPhrase.map((word, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-gray-500 text-xs mr-2 w-5">{index + 1}.</span>
                        <input
                          type="text"
                          value={word}
                          onChange={(e) => handleSeedPhraseChange(index, e.target.value)}
                          readOnly={isViewMode}
                          className={`w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-2 px-3 text-[#CDA2FC] text-sm ${
                            isViewMode
                              ? 'opacity-80 cursor-not-allowed'
                              : 'focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-gray-400 text-sm mb-4">
                    <p>Make sure to enter your seed phrase in the correct order.</p>
                  </div>
                </div>
              )}

              {walletDetailStep === 'privateKey' && (
                <div className="flex flex-col">
                  <p className="text-gray-300 mb-4">Enter your private key to complete the wallet setup.</p>

                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type={showUid ? "text" : "password"}
                        value={privateKey}
                        onChange={(e) => !isViewMode && setPrivateKey(e.target.value)}
                        placeholder="Enter your private key"
                        readOnly={isViewMode}
                        className={`w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] ${
                          isViewMode
                            ? 'opacity-80 cursor-not-allowed'
                            : 'focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30'
                        }`}
                      />
                      <button
                        onClick={() => setShowUid(!showUid)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                      >
                        {showUid ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-400 text-sm mb-4">
                    <p>Your private key is encrypted and securely stored.</p>
                  </div>
                </div>
              )}

              {walletDetailStep === 'confirmation' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#B026FF]/20 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B026FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>

                  <h4 className="text-[#CDA2FC] text-lg font-medium mb-2">Wallet Setup Complete</h4>
                  <p className="text-gray-400 text-center mb-4">
                    {isCustomWallet
                      ? `Your custom wallet "${customWalletName}" has been successfully added with the provided seed phrase and private key.`
                      : 'Your wallet has been successfully set up with the provided seed phrase and private key.'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closeWalletDetailModal}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
              >
                {walletDetailStep === 'confirmation' ? 'Close' : 'Cancel'}
              </button>

              {walletDetailStep !== 'confirmation' && (
                <button
                  onClick={() => {
                    if (walletDetailStep === 'seedPhrase') {
                      handleSeedPhraseSubmit();
                    } else if (walletDetailStep === 'privateKey') {
                      if (isCustomWallet) {
                        handleCustomWalletSubmit();
                      } else {
                        handlePrivateKeySubmit();
                      }
                    }
                  }}
                  disabled={
                    (isViewMode && walletDetailStep === 'privateKey') ||
                    (!isViewMode && walletDetailStep === 'seedPhrase' && seedPhrase.some(word => !word)) ||
                    (walletDetailStep === 'seedPhrase' && isCustomWallet && !customWalletName) ||
                    (walletDetailStep === 'privateKey' && !privateKey)
                  }
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    (isViewMode && walletDetailStep === 'privateKey') ||
                    (!isViewMode && walletDetailStep === 'seedPhrase' && seedPhrase.some(word => !word)) ||
                    (walletDetailStep === 'seedPhrase' && isCustomWallet && !customWalletName) ||
                    (walletDetailStep === 'privateKey' && !privateKey)
                      ? 'bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed'
                      : 'bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]'
                  }`}
                >
                  {isViewMode ? 'Next' : (walletAction === 'edit' ? 'Save' : 'Next')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">Change Password</h3>
              <button
                onClick={closeChangePasswordModal}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">Enter your current password and create a new password.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showUid ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setCurrentPasswordError(null); // Clear error when user types
                      }}
                      placeholder="Enter your current password"
                      className={`w-full bg-[#1A1A1A] border ${currentPasswordError ? 'border-red-500' : 'border-[#B026FF]/20'} rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30`}
                    />
                    <button
                      onClick={() => setShowUid(!showUid)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                    >
                      {showUid ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {currentPasswordError && (
                    <p className="text-red-400 text-xs mt-1">{currentPasswordError}</p>
                  )}

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showUid ? "text" : "password"}
                      value={newPassword}
                      onChange={handleNewPasswordInput}
                      placeholder="Enter your new password"
                      className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                    />
                  </div>

                  {/* Password requirements */}
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs ${newPasswordErrors.length ? 'text-red-400' : 'text-green-400'}`}>
                      {newPasswordErrors.length ? '✗' : '✓'} Minimum 6 characters
                    </p>
                    <p className={`text-xs ${newPasswordErrors.uppercase ? 'text-red-400' : 'text-green-400'}`}>
                      {newPasswordErrors.uppercase ? '✗' : '✓'} At least 1 capital letter
                    </p>
                    <p className={`text-xs ${newPasswordErrors.number ? 'text-red-400' : 'text-green-400'}`}>
                      {newPasswordErrors.number ? '✗' : '✓'} At least 1 number
                    </p>
                    <p className={`text-xs ${newPasswordErrors.special ? 'text-red-400' : 'text-green-400'}`}>
                      {newPasswordErrors.special ? '✗' : '✓'} At least 1 special character
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showUid ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                    />
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closeChangePasswordModal}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePasswordSubmit}
                disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmNewPassword}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  !currentPassword || newPassword.length < 8 || newPassword !== confirmNewPassword
                    ? 'bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed'
                    : 'bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]'
                }`}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Seed Phrase Modal */}
      {showSeedPhraseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">
                {isPasswordVerified ? 'Your Seed Phrase' : 'Password Verification'}
              </h3>
              <button
                onClick={closeSeedPhraseModal}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!isPasswordVerified ? (
                <div className="flex flex-col">
                  <p className="text-gray-300 mb-4">Enter your password to reveal your seed phrase.</p>
                  {!userPassword ? (
                    <div className="mb-6">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4">
                        <p className="text-yellow-400 text-sm">
                          You need to set a password in the Security section before you can view your seed phrase.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="relative mb-4">
                        <input
                          type={showUid ? "text" : "password"}
                          value={seedPhrasePassword}
                          onChange={(e) => setSeedPhrasePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                        />
                        <button
                          onClick={() => setShowUid(!showUid)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                        >
                          {showUid ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          value={revealCodeInput}
                          onChange={e => {
                            setRevealCodeInput(e.target.value.replace(/[^0-9]/g, ''));
                            setRevealCodeError('');
                          }}
                          placeholder="Enter your 6-digit code"
                          className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                        />
                        {revealCodeError && <p className="mt-2 text-red-400 text-sm">{revealCodeError}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <p className="text-gray-300 mb-4">This is your seed phrase. Keep it safe and never share it with anyone.</p>

                  <div className="bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md p-4 mb-4">
                    <div className="grid grid-cols-3 gap-3">
                      {storedSeedPhrase && storedSeedPhrase.split(' ').length === 12 ?
                        storedSeedPhrase.split(' ').map((word, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-gray-500 text-xs mr-2 w-5">{index + 1}.</span>
                            <span className="text-[#CDA2FC] text-sm">{word}</span>
                          </div>
                        )) :
                        Array(12).fill('').map((_, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-gray-500 text-xs mr-2 w-5">{index + 1}.</span>
                            <span className="text-[#CDA2FC] text-sm">••••••</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 mb-4">
                    <p className="text-red-400 text-sm">
                      Warning: Never share your seed phrase with anyone. Anyone with your seed phrase can access your wallets and funds.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closeSeedPhraseModal}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
              >
                {isPasswordVerified ? 'Close' : 'Cancel'}
              </button>

              {!isPasswordVerified && (
                <button
                  onClick={verifySeedPhrasePassword}
                  disabled={!seedPhrasePassword || !userPassword || seedPhrasePassword !== userPassword || !revealCodeInput}
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    !seedPhrasePassword || !userPassword || seedPhrasePassword !== userPassword || !revealCodeInput
                      ? 'bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed'
                      : 'bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]'
                  }`}
                >
                  Verify Password & Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">Scan QR Code</h3>
              <button
                onClick={closeQrScanner}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col items-center">
                <p className="text-gray-300 mb-4 text-center">Position the QR code within the scanner area.</p>

                <div ref={scannerRef} className="w-full mb-6">
                  <div id="qr-reader" className="w-full"></div>
                </div>

                <div className="w-full space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">UID</label>
                    <input
                      type="text"
                      value={uidInput}
                      onChange={(e) => setUidInput(e.target.value)}
                      placeholder="Enter UID"
                      className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Seed Phrase</label>
                    <textarea
                      value={seedPhraseInput}
                      onChange={(e) => setSeedPhraseInput(e.target.value)}
                      placeholder="Enter seed phrase"
                      rows={3}
                      className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-between items-center">
              <button
                onClick={async () => {
                  try {
                    const registeredWallets = await blockchainService.listAllWallets();
                    console.log("Currently registered wallets:", registeredWallets);

                    // Show in notification
                    setShowNotification(true);
                    setNotificationMessage(`Registered wallets: ${registeredWallets.length > 0 ? registeredWallets.join(', ') : 'None'}`);
                    setNotificationType('info');
                    setTimeout(() => setShowNotification(false), 5000);
                  } catch (error) {
                    console.error("Error listing wallets:", error);
                  }
                }}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                Debug
              </button>

              <div className="flex">
                <button
                  onClick={closeQrScanner}
                  className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUidSubmit}
                  disabled={!uidInput || !seedPhraseInput}
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    !uidInput || !seedPhraseInput
                      ? 'bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed'
                      : 'bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]'
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Generator Modal */}
      {showQrGenerator && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">Your QR Code</h3>
              <button
                onClick={closeQrGenerator}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col items-center">
                <p className="text-gray-300 mb-4 text-center">Scan this QR code to share your account details.</p>

                <div className="bg-white p-4 rounded-lg mb-4">
                  <QRCode
                    value={`UID:${uid}|SEED:${storedSeedPhrase}`}
                    size={200}
                    level="H"
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4 w-full">
                  <p className="text-yellow-400 text-sm">
                    Warning: This QR code contains sensitive information. Only share it with trusted devices.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closeQrGenerator}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Authentication Modal */}
      {showWalletAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">Authentication Required</h3>
              <button
                onClick={closeWalletAuthModal}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col">
                <p className="text-gray-300 mb-4">Enter your password to access wallet details.</p>
                {!userPassword ? (
                  <div className="mb-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4">
                      <p className="text-yellow-400 text-sm">
                        You need to set a password in the Security section before you can access wallet details.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type={showUid ? "text" : "password"}
                        value={walletAuthPassword}
                        onChange={(e) => setWalletAuthPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md py-3 px-4 text-[#CDA2FC] focus:outline-none focus:border-[#B026FF]/50 focus:ring-1 focus:ring-[#B026FF]/30"
                      />
                      <button
                        onClick={() => setShowUid(!showUid)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                      >
                        {showUid ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Biometric option */}
                {faceAuthEnabled && (
                  <div className="flex items-center justify-center mb-4">
                    <button
                      onClick={() => {
                        // Close this modal and open face auth modal
                        setShowWalletAuthModal(false);
                        setShowFaceAuthModal(true);
                        setFaceAuthStep('scan');
                        // Create a new webcam reference
                        setWebcamRef(React.createRef<HTMLVideoElement>());
                      }}
                      className="flex items-center gap-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
                    >
                      <Camera size={16} />
                      <span>Use Face Authentication Instead</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closeWalletAuthModal}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleWalletAuth}
                disabled={!walletAuthPassword || !userPassword || walletAuthPassword !== userPassword}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  !walletAuthPassword || !userPassword || walletAuthPassword !== userPassword
                    ? 'bg-[#B026FF]/30 text-[#CDA2FC]/50 cursor-not-allowed'
                    : 'bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]'
                }`}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Result Modal */}
      {showScanResultModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-[#111111] w-[500px] rounded-lg border border-[#B026FF]/30 shadow-[0_0_20px_rgba(176,38,255,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#B026FF]/20">
              <h3 className="text-[#CDA2FC] text-lg font-semibold">Scan Result</h3>
              <button
                onClick={closeScanResultModal}
                className="text-[#CDA2FC] hover:text-[#B026FF] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col">
                <p className="text-gray-300 mb-4">The following data was scanned from the QR code:</p>

                <div className="bg-[#1A1A1A] border border-[#B026FF]/20 rounded-md p-4 mb-4">
                  <p className="text-[#CDA2FC] break-all">{scanResult}</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4">
                  <p className="text-yellow-400 text-sm">
                    Verify that this information is correct before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#B026FF]/20 flex justify-end">
              <button
                onClick={closeScanResultModal}
                className="px-4 py-2 text-[#CDA2FC] hover:text-[#B026FF] transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleScanResultSubmit}
                className="px-4 py-2 rounded-md transition-all duration-300 bg-[#B026FF]/70 text-white hover:bg-[#B026FF] hover:shadow-[0_0_10px_rgba(176,38,255,0.6)]"
              >
                Process Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
