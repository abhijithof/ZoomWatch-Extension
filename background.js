// ZoomWatch Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  // ZoomWatch extension installed
  
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
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes('zoom.us')) {
    // Open side panel
    await chrome.sidePanel.open({ tabId: tab.id });
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
            // Content script manually injected into tab
    
    // Wait a bit for script to initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        type: 'ZOOMWATCH_PING'
      }).catch(() => {
        // Content script still not responding after injection
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
            // Participant update received
    
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
  
  // Handle warning messages
  if (message.type === 'ZOOM_WARNING_SENT') {
            // Warning sent
    
    // Store warning data
    chrome.storage.local.set({
      lastWarning: {
        timestamp: Date.now(),
        data: message.data
      }
    });
    
    // Show notification for warnings
    const { participant, level, duration } = message.data;
    chrome.notifications.create({
      type: 'basic',
      title: `ZoomWatch ${level.toUpperCase()} Warning`,
      message: `Warning sent to ${participant} (camera off for ${duration}s)`,
      iconUrl: 'icon.png' // Optional: add icon
    });
  }
  
  // Handle reminder messages (legacy)
  if (message.type === 'ZOOM_REMINDER') {
            // Reminder sent
    
    chrome.notifications.create({
      type: 'basic',
      title: 'ZoomWatch Reminder',
      message: message.data.message
    });
  }
  
  // Handle private room requests (placeholder functionality)
  if (message.type === 'ZOOM_PRIVATE_ROOM_REQUEST') {
            // Private room request
    
    // Store request data
    chrome.storage.local.set({
      lastPrivateRoomRequest: {
        timestamp: Date.now(),
        data: message.data
      }
    });
    
    // Show urgent notification for private room assignment
    chrome.notifications.create({
      type: 'basic',
      title: '🏠 ZoomWatch: Private Room Required',
      message: `${message.data.participant} needs mentor assignment - camera off for 50+ seconds`,
      iconUrl: 'icon.png',
      requireInteraction: true // Make notification persist until clicked
    });
  }
  
  // Handle ping messages
  if (message.type === 'ZOOMWATCH_PING') {
            // Received ping from content script
    sendResponse({ received: true, timestamp: Date.now() });
  }
  
  // Handle test messages
  if (message.type === 'TEST') {
            // Received test message from content script
    sendResponse({ received: true, test: 'success' });
  }
  
  sendResponse({ received: true });
});

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('zoom.us')) {
    
            // Zoom tab detected, checking content script
    
    // Send a message to check if content script is already running
    chrome.tabs.sendMessage(tabId, { type: 'ZOOMWATCH_PING' }).catch(() => {
              // Content script not responding, attempting manual injection
      injectContentScript(tabId);
    });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
          // ZoomWatch extension started
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
          // ZoomWatch extension startup
});

// Handle extension message errors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Always send a response to prevent "Could not establish connection" errors
  if (chrome.runtime.lastError) {
            // Message error occurred
    sendResponse({ error: chrome.runtime.lastError.message });
  } else {
    sendResponse({ received: true });
  }
  return true; // Keep message channel open for async response
});
