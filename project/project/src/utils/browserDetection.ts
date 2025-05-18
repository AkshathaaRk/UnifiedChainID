/**
 * Utility functions for browser detection and app installation checking
 */

/**
 * Check if the current browser is Brave
 * @returns Promise that resolves to true if the browser is Brave, false otherwise
 */
export const isBraveBrowser = async (): Promise<boolean> => {
  // Brave browser has a specific navigator property
  if ((navigator as any).brave && (navigator as any).brave.isBrave) {
    try {
      // Brave's isBrave() returns a Promise that resolves to true
      return await (navigator as any).brave.isBrave();
    } catch (error) {
      console.error('Error checking for Brave browser:', error);
      return false;
    }
  }

  // Alternative detection method
  // Brave modifies the user agent and has specific behavior with certain APIs
  try {
    // Check for Brave's fingerprinting protection
    const isHeadlessUA = navigator.userAgent.includes('Headless');
    const isChromium = navigator.userAgent.includes('Chrome');
    const isNotChrome = !navigator.userAgent.includes('Google Chrome');

    // If it's Chromium-based but not Chrome and not a headless browser, it might be Brave
    if (isChromium && isNotChrome && !isHeadlessUA) {
      // Additional check: Brave blocks certain fingerprinting APIs
      // We can try to detect this behavior
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Draw something that would be affected by Brave's fingerprinting protection
      canvas.width = 2;
      canvas.height = 2;
      ctx.fillStyle = '#f00';
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(1, 0, 1, 1);
      ctx.fillStyle = '#00f';
      ctx.fillRect(0, 1, 1, 1);
      ctx.fillStyle = '#ff0';
      ctx.fillRect(1, 1, 1, 1);

      // Get the image data
      const imageData = ctx.getImageData(0, 0, 2, 2);

      // In Brave with strict fingerprinting protection, this might be modified
      // This is a heuristic and not 100% reliable
      const data = imageData.data;
      const isFingerprintingProtected =
        data[0] === data[4] &&
        data[8] === data[12] &&
        data[0] === data[8];

      return isFingerprintingProtected;
    }
  } catch (error) {
    console.error('Error in alternative Brave detection:', error);
  }

  return false;
};

/**
 * Check if Chrome browser
 * @returns true if the browser is Chrome, false otherwise
 */
export const isChromeBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('chrome') && !userAgent.includes('edg') && !userAgent.includes('opr');
};

/**
 * Check if a wallet app is installed by attempting to open its URL scheme
 * @param appScheme The URL scheme for the wallet app (e.g., 'metamask://')
 * @returns Promise that resolves to true if the app is installed, false otherwise
 */
export const isAppInstalled = (appScheme: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Record the time before trying to open the app
    const startTime = Date.now();

    // Create a hidden iframe to try opening the app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Set up a timeout to check if the app was opened
    const timeoutId = setTimeout(() => {
      // If we're still here after the timeout, the app is not installed
      document.body.removeChild(iframe);
      resolve(false);
    }, 1000);

    // Try to detect if the app was opened by checking if the page loses focus
    window.addEventListener('blur', function onBlur() {
      // If the page loses focus within a short time, the app might be opening
      if (Date.now() - startTime < 1000) {
        window.removeEventListener('blur', onBlur);
        clearTimeout(timeoutId);
        document.body.removeChild(iframe);
        resolve(true);
      }
    });

    // Try to open the app
    try {
      iframe.src = appScheme;
    } catch (error) {
      // If there's an error, the app is not installed
      clearTimeout(timeoutId);
      document.body.removeChild(iframe);
      resolve(false);
    }
  });
};

/**
 * Check if a wallet is available as a Chrome extension
 * @param extensionId The Chrome extension ID for the wallet
 * @returns Promise that resolves to true if the extension is installed, false otherwise
 */
