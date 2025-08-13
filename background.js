// ZoomWatch Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('ZoomWatch extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    enableAutoReminders: true,
    reminderMessage: "Please turn your camera on for better engagement! 📹",
    monitoringInterval: 3000,
    reminderDelay: 45000,
    isActive: true
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('zoom.us')) {
    // Open popup or toggle monitoring
    chrome.tabs.sendMessage(tab.id, {
      type: 'ZOOMWATCH_CONTROL',
      action: 'toggle'
    }).catch(() => {
      console.log('Content script not ready, attempting to inject...');
      injectContentScript(tab.id);
    });
  } else {
    // Show instructions for non-Zoom pages
    chrome.tabs.create({
      url: chrome.runtime.getURL('instructions.html')
    });
  }
});

// Function to inject content script manually if needed
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    console.log('Content script manually injected into tab:', tabId);
    
    // Wait a bit for script to initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        type: 'ZOOMWATCH_PING'
      }).catch(() => {
        console.log('Content script still not responding after injection');
      });
    }, 1000);
    
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ZOOM_PARTICIPANT_UPDATE') {
    // Log participant updates
    console.log('Participant update:', message.data);
    
    // Store in local storage for popup to access
    chrome.storage.local.set({
      lastUpdate: {
        timestamp: Date.now(),
        data: message.data
      }
    });
    
    // Send notification if camera went off
    if (message.data.camera === 'off') {
      chrome.notifications.create({
        type: 'basic',
        title: 'ZoomWatch Alert',
        message: `${message.data.name} turned off their camera`
      });
    }
  }
  
  // Handle ping messages
  if (message.type === 'ZOOMWATCH_PING') {
    console.log('Received ping from content script');
    sendResponse({ received: true, timestamp: Date.now() });
  }
  
  // Handle test messages
  if (message.type === 'TEST') {
    console.log('Received test message from content script');
    sendResponse({ received: true, test: 'success' });
  }
  
  sendResponse({ received: true });
});

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('zoom.us')) {
    
    console.log('Zoom tab detected, checking content script...');
    
    // Send a message to check if content script is already running
    chrome.tabs.sendMessage(tabId, { type: 'ZOOMWATCH_PING' }).catch(() => {
      console.log('Content script not responding, attempting manual injection...');
      injectContentScript(tabId);
    });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('ZoomWatch extension started');
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('ZoomWatch extension startup');
});

// Handle extension message errors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Always send a response to prevent "Could not establish connection" errors
  if (chrome.runtime.lastError) {
    console.log('Message error:', chrome.runtime.lastError);
    sendResponse({ error: chrome.runtime.lastError.message });
  } else {
    sendResponse({ received: true });
  }
  return true; // Keep message channel open for async response
});