export const isExtensionInstalled = async (extensionId: string): Promise<boolean> => {
  console.log(`Checking if extension with ID ${extensionId} is installed...`);

  // Create a cache-busting timestamp
  const timestamp = Date.now();

  // Method 1: Direct check for wallet-specific global objects
  // This is the most reliable method for detecting wallet extensions
  try {
    // MetaMask specific check
    if (extensionId === 'nkbihfbeogaeaoehlefnkodbefgpgknn') {
      // MetaMask injects ethereum object
      if (typeof (window as any).ethereum !== 'undefined') {
        // Check if it's actually MetaMask
        if ((window as any).ethereum.isMetaMask) {
          console.log('MetaMask detected via window.ethereum.isMetaMask');
          return true;
        }

        // Even if isMetaMask is not set, it might still be MetaMask
        console.log('Ethereum provider detected, assuming it might be MetaMask');
        return true;
      }

      // Additional check for older MetaMask versions
      if (typeof (window as any).web3 !== 'undefined') {
        console.log('MetaMask detected via window.web3');
        return true;
      }

      // For MetaMask, we'll do an additional check by trying to access a known resource
      try {
        // Create a test image to see if we can access MetaMask resources
        const testImg = new Image();
        testImg.src = `chrome-extension://${extensionId}/images/icon-128.png?t=${timestamp}`;

        const result = await new Promise<boolean>((resolve) => {
          testImg.onload = () => {
            console.log('MetaMask detected via resource test');
            resolve(true);
          };

          testImg.onerror = () => {
            resolve(false);
          };

          // Set a short timeout
          setTimeout(() => resolve(false), 500);
        });

        if (result) return true;
      } catch (e) {
        // Ignore errors in this test
      }
    }

    // Phantom specific check
    if (extensionId === 'bfnaelmomeimhlpmgjnjophhpkkoljpa') {
      if (typeof (window as any).solana !== 'undefined' || typeof (window as any).phantom !== 'undefined') {
        console.log('Phantom detected via window.solana or window.phantom');
        return true;
      }
    }

    // Trust Wallet specific check
    if (extensionId === 'egjidjbpglichdcondbcbdnbeeppgdph') {
      if (typeof (window as any).trustwallet !== 'undefined') {
        console.log('Trust Wallet detected via window.trustwallet');
        return true;
      }
    }

    // OKX Wallet specific check
    if (extensionId === 'mcohilncbfahbmgdjkbpemcciiolgcge') {
      if (typeof (window as any).okxwallet !== 'undefined') {
        console.log('OKX Wallet detected via window.okxwallet');
        return true;
      }
    }
  } catch (error) {
    console.error('Error in direct wallet object detection:', error);
  }

  // Method 2: Check for extension using known provider patterns
  try {
    // Check for ethereum providers array (EIP-1193)
    if (typeof (window as any).ethereum !== 'undefined') {
      // Check for multiple providers
      const providers = (window as any).ethereum.providers;
      if (Array.isArray(providers)) {
        for (const provider of providers) {
          if (
            (extensionId === 'nkbihfbeogaeaoehlefnkodbefgpgknn' && provider.isMetaMask) ||
            (extensionId === 'bfnaelmomeimhlpmgjnjophhpkkoljpa' && provider.isPhantom) ||
            (extensionId === 'egjidjbpglichdcondbcbdnbeeppgdph' && provider.isTrust) ||
            (extensionId === 'mcohilncbfahbmgdjkbpemcciiolgcge' && provider.isOKX)
          ) {
            console.log('Wallet detected via ethereum.providers array');
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking provider patterns:', error);
  }

  // Method 3: Check for extension using chrome extension API
  // This is less reliable due to browser security restrictions
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      // Try to check if extension is installed using chrome.extension API
      if (chrome.extension && chrome.extension.getURL) {
        try {
          // This will throw if extension is not installed
          const url = chrome.extension.getURL(`chrome-extension://${extensionId}/manifest.json`);
          console.log(`Extension detected via chrome.extension.getURL: ${url}`);
          return true;
        } catch (e) {
          // Extension not found via this method
        }
      }
    } catch (error) {
      console.error('Error in chrome extension API check:', error);
    }
  }

  // Method 4: Check for extension using image resource with multiple paths
  // This is a fallback method that works in some browsers
  try {
    // Different extensions have different icon paths
    const extensionPaths: Record<string, string[]> = {
      'nkbihfbeogaeaoehlefnkodbefgpgknn': [
        'images/icon-128.png',
        'images/icon-48.png',
        'images/icon-16.png',
        'images/metamask-fox.svg',
        'app/images/icon-128.png'
      ],
      'bfnaelmomeimhlpmgjnjophhpkkoljpa': [
        'assets/icon-128.png',
        'icon-128.png',
        'icon.png',
        'assets/logo.svg'
      ],
      'egjidjbpglichdcondbcbdnbeeppgdph': [
        'icon-128.png',
        'assets/icon-128.png',
        'images/icon.png',
        'assets/images/icon.png'
      ],
      'mcohilncbfahbmgdjkbpemcciiolgcge': [
        'images/icon-128.png',
        'icon-128.png',
        'assets/icon.png',
        'assets/images/icon.png'
      ]
    };

    // Generic paths to try for any extension
    const genericPaths = [
      'icon-128.png',
      'icon-48.png',
      'icon.png',
      'assets/icon-128.png',
      'images/icon-128.png',
      'icons/icon-128.png',
      'assets/images/icon.png',
      'img/icon.png'
    ];

    // Get the specific paths for this extension, or use generic paths
    const possiblePaths = extensionId in extensionPaths
      ? extensionPaths[extensionId]
      : genericPaths;

    // Try to load each path with a cache-busting parameter
    const result = await new Promise<boolean>((resolve) => {
      let loadAttempts = 0;
      let foundExtension = false;

      // Try each possible path
      for (const path of possiblePaths) {
        const img = new Image();
        img.src = `chrome-extension://${extensionId}/${path}?t=${timestamp}`;

        img.onload = () => {
          console.log(`Extension detected via image load: ${path}`);
          foundExtension = true;
          resolve(true);
        };

        img.onerror = () => {
          loadAttempts++;
          if (loadAttempts >= possiblePaths.length && !foundExtension) {
            resolve(false);
          }
        };
      }

      // Set a timeout in case none of the images load
      setTimeout(() => {
        if (!foundExtension) {
          resolve(false);
        }
      }, 1000);
    });

    if (result) {
      return true;
    }
  } catch (error) {
    console.error('Error checking extension via image resource:', error);
  }

  // Method 5: Check for MetaMask specifically using the injected provider
  if (extensionId === 'nkbihfbeogaeaoehlefnkodbefgpgknn') {
    // Force a check for MetaMask by checking for the request method
    try {
      if (typeof (window as any).ethereum !== 'undefined') {
        // Just check if the method exists, don't actually call it
        if (typeof (window as any).ethereum.request === 'function') {
          console.log('MetaMask detected via ethereum.request method');
          return true;
        }

        // Check for other MetaMask-specific properties
        if ((window as any).ethereum._metamask) {
          console.log('MetaMask detected via ethereum._metamask property');
          return true;
        }
      }
    } catch (error) {
      console.error('Error in MetaMask specific check:', error);
    }
  }

  // Method 6: Try to detect by checking if we can open a known extension page
  try {
    // This is a last resort method that might work in some browsers
    const testFrame = document.createElement('iframe');
    testFrame.style.display = 'none';
    document.body.appendChild(testFrame);

    // Try to navigate to a known extension page
    try {
      // Use a timeout to avoid blocking
      const frameResult = await new Promise<boolean>((resolve) => {
        try {
          if (testFrame.contentWindow) {
            testFrame.contentWindow.location.href = `chrome-extension://${extensionId}/popup.html?t=${timestamp}`;

            // If we get here without an error, the extension might exist
            setTimeout(() => {
              resolve(true);
            }, 100);
          } else {
            resolve(false);
          }
        } catch (e) {
          // If we get a security error, the extension might exist but we can't access it
          // This is actually a positive signal in some browsers
          resolve(true);
        }

        // Set a timeout in case nothing happens
        setTimeout(() => resolve(false), 500);
      });

      // Clean up
      document.body.removeChild(testFrame);

      if (frameResult) {
        console.log('Extension detected via iframe navigation test');
        return true;
      }
    } catch (e) {
      // Clean up on error
      document.body.removeChild(testFrame);
    }
  } catch (error) {
    console.error('Error in iframe detection method:', error);
  }

  console.log(`Extension with ID ${extensionId} not detected after all checks`);
  return false;
};

/**
 * Extension IDs for common wallet extensions
 */
export const walletExtensionIds = {
  metamask: 'nkbihfbeogaeaoehlefnkodbefgpgknn', // MetaMask
  phantom: 'bfnaelmomeimhlpmgjnjophhpkkoljpa',  // Phantom
  trustwallet: 'egjidjbpglichdcondbcbdnbeeppgdph', // Trust Wallet
  okx: 'mcohilncbfahbmgdjkbpemcciiolgcge'  // OKX Wallet
};

/**
 * Activate an installed Chrome extension
 * @param extensionId The Chrome extension ID to activate
 * @returns Promise that resolves to true if activation was attempted, false otherwise
 */
export const activateExtension = async (extensionId: string): Promise<boolean> => {
  console.log(`Attempting to activate extension with ID ${extensionId}...`);

  // Create a random parameter to prevent caching and ensure a fresh activation each time
  const randomParam = `?t=${Date.now()}`;

  // Method 1: Try to activate wallet-specific methods
  try {
    // MetaMask specific activation
    if (extensionId === 'nkbihfbeogaeaoehlefnkodbefgpgknn') {
      console.log('Attempting to activate MetaMask...');

      // Method 1: Force MetaMask to open by directly calling its popup URL
      // This is the most reliable method to actually open the MetaMask popup
      try {
        // First try the notification popup which is most likely to work
        console.log('Opening MetaMask notification popup directly...');
        const notificationWindow = window.open(
          `chrome-extension://${extensionId}/notification.html${randomParam}`,
          'metamask-notification',
          'width=360,height=600,location=0,menubar=0,resizable=0,scrollbars=0,status=0,toolbar=0'
        );

        if (notificationWindow) {
          console.log('MetaMask notification window opened successfully');
          return true;
        }
      } catch (error) {
        console.error('Error opening MetaMask notification popup:', error);
        // Continue to other methods
      }

      // Method 2: Try to use the ethereum provider if available
      if (typeof (window as any).ethereum !== 'undefined') {
        try {
          console.log('Activating MetaMask via ethereum.request...');

          // Create a button element to simulate a user click
          // This helps bypass some browser security restrictions
          const tempButton = document.createElement('button');
          tempButton.style.display = 'none';
          document.body.appendChild(tempButton);

          // Add a click handler that will trigger MetaMask
          tempButton.onclick = async () => {
            try {
              // This will trigger the MetaMask popup
              await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            } catch (err) {
              console.log('MetaMask request was handled (possibly rejected)');
            }
          };

          // Simulate a user click
          tempButton.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(tempButton);
          }, 100);

          return true;
        } catch (err) {
          console.log('Error in ethereum.request method, trying alternative methods');
        }
      }

      // Method 3: Try multiple known MetaMask pages
      const metamaskPages = [
        'home.html',
        'popup.html',
        'notification.html',
        'index.html'
      ];

      for (const page of metamaskPages) {
        try {
          console.log(`Trying to open MetaMask ${page}...`);
          const pageWindow = window.open(
            `chrome-extension://${extensionId}/${page}${randomParam}`,
            `metamask-${page}`,
            'width=360,height=600,location=0,menubar=0,resizable=0,scrollbars=0,status=0,toolbar=0'
          );

          if (pageWindow) {
            console.log(`MetaMask ${page} opened successfully`);
            return true;
          }
        } catch (pageErr) {
          console.error(`Error opening MetaMask ${page}:`, pageErr);
        }
      }

      // Method 4: Try to open MetaMask using a direct URL with focus
      try {
        console.log('Trying to open MetaMask with direct URL and focus...');
        const directWindow = window.open(
          `chrome-extension://${extensionId}/home.html${randomParam}`,
          '_blank'
        );

        if (directWindow) {
          try {
            directWindow.focus();
            return true;
          } catch (focusErr) {
            console.log('Could not focus MetaMask window, but it may have opened');
            return true;
          }
        }
      } catch (directErr) {
        console.error('Error in direct MetaMask opening:', directErr);
      }
    }

    // Phantom specific activation
    if (extensionId === 'bfnaelmomeimhlpmgjnjophhpkkoljpa') {
      if (typeof (window as any).solana !== 'undefined') {
        try {
          console.log('Activating Phantom via solana.connect...');
          // This will trigger the Phantom popup
          await (window as any).solana.connect();
          return true;
        } catch (err) {
          console.log('User may have rejected the Phantom connection request');

          // Try to open Phantom directly as a fallback
          try {
            console.log('Fallback: Opening Phantom popup directly...');
            window.open(`chrome-extension://${extensionId}/popup.html${randomParam}`, '_blank');
            return true;
          } catch (popupErr) {
            console.error('Error opening Phantom popup:', popupErr);
          }

          return true;
        }
      }
    }

    // Trust Wallet specific activation
    if (extensionId === 'egjidjbpglichdcondbcbdnbeeppgdph') {
      if (typeof (window as any).trustwallet !== 'undefined') {
        try {
          console.log('Activating Trust Wallet...');
          // This will trigger the Trust Wallet popup
          await (window as any).trustwallet.ethereum.request({ method: 'eth_requestAccounts' });
          return true;
        } catch (err) {
          console.log('User may have rejected the Trust Wallet connection request');

          // Try to open Trust Wallet directly as a fallback
          try {
            console.log('Fallback: Opening Trust Wallet popup directly...');
            window.open(`chrome-extension://${extensionId}/popup.html${randomParam}`, '_blank');
            return true;
          } catch (popupErr) {
            console.error('Error opening Trust Wallet popup:', popupErr);
          }

          return true;
        }
      }
    }

    // OKX Wallet specific activation
    if (extensionId === 'mcohilncbfahbmgdjkbpemcciiolgcge') {
      if (typeof (window as any).okxwallet !== 'undefined') {
        try {
          console.log('Activating OKX Wallet...');
          // This will trigger the OKX Wallet popup
          await (window as any).okxwallet.request({ method: 'eth_requestAccounts' });
          return true;
        } catch (err) {
          console.log('User may have rejected the OKX Wallet connection request');

          // Try to open OKX Wallet directly as a fallback
          try {
            console.log('Fallback: Opening OKX Wallet popup directly...');
            window.open(`chrome-extension://${extensionId}/popup.html${randomParam}`, '_blank');
            return true;
          } catch (popupErr) {
            console.error('Error opening OKX Wallet popup:', popupErr);
          }

          return true;
        }
      }
    }
  } catch (error) {
    console.error('Error in wallet-specific activation:', error);
    // Continue to other methods
  }

  // Method 2: Try to use the management API if available (requires permissions)
  if (typeof chrome !== 'undefined' && chrome.management && chrome.management.launchApp) {
    try {
      console.log('Activating extension via chrome.management.launchApp...');
      chrome.management.launchApp(extensionId);
      return true;
    } catch (error) {
      console.error('Error launching extension via management API:', error);
      // Fall through to alternative methods
    }
  }

  // Method 3: Try to open the extension's popup page with multiple attempts
  // Different wallets have different popup pages
  const popupPaths: Record<string, string[]> = {
    'nkbihfbeogaeaoehlefnkodbefgpgknn': ['home.html', 'popup.html', 'notification.html', 'index.html'], // MetaMask
    'bfnaelmomeimhlpmgjnjophhpkkoljpa': ['popup.html', 'index.html', 'notification.html', 'home.html'], // Phantom
    'egjidjbpglichdcondbcbdnbeeppgdph': ['popup.html', 'index.html', 'home.html', 'main.html'], // Trust Wallet
    'mcohilncbfahbmgdjkbpemcciiolgcge': ['popup.html', 'index.html', 'home.html', 'main.html'] // OKX Wallet
  };

  const paths = extensionId in popupPaths ? popupPaths[extensionId] : ['popup.html', 'index.html', 'home.html', 'main.html'];

  // Try all paths one by one until one works
  for (const path of paths) {
    try {
      console.log(`Attempting to open extension via: chrome-extension://${extensionId}/${path}${randomParam}`);
      window.open(`chrome-extension://${extensionId}/${path}${randomParam}`, '_blank');
      // Add a small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      console.error(`Error opening extension via ${path}:`, error);
      // Continue to the next path
    }
  }

  // Method 4: Try direct activation with a forced reload
  try {
    // Force a new window to ensure it's not cached
    const extensionUrl = `chrome-extension://${extensionId}/popup.html${randomParam}`;
    console.log(`Forcing extension activation via: ${extensionUrl}`);

    const extensionWindow = window.open(extensionUrl, '_blank', 'width=360,height=600,resizable=yes');

    // If we got a window reference, try to force a reload
    if (extensionWindow) {
      try {
        extensionWindow.focus();
        setTimeout(() => {
          try {
            extensionWindow.location.reload();
          } catch (reloadErr) {
            console.log('Could not reload extension window, but it may have opened successfully');
          }
        }, 500);
      } catch (focusErr) {
        console.log('Could not focus extension window, but it may have opened successfully');
      }
    }

    return true;
  } catch (error) {
    console.error('Error in direct extension activation:', error);
  }

  // Method 5: Try to open the extension via chrome://extensions
  try {
    console.log('Opening chrome://extensions page...');
    // This might help the user find and click on the extension
    window.open('chrome://extensions/', '_blank');
    return true;
  } catch (error) {
    console.error('Error opening chrome://extensions:', error);
  }

  // Method 6: Fallback - just open the extension's main page
  try {
    console.log(`Opening extension index page: chrome-extension://${extensionId}/index.html${randomParam}`);
    window.open(`chrome-extension://${extensionId}/index.html${randomParam}`, '_blank');
    return true;
  } catch (error) {
    console.error('Error opening extension index page:', error);
    return false;
  }
};
