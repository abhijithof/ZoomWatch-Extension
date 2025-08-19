// ZoomWatch Extension - Simple Participant Monitor
// Focuses on the Participants tab: names + camera status icons

(function() {
    'use strict';
    
    // Version stamp for debugging
    const ZW_BUILD = '2025-01-19T23:00+05:30';
    
    // Check if we're in an iframe
    const isMainFrame = window === window.top;
    const isIframe = !isMainFrame;
    
    // Logging function with frame indicator
    function log(message) {
        const frameInfo = isIframe ? '[IFRAME]' : '[MAIN]';
        console.log(`[ZoomWatch] ${frameInfo} ${message}`);
    }
    
    // Log build version on load
    log(`🚀 ZoomWatch loaded - Build: ${ZW_BUILD}`);
    
    // Function to check if participants exist (can be called multiple times)
    function hasParticipantsNow() {
        // More comprehensive participant detection
        const participantSelectors = [
            '.participants-section-container',
            '.participants-list',
            '.participants-item',
            '[class*="participant"]',
            '[class*="attendee"]',
            '.meeting-participants',
            '.participants-panel'
        ];
        
        // In iframe, check current document
        if (isIframe) {
            for (const selector of participantSelectors) {
                if (document.querySelector(selector)) {
                    log(`SUCCESS: Found participants in iframe: ${selector}`);
                    return true;
                }
            }
            
            // Also check for any elements that might indicate a meeting is active
            const meetingIndicators = [
                'video',
                '[class*="video"]',
                '[class*="camera"]',
                '[class*="meeting"]',
                '[class*="footer"]',
                '[class*="control"]'
            ];
            
            for (const selector of meetingIndicators) {
                if (document.querySelector(selector)) {
                    log(`SUCCESS: Found meeting indicator in iframe: ${selector}`);
                    return true;
                }
            }
            
            log('ERROR: No participants or meeting indicators found in iframe');
            return false;
        }
        
        // In main frame, check all iframes for participants
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                for (const selector of participantSelectors) {
                    if (iframeDoc.querySelector(selector)) {
                        log(`SUCCESS: Found participants in iframe: ${selector}`);
                    return true;
                    }
                }
            } catch (e) {
                // Cannot access iframe
            }
        }
        
        log('ERROR: No participants found in any iframe');
        return false;
    }
    
    // Configuration
    const config = {
        checkInterval: 2000, // Check every 2 seconds
        enableAutoReminders: true,
        reminderInterval: 30000, // Send reminder every 30 seconds if cameras off
        // Escalating warning system configuration
        warningLevels: {
            level1: {
                delay: 10000, // 10 seconds
                message: "Please turn on your camera. This is a Level 1 instruction - further actions will be taken if not complied."
            },
            level2: {
                delay: 30000, // 30 seconds total (20 seconds after level 1)
                message: "Your camera has been off for 30 seconds. You have 20 seconds to turn it on or you'll be moved to a private room with a mentor."
            },
            level3: {
                delay: 50000, // 50 seconds total (20 seconds after level 2)
                message: "Final warning: You will now be moved to a private room with a mentor to discuss camera requirements. [PRIVATE_ROOM_PLACEHOLDER - Automated room assignment feature coming soon]"
            }
        },
        enableAutoWarnings: true,
        monitorProfileName: null // Will be detected automatically
    };
    
    // State
    let isMonitoring = false;
    let isPaused = false;
    let lastReminderTime = 0;
    
    // Enhanced participant tracking state
    const participantTracking = new Map(); // participantName -> trackingData
    // SIMPLIFIED: Extension user IS the monitor - no profile variable needed
    
    // Message deduplication system
    const sentMessages = new Set(); // Track sent messages to prevent duplicates
    const messageCooldown = 30000; // 30 seconds cooldown between identical messages
    const lastMessageTime = new Map(); // Track last message time per participant
    
    // Global monitoring flag to prevent multiple instances
    if (!window.ZoomWatchMonitoringStarted) {
        window.ZoomWatchMonitoringStarted = false;
    }
    
    // Tracking data structure for each participant
    function createTrackingData(participantName) {
        return {
            name: participantName,
            cameraOffStartTime: null,
            cameraOnTime: Date.now(),
            warningsSent: {
                level1: false,
                level2: false,
                level3: false
            },
            totalOffTime: 0,
            warningTimestamps: []
        };
    }
    

    
    // === ZOOM PANEL CONTROL FUNCTIONS ===
    
    // Open participants panel programmatically
    function openParticipantsPanel() {
        log('OPEN: Attempting to open participants panel...');
        
        // Safety check: only allow in meeting context (but be more lenient in iframes)
        if (!isInZoomMeeting() && !isIframe) {
            log('ERROR: Cannot open participants panel: Not in a Zoom meeting');
            return false;
        }
        
        // Look for the participants button (when closed, it should have "open" in aria-label)
        const participantsSelectors = [
            'button[aria-label*="participants" i]:not([aria-label*="close" i])',
            'button[aria-label*="manage participants" i]:not([aria-label*="close" i])',
            'button[aria-label*="participant" i]:not([aria-label*="close" i])',
            '[role="button"][aria-label*="participants" i]:not([aria-label*="close" i])',
            // Backup selectors for when panel is closed
            'button[class*="participants"]',
            'button[title*="participants" i]',
            '.footer-button[aria-label*="participants" i]',
            // More aggressive selectors for iframe
            'button[aria-label*="participant" i]',
            '[aria-label*="participant" i]',
            'button[class*="participant" i]',
            '[class*="participant" i]'
        ];
        
        for (const selector of participantsSelectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                log(`SUCCESS: Found participants button: ${selector}`);
                log(`   Aria-label: "${button.getAttribute('aria-label')}" | Class: "${button.className}"`);
                button.click();
                log('SUCCESS: Participants panel opened');
                return true;
            }
        }
        
        // Debug: show all buttons with "participant" in aria-label
        const participantButtons = document.querySelectorAll('[aria-label*="participant" i]');
        log(`INFO: Found ${participantButtons.length} buttons with "participant" in aria-label:`);
        participantButtons.forEach((btn, i) => {
            log(`  ${i + 1}: "${btn.getAttribute('aria-label')}" | visible: ${btn.offsetWidth > 0}`);
        });
        
        log('ERROR: Participants button not found - panel may already be open');
        return false;
    }
    
    // Close participants panel programmatically
    function closeParticipantsPanel() {
        log('🔒 Attempting to close participants panel...');
        
        // Look for any button that has "close" AND "participants" in aria-label
        const possibleButtons = [
            'button[aria-label*="close the manage participants list pane"]',
            'button[aria-label*="close"][aria-label*="participants" i]',
            'button[aria-label*="participants"][aria-label*="close" i]',
            '[aria-label*="close"][aria-label*="participants" i]'
        ];
        
        for (const selector of possibleButtons) {
            const closeButton = document.querySelector(selector);
            if (closeButton && closeButton.offsetWidth > 0) {
                log(`SUCCESS: Found close participants button: ${selector}`);
                log(`   Aria-label: "${closeButton.getAttribute('aria-label')}"`);
                closeButton.click();
                log('SUCCESS: Participants panel closed');
                return true;
            }
        }
        
        // Debug: show all buttons with "participants" in aria-label
        const participantButtons = document.querySelectorAll('[aria-label*="participant" i]');
        log(`INFO: Found ${participantButtons.length} buttons with "participants" in aria-label:`);
        participantButtons.forEach((btn, i) => {
            log(`  ${i + 1}: "${btn.getAttribute('aria-label')}" | visible: ${btn.offsetWidth > 0}`);
        });
        
        log('ERROR: Close participants button not found - panel may already be closed');
        return false;
    }
    
    // Open chat panel programmatically  
    function openChatPanel() {
        log('CHAT: Attempting to open chat panel...');
        
        // Safety check: only allow in meeting context (but be more lenient in iframes)
        if (!isInZoomMeeting() && !isIframe) {
            log('ERROR: Cannot open chat panel: Not in a Zoom meeting');
            return false;
        }
        
        // Look for meeting-specific chat buttons (more aggressive for iframes)
        const meetingChatSelectors = [
            // Meeting footer chat button (most specific)
            '.footer-button[aria-label*="chat" i]:not([aria-label*="team" i]):not([aria-label*="close" i])',
            // Meeting control bar chat button
            'button[aria-label*="chat" i][class*="footer"]:not([aria-label*="team" i]):not([aria-label*="close" i])',
            // Meeting-specific chat button
            'button[aria-label*="chat" i][class*="control"]:not([aria-label*="team" i]):not([aria-label*="close" i])',
            // Meeting bottom bar chat button
            'button[aria-label*="chat" i][class*="bottom"]:not([aria-label*="team" i]):not([aria-label*="close" i])',
            // More aggressive selectors for iframe
            'button[aria-label*="chat" i]:not([aria-label*="close" i])',
            '[aria-label*="chat" i]:not([aria-label*="close" i])',
            'button[class*="chat" i]',
            '[class*="chat" i]'
        ];
        
        for (const selector of meetingChatSelectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                const ariaLabel = button.getAttribute('aria-label') || '';
                const title = button.getAttribute('title') || '';
                const className = button.className || '';
                
                // Skip team-related buttons
                if (ariaLabel.toLowerCase().includes('team') || 
                    title.toLowerCase().includes('team') ||
                    className.toLowerCase().includes('team')) {
                    log(`SKIP: Skipping team-related button: "${ariaLabel}" | class: "${className}"`);
                    continue;
                }
                
                // For iframes, be less restrictive about meeting controls
                if (isIframe || className.includes('footer') || className.includes('control') || className.includes('bottom')) {
                    log(`SUCCESS: Found chat button: ${selector}`);
                    log(`   Aria-label: "${ariaLabel}" | Class: "${className}"`);
                    button.click();
                    log('SUCCESS: Chat panel opened');
                    return true;
                } else {
                    log(`SKIP: Skipping non-meeting button: "${ariaLabel}" | class: "${className}"`);
                }
            }
        }
        
        log('ERROR: Meeting chat button not found - panel may already be open');
        return false;
    }
    
    // Close chat panel programmatically
    function closeChatPanel() {
        log('🔒 Attempting to close chat panel...');
        
        // Look for any button that has "close" AND "chat" in aria-label
        const possibleButtons = [
            'button[aria-label*="close the chat panel"]',
            'button[aria-label*="close"][aria-label*="chat" i]',
            'button[aria-label*="chat"][aria-label*="close" i]',
            '[aria-label*="close"][aria-label*="chat" i]'
        ];
        
        for (const selector of possibleButtons) {
            const closeButton = document.querySelector(selector);
            if (closeButton && closeButton.offsetWidth > 0) {
                log(`SUCCESS: Found close chat button: ${selector}`);
                log(`   Aria-label: "${closeButton.getAttribute('aria-label')}"`);
                closeButton.click();
                log('SUCCESS: Chat panel closed');
                return true;
            }
        }
        
        // Debug: show all buttons with "chat" in aria-label
        const chatButtons = document.querySelectorAll('[aria-label*="chat" i]');
        log(`INFO: Found ${chatButtons.length} buttons with "chat" in aria-label:`);
        chatButtons.forEach((btn, i) => {
            log(`  ${i + 1}: "${btn.getAttribute('aria-label')}" | visible: ${btn.offsetWidth > 0}`);
        });
        
        log('ERROR: Close chat button not found - panel may already be closed');
        return false;
    }
    
    // === ZOOM CHAT MESSAGING FUNCTIONS ===
    
    // Find Zoom chat input element
    function findChatInput() {
        const chatSelectors = [
            // Based on discovered Zoom interface structure
            '.chat-rtf-box textarea',  // Main chat input
            '.chat-rtf-box [contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"]',
            '[class*="chat-rtf-box"] textarea',
            '[class*="chat-rtf-box"] [contenteditable="true"]',
            // Fallback selectors
            'textarea[data-testid="chat-input"]',
            'textarea[placeholder*="chat" i]',
            'textarea[placeholder*="message" i]',
            'textarea[placeholder*="type" i]',
            '.chat-input textarea',
            '.message-input textarea',
            'input[type="text"][placeholder*="chat" i]',
            'textarea.chat-box-input',
            'textarea[aria-label*="chat" i]',
            // Generic selectors
            'textarea[id*="chat" i]',
            'textarea[class*="chat" i]',
            'textarea[class*="message" i]',
            'div[contenteditable="true"]',
            '[role="textbox"]'
        ];
        
        // First try current document
        for (const selector of chatSelectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetWidth > 0) {
                log(`SUCCESS: Found chat input in current document: ${selector}`);
                return element;
            }
        }
        
        // If not found, search in iframes
        log('INFO: Chat input not found in current document, searching iframes...');
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                for (const selector of chatSelectors) {
                    const element = iframeDoc.querySelector(selector);
                    if (element && element.offsetWidth > 0) {
                        log(`SUCCESS: Found chat input in iframe ${i + 1}: ${selector}`);
                        return element;
                    }
                }
            } catch (e) {
                log(`WARNING: Could not access iframe ${i + 1}: ${e.message}`);
            }
        }
        
        log('ERROR: Chat input not found in current document or any iframe');
        return null;
    }
    
    // Find Zoom chat send button
    function findChatSendButton() {
        const sendSelectors = [
            // Based on discovered Zoom interface
            '.chat-rtf-box__send',  // Main send button class
            'button[aria-label="send"]',  // Exact aria-label we found
            '.chat-rtf-box button[aria-label*="send" i]',
            '[class*="chat-rtf-box"] button',
            // Fallback selectors
            'button[data-testid="chat-send-button"]',
            'button[aria-label*="send" i]',
            'button[title*="send" i]',
            '.chat-send-button',
            '.send-button',
            'button[type="submit"]',
            // Look for buttons with SVG icons near the chat area
            'button svg',
            'button[class*="send"]',
            'button[class*="submit"]'
        ];
        
        // First try current document
        for (const selector of sendSelectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetWidth > 0) {
                log(`SUCCESS: Found send button in current document: ${selector}`);
                return element;
            }
        }
        
        // If not found, search in iframes
        log('INFO: Send button not found in current document, searching iframes...');
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                for (const selector of sendSelectors) {
                    const element = iframeDoc.querySelector(selector);
                    if (element && element.offsetWidth > 0) {
                        log(`SUCCESS: Found send button in iframe ${i + 1}: ${selector}`);
                        return element;
                    }
                }
            } catch (e) {
                log(`WARNING: Could not access iframe ${i + 1}: ${e.message}`);
            }
        }
        
        log('ERROR: Send button not found in current document or any iframe');
        return null;
    }
    
    // Send a message through Zoom chat
    async function sendChatMessage(message, recipientName = 'Everyone') {
        try {
            log(`SEND: Attempting to send message: "${message}" to ${recipientName}`);
            
            // If sending to specific person, select them first
            if (recipientName !== 'Everyone') {
                const recipientSelected = await selectChatRecipient(recipientName);
                if (!recipientSelected) {
                    log(`ERROR: Failed to select recipient ${recipientName} - ABORTING message send`);
                    return false; // Don't send to Everyone as fallback - this causes spam
                }
            }
            
            // Find chat input
            const chatInput = findChatInput();
            if (!chatInput) {
                log('ERROR: Cannot send message: Chat input not found');
                return false;
            }
            
            // Focus on chat input
            chatInput.focus();
            
            // Clear existing content and insert message using ProseMirror-compatible method
            log(`INFO: Setting message text: "${message}" in chat input`);
            log(`INFO: Chat input type: contentEditable=${chatInput.contentEditable}, tagName=${chatInput.tagName}`);
            
            if (chatInput.contentEditable === 'true') {
                log('INFO: Using setProseMirrorText for contenteditable element');
                setProseMirrorText(chatInput, message);
            } else {
                log('INFO: Using direct value assignment for input element');
                chatInput.value = message;
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                chatInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Wait a moment for the UI to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify the text was actually set
            const actualText = chatInput.contentEditable === 'true' ? chatInput.textContent : chatInput.value;
            log(`INFO: Text verification: Input now contains: "${actualText}"`);
            
            // Find and click send button
            const sendButton = findChatSendButton();
            log(`INFO: Send button found: ${sendButton ? 'YES' : 'NO'}, disabled: ${sendButton?.disabled}`);
            
            if (sendButton && !sendButton.disabled) {
                log('INFO: Clicking send button...');
                sendButton.click();
                log(`SUCCESS: Message sent successfully to ${recipientName}`);
                return true;
            } else {
                log('INFO: Send button not available, trying Enter key...');
                // Try Enter key as fallback
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                chatInput.dispatchEvent(enterEvent);
                log(`SUCCESS: Message sent via Enter key to ${recipientName}`);
                return true;
            }
            
        } catch (error) {
            log(`ERROR: Error sending chat message: ${error.message}`);
            return false;
        }
    }
    
    // Select specific chat recipient instead of "Everyone"
    async function selectChatRecipient(recipientName) {
        log(`TARGET: Selecting chat recipient: ${recipientName}`);
        
        // Ensure chat panel is open first
        if (!isChatPanelOpen()) {
            if (!openChatPanel()) return false;
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        // Find the iframe that owns the chat receiver button
        const { iframe: receiverIframe, doc: receiverDoc, win: receiverWin } = findReceiverOwnerIframe();
        log(`INFO: Chat receiver owner: ${receiverIframe ? 'iframe' : 'main frame'}`);
        
        // Find and click the receiver button to open dropdown - EXACTLY like ChatGPT code
        let receiverBtn = receiverDoc.querySelector('button.chat-receiver-list__receiver') ||
                         receiverDoc.querySelector('[class*="chat-receiver"][role="button"]') ||
                         receiverDoc.querySelector('[class*="chat-receiver"]');
        
        if (!receiverBtn) {
            log('ERROR: Receiver button not found in receiver iframe');
            return false;
        }
        
        log(`SUCCESS: Found receiver button in ${receiverIframe ? 'iframe' : 'main frame'}`);
        
        // Click to open dropdown - EXACTLY like ChatGPT code
        receiverBtn.click();
        log('SUCCESS: Clicked receiver dropdown');
        await new Promise(r => setTimeout(r, 500));
        
        // Now find the ACTUAL chat recipient dropdown (not audio/video menus)
        log('INFO: Searching for recipient in dropdown...');
        
        // Look for the chat recipient dropdown specifically
        let dropdownMenu = receiverDoc.querySelector(
            '[class*="chat-receiver-list__menu"], ' +
            '[class*="chat-receiver-list__dropdown"], ' +
            '[class*="chat-receiver-list__options"], ' +
            '[class*="chat-receiver-list__items"]'
        );
        
        if (!dropdownMenu) {
            log('ERROR: No chat recipient dropdown menu found after clicking receiver button');
            log('INFO: Looking for any dropdown that might contain recipient options...');
            
            // Fallback: Look for any dropdown that contains participant names
            const allDropdowns = receiverDoc.querySelectorAll('[class*="dropdown"], [class*="menu"], [class*="options"], [class*="items"]');
            log(`INFO: Found ${allDropdowns.length} potential dropdowns/menus`);
            
            for (let i = 0; i < allDropdowns.length; i++) {
                const dd = allDropdowns[i];
                const text = dd.textContent?.trim() || '';
                const className = dd.className || '';
                log(`INFO: Dropdown ${i + 1}: ${dd.tagName}.${className} - Text: "${text.substring(0, 100)}"`);
                
                // Check if this dropdown contains participant names
                if (text.includes('Abhi 2') || text.includes('Everyone') || text.includes('Meeting')) {
                    log(`SUCCESS: Found dropdown with participant names: ${dd.tagName}.${className}`);
                    dropdownMenu = dd;
                    break;
                }
            }
            
            if (!dropdownMenu) {
                log('ERROR: Still no suitable dropdown found');
                return false;
            }
        }
        
        log(`SUCCESS: Found dropdown menu: ${dropdownMenu.tagName}.${dropdownMenu.className}`);
        
        // Debug: Show what's actually in the dropdown menu
        log('INFO: Debug: Contents of dropdown menu:');
        const allDropdownElements = dropdownMenu.querySelectorAll('*');
        for (let i = 0; i < Math.min(allDropdownElements.length, 10); i++) {
            const el = allDropdownElements[i];
            const text = el.textContent?.trim() || '';
            if (text && text.length < 100) {
                log(`   ${i + 1}: ${el.tagName}.${el.className} - "${text}"`);
            }
        }
        
        // Now search ONLY within the dropdown menu for recipient items
        const selList = [
            'a.chat-receiver-list__menu-item.dropdown-item',
            '[role="menuitemradio"]',
            '[role="option"]',
            '[class*="chat-receiver-list__menu-item"]',
            '[class*="dropdown-item"]',
            '[class*="menu-item"]',
            '[class*="list-item"]',
            'li', // Generic list items
            'a',  // Generic anchor tags
            'button' // Generic buttons
        ];
        
        let target = null;
        for (const selector of selList) {
            // Only search within the dropdown menu, not the entire document
            const elements = dropdownMenu.querySelectorAll(selector);
            log(`INFO: Searching with selector "${selector}" in dropdown menu (found ${elements.length} elements)`);
            
            for (const element of elements) {
                const text = (element.textContent || '').trim();
                if (!text) continue;
                
                log(`INFO: Checking element: "${text}" (${element.tagName}.${element.className})`);
                
                if (text === recipientName || 
                    text.includes(recipientName) || 
                    text.toLowerCase().includes(recipientName.toLowerCase())) {
                    target = element;
                    log(`SUCCESS: Found recipient: "${text}" (matched "${recipientName}")`);
                    break;
                }
            }
            if (target) break;
        }
        
        if (!target) {
            log(`ERROR: Recipient "${recipientName}" not found in dropdown`);
            return false;
        }
        
        // Find clickable element (from ChatGPT working code)
        let clickable = target;
        let hops = 0;
        while (hops < 5 && clickable && !isClickable(clickable)) {
            clickable = clickable.parentElement;
            hops++;
            if (hops > 1) log(`INFO: Checking parent level ${hops}: ${clickable?.tagName}.${clickable?.className}`);
        }
        if (!clickable) clickable = target;
        
        log(`TARGET: Using React-compatible event sequence on: ${clickable.tagName}.${clickable.className}`);
        await selectMenuItemReacty(clickable, receiverWin);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify selection via the receiver button in the same iframe
        receiverBtn = receiverDoc.querySelector(
            'button.chat-receiver-list__receiver, ' +
            '[class*="chat-receiver"][role="button"], ' +
            '[class*="chat-receiver"]'
        );
        
        if (receiverBtn) {
            const got = ((receiverBtn.textContent || receiverBtn.getAttribute('aria-label')) || '').trim();
            const ok = got.toLowerCase().includes(recipientName.toLowerCase());
            log(`🔎 Receiver now shows: "${got}" | matched=${ok}`);
            
            if (ok) {
                log(`SUCCESS: Recipient selection successful for ${recipientName}`);
                return true;
            } else {
                log(`WARNING: Recipient selection may have failed for ${recipientName}`);
                return false;
            }
        } else {
            log('WARNING: Could not verify recipient selection - receiver button not found');
            return false;
        }
    }
    
    // SIMPLIFIED: Extension user IS the monitor - no profile detection needed
    // Removed detectMonitorProfile function as it's unnecessary
    

    
    // Find the Participants tab and get participant list
    function findParticipantsList() {
        log('INFO: Looking for Participants tab...');
        
        // ENHANCED: First check iframes for participants (since panels are now opening in iframes)
        if (window === window.top) {
            log('INFO: Main frame detected, checking iframes for participants...');
            const iframes = document.querySelectorAll('iframe');
            
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                    const iframeUrl = iframeDoc.URL || '';
                    
                    // Check if this iframe contains the meeting
                    if (iframeUrl.includes('/wc/') && iframeUrl.includes('/start')) {
                        log(`INFO: Checking meeting iframe ${i + 1} for participants: ${iframeUrl}`);
                        
                        // Look for participants in this iframe
                        const iframeParticipants = iframeDoc.querySelector('.participants-section-container');
                        if (iframeParticipants) {
                            log(`SUCCESS: Found participants in meeting iframe ${i + 1}: .participants-section-container`);
                            return iframeParticipants;
                        }
                        
                        // Try alternative selectors in the iframe
                        const alternativeSelectors = [
                            '.participants-list-container.participants-ul',
                            '.participants-li',
                            '[class*="participant" i]',
                            '[data-testid*="participant"]'
                        ];
                        
                        for (const selector of alternativeSelectors) {
                            const altParticipants = iframeDoc.querySelector(selector);
                            if (altParticipants) {
                                log(`SUCCESS: Found participants in meeting iframe ${i + 1} with selector: ${selector}`);
                                return altParticipants;
                            }
                        }
                    }
                } catch (e) {
                    log(`WARNING: Could not access iframe ${i + 1}: ${e.message}`);
                }
            }
            
            log('WARNING: No participants found in meeting iframes, falling back to main frame search...');
        }
        
        // Fallback: Search in current context (main frame or iframe)
        log('INFO: Searching current context for participants...');
        
        // Debug: Log all elements that might be participants-related
        const allParticipantElements = document.querySelectorAll('*[class*="participant" i]');
        log(`INFO: Found ${allParticipantElements.length} elements with "participant" in class name`);
        allParticipantElements.forEach((el, i) => {
            if (i < 5) { // Log first 5 to avoid spam
                log(`   ${i+1}: ${el.tagName}.${el.className}`);
            }
        });
        
        // Debug: Look for any element containing "Participants" text
        const participantsTextElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('Participants') && el.offsetWidth > 0
        );
        log(`INFO: Found ${participantsTextElements.length} elements containing "Participants" text`);
        participantsTextElements.forEach((el, i) => {
            if (i < 3) { // Log first 3
                log(`   ${i+1}: ${el.tagName}.${el.className} - "${el.textContent.substring(0, 30)}"`);
            }
        });
        
        // Method 1: Look for the specific participants container (found in deep search!)
        const participantsContainer = document.querySelector('.participants-section-container');
        if (participantsContainer) {
            log('SUCCESS: Found participants section container');
            return participantsContainer;
        }
        
        // Method 2: Look for the participants list directly (found in deep search!)
        const participantsList = document.querySelector('.participants-list-container.participants-ul');
        if (participantsList) {
            log('SUCCESS: Found participants list container');
            return participantsList;
        }
        
        // Method 3: Look for participant items anywhere on the page (found in deep search!)
        const participantItems = document.querySelectorAll('.participants-li');
        if (participantItems.length > 0) {
            log(`SUCCESS: Found ${participantItems.length} participant items`);
            return participantItems[0].closest('.participants-section-container') || participantItems[0].parentElement;
        }
        
        // Method 4: Look for any element with "participant" in the class (case insensitive)
        const anyParticipantElement = document.querySelector('[class*="participant" i]');
        if (anyParticipantElement) {
            log(`SUCCESS: Found participants in current context with selector: ${anyParticipantElement.className}`);
            return anyParticipantElement.closest('[class*="section"], [class*="container"], [class*="wrapper"]') || anyParticipantElement;
        }
        
        // Method 5: Look for elements containing your name
        const nameElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (el.textContent.includes('ABHIJITH') || el.textContent.includes('ᴀʙʜɪᴊɪᴛʜ')) && el.offsetWidth > 0
        );
        if (nameElements.length > 0) {
            log(`SUCCESS: Found ${nameElements.length} elements with your name`);
            const nameElement = nameElements[0];
            log(`   Using: ${nameElement.tagName}.${nameElement.className}`);
            return nameElement.closest('[class*="section"], [class*="container"], [class*="wrapper"]') || nameElement.parentElement;
        }
        
        log('ERROR: No participants list found in current context or iframes');
        return null;
    }
    
    // Parse participant names and camera status from the list
    function parseParticipants(participantsList) {
        if (!participantsList) {
            log('ERROR: No participants list provided');
        return [];
    }
    
        log('📋 Parsing participants from list...');
        log(`   List element: ${participantsList.tagName}.${participantsList.className}`);
        
        // Use ONLY .participants-li to avoid duplicates (from investigation results)
        const participantItems = participantsList.querySelectorAll('.participants-li');
        log(`   Found ${participantItems.length} unique participant items`);
        
        if (participantItems.length > 0) {
            log(`SUCCESS: Found ${participantItems.length} participant items, processing...`);
            return parseParticipantItems(Array.from(participantItems));
        } else {
            log('ERROR: No participant items found in list');
            return [];
        }
    }
    
    // Parse individual participant items
    function parseParticipantItems(items) {
        const participants = [];
        
        items.forEach((item, index) => {
            // Skip if this item is too large (likely a container)
            if (item.offsetWidth > 500 || item.offsetHeight > 500) {
                return;
            }
            
            // Get participant name
            const name = extractParticipantName(item);
            if (!name || name.length < 2) {
                return;
            }
            
            // Get camera status
            const cameraOn = checkCameraStatus(item);
            
            // Skip if this looks like a UI element, not a participant
            if (name.toLowerCase().includes('participants') || 
                name.toLowerCase().includes('invite') ||
                name.toLowerCase().includes('more') ||
                name.toLowerCase().includes('leave')) {
                return;
            }
            
            log(`USER: Participant ${index + 1}: ${name} (Camera: ${cameraOn ? '🟢 ON' : '🔴 OFF'})`);
            
            participants.push({
                name: name,
                cameraOn: cameraOn,
                element: item
            });
        });
        
        return participants;
    }
    
    // Extract participant name from an item
    function extractParticipantName(item) {
        // CRITICAL FIX: Check if this is the monitor (extension user) first!
        const ariaLabel = item.getAttribute('aria-label') || '';
        if (ariaLabel.includes('(me)') || ariaLabel.includes('(Host, me)')) {
            log(`SKIP: Skipping monitor (extension user) - aria-label: "${ariaLabel}"`);
            return null; // Return null to skip this participant
        }
        
        // Look for name elements using the exact selectors from your HTML
        const nameSelectors = [
            '.participants-item__display-name',
            '.participants-item__name-section',
            '.participants-item__name-label',
            '[class*="display-name"]',
            '[class*="name-section"]'
        ];
        
        for (const selector of nameSelectors) {
            const nameElement = item.querySelector(selector);
            if (nameElement) {
                const text = nameElement.textContent?.trim();
                if (text && text.length > 1 && text.length < 50) {
                    // Clean up the name (remove extra spaces, etc.)
                    return text.replace(/\s+/g, ' ').trim();
                }
            }
        }
        
        // Fallback: get text from the item itself
        const text = item.textContent?.trim();
        if (text && text.length > 1 && text.length < 100) {
            // Split by lines and take the first reasonable line
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 1);
            for (const line of lines) {
                if (line.length < 50 && !line.includes('(') && !line.includes(')')) {
                return line;
                }
            }
        }
        
        return null;
    }
    
    // Check camera status by looking for camera icons
    function checkCameraStatus(item) {
        // PRIORITY 1: Look for aria-label for camera status (most reliable from investigation)
        const ariaLabel = item.getAttribute('aria-label') || '';
        if (ariaLabel) {
            const isOff = ariaLabel.includes('video off') || ariaLabel.includes('camera off');
            const isOn = ariaLabel.includes('video on') || ariaLabel.includes('camera on');
            
            if (isOff || isOn) {
                log(`   CAMERA: Camera status from aria-label: "${ariaLabel}" (${isOff ? '🔴 OFF' : '🟢 ON'})`);
                return !isOff;
            }
        }
        
        // FALLBACK: Look for camera status icons if aria-label fails
        const cameraSelectors = [
            // Video icons from your HTML (using class contains since / is invalid in CSS)
            '[class*="lazy-icon-icons"][class*="video-on"]',
            '[class*="lazy-icon-icons"][class*="video-off"]',
            // Audio icons (sometimes indicate camera status too)
            '[class*="lazy-icon-icons"][class*="audio-muted"]',
            '[class*="lazy-icon-icons"][class*="audio-unmuted"]',
            // Generic video/camera classes
            '[class*="video-on"]',
            '[class*="video-off"]',
            '[class*="camera-on"]',
            '[class*="camera-off"]'
        ];
        
        for (const selector of cameraSelectors) {
            const icon = item.querySelector(selector);
            if (icon) {
                // Convert className to string (handles SVGAnimatedString for SVG elements)
                const iconClass = String(icon.className || '');
                const isOff = iconClass.includes('off') || iconClass.includes('muted');
                log(`   CAMERA: Found camera icon: ${selector} (${isOff ? '🔴 OFF' : '🟢 ON'})`);
                return !isOff; // Return true if NOT off/muted
            }
        }
        
        // Look for title attribute for camera status
        const title = item.title || '';
        if (title) {
            const isOff = title.includes('video off') || title.includes('camera off');
            const isOn = title.includes('video on') || title.includes('camera on');
            
            if (isOff || isOn) {
                log(`   CAMERA: Camera status from title: "${title}" (${isOff ? '🔴 OFF' : '🟢 ON'})`);
                return !isOff;
            }
        }
        
        // Default: assume camera is ON if we can't determine
        log('   CAMERA: Camera status unclear, assuming ON');
            return true;
    }
    
    // Main monitoring function
    function monitorParticipants() {
        if (!isMonitoring || isPaused) return;
        
        log('=== MONITORING PARTICIPANTS ===');
        
        // Check if we're in a meeting OR if we have participants (for iframe contexts)
        const inMeeting = isInZoomMeeting();
        const hasParticipants = hasParticipantsNow();
        
        if (!inMeeting && !hasParticipants) {
            log('ERROR: Not in a Zoom meeting and no participants found');
                    return;
                }
        
        if (!inMeeting && hasParticipants) {
            log('WARNING: Meeting detection failed but participants found - continuing monitoring');
                }
                
        // Find and parse participants (only when panel is already open)
        const participantsList = findParticipantsList();
        const participants = parseParticipants(participantsList);
        processParticipants(participants);
    }
    
    // Process the found participants
    function processParticipants(participants) {
        log('STATS: Processing participants...');
                
                if (participants.length === 0) {
            log('ERROR: No participants found');
                            return;
                        }
                        
        log(`SUCCESS: Found ${participants.length} participants`);
                        
        // Update participant tracking and check for warnings
        updateParticipantTracking(participants);
                        
        // Count cameras off (EXCLUDING monitor)
        let camerasOff = 0;
        let actualParticipants = 0;
        
        participants.forEach(participant => {
            // Skip monitor (extension user) in all calculations
            if (participant.name.includes('(me)') || participant.name.includes('(Host, me)')) {
                log(`SKIP: Excluding monitor from count: ${participant.name}`);
                return;
            }
            
            actualParticipants++;
            if (!participant.cameraOn) {
                            camerasOff++;
            }
        });
        
        // Create summary (EXCLUDING monitor)
        const summary = `${actualParticipants} participants (excluding monitor), ${camerasOff} cameras off`;
        log(`STATS: Summary: ${summary}`);
        
        // Store data for popup access
        localStorage.setItem('zoomwatch_summary', summary);
        localStorage.setItem('zoomwatch_participants', JSON.stringify(participants));
                
                // Send summary to popup
        sendSummaryToPopup(actualParticipants, camerasOff, participants);
        
        // Check and send reminders if needed (legacy system)
        if (config.enableAutoReminders && camerasOff > 0) {
            checkAndSendReminders(actualParticipants, camerasOff);
        }
        
        // Check and send automated warnings (new escalation system)
        if (config.enableAutoWarnings && camerasOff > 0) {
            checkAndSendAutomatedWarnings();
        }
    }
    
    // Update participant tracking and detect camera status changes
    function updateParticipantTracking(participants) {
        const currentTime = Date.now();
        
        // Process each current participant
        participants.forEach(participant => {
            const name = participant.name;
            
            // CRITICAL: Skip the monitor (extension user) - they shouldn't be tracked!
            if (name.includes('(me)') || name.includes('(Host, me)')) {
                log(`SKIP: Skipping monitor from tracking: ${name}`);
                return;
            }
            
            let trackingData = participantTracking.get(name);
            
            // Initialize tracking for new participants
            if (!trackingData) {
                trackingData = createTrackingData(name);
                participantTracking.set(name, trackingData);
                log(`USER: Started tracking participant: ${name}`);
            }
            
            // Update camera status and timing
            if (participant.cameraOn) {
                // Camera turned on
                if (trackingData.cameraOffStartTime) {
                    const offDuration = currentTime - trackingData.cameraOffStartTime;
                    trackingData.totalOffTime += offDuration;
                    log(`CAMERA: ${name} turned camera ON after ${Math.round(offDuration/1000)}s`);
                    
                    // Reset warnings for next time
                    trackingData.warningsSent = {
                        level1: false,
                        level2: false,
                        level3: false
                    };
                    trackingData.cameraOffStartTime = null;
                }
                trackingData.cameraOnTime = currentTime;
            } else {
                // Camera is off
                if (!trackingData.cameraOffStartTime) {
                    trackingData.cameraOffStartTime = currentTime;
                    log(`CAMERA: ${name} turned camera OFF at ${new Date(currentTime).toLocaleTimeString()}`);
                }
            }
        });
        
        // Clean up tracking for participants who left
        const currentParticipantNames = new Set(participants.map(p => p.name));
        for (const [name, trackingData] of participantTracking) {
            if (!currentParticipantNames.has(name)) {
                log(`👋 Participant left, stopping tracking: ${name}`);
                participantTracking.delete(name);
            }
        }
    }
    
    // Check and send automated escalating warnings
    async function checkAndSendAutomatedWarnings() {
        const currentTime = Date.now();
        
        // SIMPLIFIED: Extension user IS the monitor - no profile detection needed
        log('SUCCESS: Extension user is the monitor - proceeding with warnings');
        
        for (const [name, trackingData] of participantTracking) {
            if (!trackingData.cameraOffStartTime) continue; // Camera is on
            
            // DOUBLE-CHECK: Never send warnings to the monitor (extension user)
            if (name.includes('(me)') || name.includes('(Host, me)')) {
                log(`SKIP: Skipping warning to monitor (extension user): ${name}`);
                continue;
            }
            
            const offDuration = currentTime - trackingData.cameraOffStartTime;
            
            // Check Level 1 warning (10 seconds)
            if (offDuration >= config.warningLevels.level1.delay && !trackingData.warningsSent.level1) {
                await sendWarningMessage(name, 'level1', offDuration);
                trackingData.warningsSent.level1 = true;
                trackingData.warningTimestamps.push({ level: 1, timestamp: currentTime });
            }
            
            // Check Level 2 warning (30 seconds)
            if (offDuration >= config.warningLevels.level2.delay && !trackingData.warningsSent.level2) {
                await sendWarningMessage(name, 'level2', offDuration);
                trackingData.warningsSent.level2 = true;
                trackingData.warningTimestamps.push({ level: 2, timestamp: currentTime });
            }
            
            // Check Level 3 warning (50 seconds)
            if (offDuration >= config.warningLevels.level3.delay && !trackingData.warningsSent.level3) {
                await sendWarningMessage(name, 'level3', offDuration);
                trackingData.warningsSent.level3 = true;
                trackingData.warningTimestamps.push({ level: 3, timestamp: currentTime });
            }
        }
    }
    
    // Send warning message to specific participant
    async function sendWarningMessage(participantName, warningLevel, offDuration) {
        const warningConfig = config.warningLevels[warningLevel];
        const durationSeconds = Math.round(offDuration / 1000);
        
        // Create unique message identifier for deduplication
        const messageId = `${participantName}-${warningLevel}`;
        
        // Check if we've already sent this message recently
        if (sentMessages.has(messageId)) {
            log(`SKIP: Skipping duplicate ${warningLevel} warning to ${participantName} (already sent recently)`);
            return;
        }
        
        // Check if we sent any message to this participant recently
        const lastTime = lastMessageTime.get(participantName);
        const now = Date.now();
        if (lastTime && (now - lastTime) < messageCooldown) {
            log(`SKIP: Skipping message to ${participantName} (sent message ${Math.round((now - lastTime) / 1000)}s ago)`);
            return;
        }
        
        // Simple host check - if aria-label contains "Host, me", skip
        const participantElements = document.querySelectorAll('[class*="participant"], [class*="attendee"]');
        for (const element of participantElements) {
            const ariaLabel = element.getAttribute('aria-label') || '';
            if (ariaLabel.includes(participantName) && ariaLabel.includes('Host, me')) {
                log(`SKIP: Skipping message to ${participantName} (is the host)`);
                return;
            }
        }
        
        log(`WARNING: Sending ${warningLevel} warning to ${participantName} (camera off for ${durationSeconds}s)`);
        
        // Customize message with participant name and duration
        let message = warningConfig.message;
        if (warningLevel === 'level2') {
            message = `Your camera has been off for ${durationSeconds} seconds. You have 20 seconds to turn it on or you'll be moved to a private room with a mentor.`;
        }
        
        log(`SEND: Attempting to send message: "${message}" to ${participantName}`);
        const success = await sendChatMessage(message, participantName);
        
        if (success) {
            log(`SUCCESS: ${warningLevel} warning sent successfully to ${participantName}`);
            
            // Add to sent messages to prevent duplicates
            sentMessages.add(messageId);
            lastMessageTime.set(participantName, Date.now());
            
            // Clean up old messages after cooldown period
            setTimeout(() => {
                sentMessages.delete(messageId);
            }, messageCooldown);
            
            // Send notification to extension
            try {
                chrome.runtime.sendMessage({
                    type: 'ZOOM_WARNING_SENT',
                    data: {
                        participant: participantName,
                        level: warningLevel,
                        duration: durationSeconds,
                        message: message,
                        timestamp: Date.now()
                    }
                }).catch(() => {
                    // Ignore errors if popup is closed
                });
            } catch (error) {
                log(`ERROR: Error sending warning notification: ${error.message}`);
            }
        } else {
            log(`ERROR: Failed to send ${warningLevel} warning to ${participantName}`);
        }
        
        // Handle Level 3 private room functionality (placeholder)
        if (warningLevel === 'level3') {
            handlePrivateRoomAssignment(participantName);
        }
    }
    
    // Private room assignment placeholder function
    function handlePrivateRoomAssignment(participantName) {
        log(`🏠 [PLACEHOLDER] Would assign ${participantName} to private room with mentor`);
        
        // Future implementation ideas:
        // 1. Use Zoom's breakout room API (when available)
        // 2. Send moderator alert to manually assign participant
        // 3. Log participant for follow-up action
        // 4. Integrate with external room management system
        
        // For now, send a notification to the monitor
        try {
            chrome.runtime.sendMessage({
                type: 'ZOOM_PRIVATE_ROOM_REQUEST',
                data: {
                    participant: participantName,
                    reason: 'Camera off for 50+ seconds - Level 3 escalation',
                    timestamp: Date.now(),
                    action: 'assign_to_private_room_with_mentor'
                }
            }).catch(() => {
                // Ignore errors if popup is closed
            });
        } catch (error) {
            log(`ERROR: Error sending private room request: ${error.message}`);
        }
    }
    
    // Send summary data to popup
    function sendSummaryToPopup(total, camerasOff, participants) {
        try {
            chrome.runtime.sendMessage({
                type: 'ZOOM_PARTICIPANT_UPDATE',
                data: {
                    total: total,
                    camerasOff: camerasOff,
                    participants: participants,
                    timestamp: Date.now()
                }
            }).catch(() => {
                // Ignore errors if popup is closed
            });
        } catch (error) {
            log(`ERROR: Error sending data to popup: ${error.message}`);
        }
    }
    
    // Check and send reminders
    function checkAndSendReminders(total, camerasOff) {
        const now = Date.now();
        if (now - lastReminderTime < config.reminderInterval) {
            return; // Too soon for another reminder
        }
        
        log(`ALERT: Sending reminder: ${camerasOff} cameras are off`);
        lastReminderTime = now;
        
        // Send reminder message
        try {
            chrome.runtime.sendMessage({
                type: 'ZOOM_REMINDER',
                data: {
                    message: `${camerasOff} participant(s) have their camera off`,
                    total: total,
                    camerasOff: camerasOff
                }
            }).catch(() => {
                // Ignore errors
            });
        } catch (error) {
            log(`ERROR: Error sending reminder: ${error.message}`);
        }
    }
    
    // Start monitoring
    async function startMonitoring() {
        if (isMonitoring) {
            log('WARNING: Already monitoring');
            return;
        }
        
        // Prevent multiple instances from running in different iframes
        if (isIframe && !window.location.href.includes('/wc/')) {
            log('WARNING: Skipping monitoring in non-meeting iframe');
            return;
        }
        
        // Check if monitoring is already started globally
        if (window.ZoomWatchMonitoringStarted) {
            log('WARNING: Monitoring already started globally - skipping');
            return;
        }
        
        // Only allow monitoring in the main iframe (not in dashboard iframes)
        if (isIframe && window.location.href.includes('/wb/embed/dashboard')) {
            log('WARNING: Skipping monitoring in dashboard iframe');
            return;
        }
        
        // Check if we have participants in this frame
        if (isIframe && !hasParticipantsNow()) {
            log('⏳ Waiting for participants to load in iframe...');
            // Wait up to 5 seconds for participants to appear
            let attempts = 0;
            const waitInterval = setInterval(async () => {
                attempts++;
                if (hasParticipantsNow()) {
                    log('SUCCESS: Participants found! Starting monitoring...');
                    clearInterval(waitInterval);
                    
                    // Open panels before starting monitoring
                    await openPanelsForMonitoring();
                    
                    isMonitoring = true;
                    isPaused = false;
                    monitorParticipants();
                    const interval = setInterval(() => {
                        if (isMonitoring && !isPaused) {
                            monitorParticipants();
                        } else {
                            clearInterval(interval);
                        }
                    }, config.checkInterval);
                } else if (attempts >= 10) { // 5 seconds (10 * 500ms)
                    log('SKIP: No participants found after waiting, but opening panels anyway...');
                    clearInterval(waitInterval);
                    
                    // Open panels even if no participants found yet
                    await openPanelsForMonitoring();
                    
                    // Start monitoring anyway - participants might appear later
                    isMonitoring = true;
                    isPaused = false;
                    monitorParticipants();
                    const interval = setInterval(() => {
                        if (isMonitoring && !isPaused) {
                            monitorParticipants();
                        } else {
                            clearInterval(interval);
                        }
                    }, config.checkInterval);
                }
            }, 500);
            return;
        }
        
        log('🚀 STARTING PARTICIPANT MONITORING...');
        
        // Add click tracking for debugging
        addClickTracking();
        
        // Set global flag to prevent multiple instances
        window.ZoomWatchMonitoringStarted = true;
        
        // Open panels before starting monitoring
        await openPanelsForMonitoring();
        
        isMonitoring = true;
        isPaused = false;
        
        // Start the monitoring loop
        monitorParticipants();
        const interval = setInterval(() => {
            if (isMonitoring && !isPaused) {
                monitorParticipants();
            } else {
                clearInterval(interval);
            }
        }, config.checkInterval);
    }
    
    // Open panels for monitoring
    async function openPanelsForMonitoring() {
        log('OPEN: Opening panels for monitoring...');
        
        // ENHANCED: Check if we're in main frame and need to look in iframes
        if (window === window.top) {
            log('INFO: Main frame detected, checking iframes for meeting interface...');
            const iframes = document.querySelectorAll('iframe');
            
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                    const iframeUrl = iframeDoc.URL || '';
                    
                    // Check if this iframe contains the meeting
                    if (iframeUrl.includes('/wc/') && iframeUrl.includes('/start')) {
                        log(`SUCCESS: Found meeting iframe ${i + 1}: ${iframeUrl}`);
                        
                        // Try to open panels in this iframe
                        const iframeZoomWatch = iframes[i].contentWindow.ZoomWatch;
                        if (iframeZoomWatch && iframeZoomWatch.openPanelsForMonitoring) {
                            log(`TARGET: Calling openPanelsForMonitoring in iframe ${i + 1}`);
                            const result = await iframeZoomWatch.openPanelsForMonitoring();
                            if (result) {
                                log(`SUCCESS: Successfully opened panels in iframe ${i + 1}`);
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    log(`WARNING: Could not access iframe ${i + 1}: ${e.message}`);
                }
            }
            
            log('WARNING: No meeting iframes found or panels could not be opened in iframes');
        }
        
        // Fallback: Try to open panels in current context
        log('INFO: Attempting to open panels in current context...');
        
        let panelsOpened = 0;
        
        // Try to open participants panel
        const participantsOpened = openParticipantsPanel();
        if (participantsOpened) {
            log('SUCCESS: Participants panel opened for monitoring');
            panelsOpened++;
        } else {
            log('WARNING: Could not open participants panel - may already be open');
        }
        
        // Wait a moment for panels to open
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to open chat panel
        const chatOpened = openChatPanel();
        if (chatOpened) {
            log('SUCCESS: Chat panel opened for monitoring');
            panelsOpened++;
        } else {
            log('WARNING: Could not open chat panel - may already be open');
        }
        
        // Wait a moment for chat panel to fully load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (panelsOpened > 0) {
            log(`SUCCESS: Successfully opened ${panelsOpened} panels for monitoring`);
        } else {
            log('ℹ️ Panels may already be open or not available in this context');
        }
        
        return panelsOpened > 0;
    }
    
    // Force open panels for monitoring (bypasses meeting detection)
    async function forceOpenPanelsForMonitoring() {
        log('⚡ FORCE OPENING PANELS FOR MONITORING...');
        
        let panelsOpened = 0;
        
        // Force open participants panel (bypass all checks)
        log('⚡ Force opening participants panel...');
        const participantsSelectors = [
            'button[aria-label*="participants" i]',
            'button[aria-label*="participant" i]',
            '[aria-label*="participants" i]',
            '[aria-label*="participant" i]',
            'button[class*="participants"]',
            'button[class*="participant"]',
            '[class*="participants"]',
            '[class*="participant"]'
        ];
        
        for (const selector of participantsSelectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                log(`⚡ Force found participants button: ${selector}`);
                log(`   Aria-label: "${button.getAttribute('aria-label')}" | Class: "${button.className}"`);
                button.click();
                log('⚡ Participants panel force opened');
                panelsOpened++;
                break;
            }
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force open chat panel (bypass all checks)
        log('⚡ Force opening chat panel...');
        const chatSelectors = [
            'button[aria-label*="chat" i]',
            '[aria-label*="chat" i]',
            'button[class*="chat"]',
            '[class*="chat"]'
        ];
        
        for (const selector of chatSelectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                const ariaLabel = button.getAttribute('aria-label') || '';
                // Skip team chat buttons
                if (ariaLabel.toLowerCase().includes('team')) {
                    continue;
                }
                log(`⚡ Force found chat button: ${selector}`);
                log(`   Aria-label: "${ariaLabel}" | Class: "${button.className}"`);
                button.click();
                log('⚡ Chat panel force opened');
                panelsOpened++;
                break;
            }
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (panelsOpened > 0) {
            log(`⚡ Successfully force opened ${panelsOpened} panels`);
        } else {
            log('⚡ No panels could be force opened');
        }
        
        return panelsOpened > 0;
    }
    
    // Debug meeting detection

    


        
        // Show all potential recipient options
        const recipientOptions = document.querySelectorAll('[role="option"], [class*="chat-receiver"], [class*="participant"], [class*="dropdown"]');
        log(`INFO: Found ${recipientOptions.length} potential recipient options:`);
        recipientOptions.forEach((option, i) => {
            if (i < 10) { // Limit to first 10
                const text = option.textContent || '';
                const ariaLabel = option.getAttribute('aria-label') || '';
                const title = option.getAttribute('title') || '';
                const visible = option.offsetWidth > 0 && option.offsetHeight > 0;
                log(`  ${i + 1}: "${text}" | aria: "${ariaLabel}" | title: "${title}" | visible: ${visible}`);
            }
        });
        
        // Show current chat input state
        const chatInput = findChatInput();
        if (chatInput) {
            log(`SUCCESS: Chat input found: ${chatInput.tagName}.${chatInput.className}`);
            log(`   Value: "${chatInput.value || chatInput.textContent}"`);
        } else {
            log('ERROR: Chat input not found');
        }
        
        // Show current recipient display
        const recipientDisplay = document.querySelector('[aria-label*="Everyone"], .chat-receiver-list__receiver, [class*="chat-receiver"]');
        if (recipientDisplay) {
            log(`SEND: Current recipient display: "${recipientDisplay.textContent}"`);
        } else {
            log('ERROR: No recipient display found');
        }
        
        // Show all participant elements that could be clicked
        const participantElements = document.querySelectorAll('[class*="participant"], [class*="attendee"], [role="listitem"]');
        log(`PARTICIPANTS: Found ${participantElements.length} participant elements that could be clicked:`);
        participantElements.forEach((element, i) => {
            if (i < 10) { // Limit to first 10
                const text = element.textContent || '';
                const visible = element.offsetWidth > 0 && element.offsetHeight > 0;
                log(`  ${i + 1}: "${text}" | visible: ${visible}`);
            }
        });
        
        log('=== END RECIPIENT SELECTION DEBUG ===');
    }
    

    
    // Check if chat panel is currently open
    function isChatPanelOpen() {
        log('Checking if chat panel is open...');
        
        // Look for chat panel indicators with more specific Zoom selectors
        const chatPanelSelectors = [
            // Zoom-specific chat panel classes
            '.chat-panel',
            '.chat-container', 
            '.chat-window',
            '.meeting-chat',
            '[class*="chat-panel"]',
            '[class*="chat-container"]',
            '[class*="chat-window"]',
            '[class*="meeting-chat"]',
            // More specific Zoom selectors
            '[class*="chat"]:not([class*="team"])',
            '[class*="message"]:not([class*="team"])'
        ];
        
        for (const selector of chatPanelSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                log(`SUCCESS: Found chat panel with selector: ${selector}`);
                log(`   Element: ${element.outerHTML.substring(0, 150)}...`);
                return true;
            }
        }
        
        // Check for chat input field with more specific selectors
        const chatInputSelectors = [
            '[class*="chat-rtf-box"] [contenteditable="true"]',
            '[class*="chat-input"]',
            '[class*="message-input"]',
            'textarea[placeholder*="message"]',
            'input[placeholder*="message"]',
            'textarea[placeholder*="chat"]',
            'input[placeholder*="chat"]',
            '[contenteditable="true"][placeholder*="message"]',
            '[contenteditable="true"][placeholder*="chat"]'
        ];
        
        for (const selector of chatInputSelectors) {
            const chatInput = document.querySelector(selector);
            if (chatInput) {
                log(`SUCCESS: Found chat input field with selector: ${selector}`);
                log(`   Input element: ${chatInput.outerHTML.substring(0, 100)}...`);
                return true;
            }
        }
        
        // Check for "to: Everyone" text (recipient selector) with more specific selectors
        const recipientSelectors = [
            '.chat-receiver-list__to-text',
            '[class*="chat-receiver"]',
            '[class*="recipient"]',
            '[class*="to-text"]',
            '[class*="everyone"]',
            '[class*="chat-to"]'
        ];
        
        for (const selector of recipientSelectors) {
            const recipientText = document.querySelector(selector);
            if (recipientText && recipientText.textContent?.includes('to:')) {
                log(`SUCCESS: Found recipient selector with selector: ${selector}`);
                log(`   Recipient text: "${recipientText.textContent}"`);
                return true;
            }
        }
        
        // Check for "Meeting Chat" title text
        const chatTitleSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            '[class*="title"]',
            '[class*="header"]',
            '[class*="panel-title"]'
        ];
        
        for (const selector of chatTitleSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent?.trim() || '';
                if (text.toLowerCase().includes('meeting chat') || text.toLowerCase().includes('chat')) {
                    log(`SUCCESS: Found chat title with selector: ${selector}`);
                    log(`   Title text: "${text}"`);
                    return true;
                }
            }
        }
        
        // Debug: log what we found
        log('INFO: Debug: Checking all elements with "chat" in class or text...');
        const allElements = document.querySelectorAll('*');
        let chatElements = [];
        
        for (const element of allElements) {
            const className = element.className || '';
            const text = element.textContent?.trim() || '';
            const ariaLabel = element.getAttribute('aria-label') || '';
            
            if (className.toLowerCase().includes('chat') || 
                text.toLowerCase().includes('chat') ||
                ariaLabel.toLowerCase().includes('chat')) {
                chatElements.push({
                    tag: element.tagName,
                    class: className,
                    text: text.substring(0, 50),
                    ariaLabel: ariaLabel
                });
            }
        }
        
        if (chatElements.length > 0) {
            log(`INFO: Found ${chatElements.length} elements with "chat" references:`);
            chatElements.slice(0, 10).forEach((elem, i) => {
                log(`   ${i + 1}: ${elem.tag}.${elem.class} | "${elem.text}" | aria: "${elem.ariaLabel}"`);
            });
        }
        
        log('ERROR: Chat panel not detected as open');
        return false;
    }
    
    // Debug participant selector in chat
    }
    
    // Stop monitoring
    function stopMonitoring() {
        log('STOP: STOPPING PARTICIPANT MONITORING...');
        isMonitoring = false;
        isPaused = false;
        
        // Clear global flag
        window.ZoomWatchMonitoringStarted = false;
        
        // Clear message cache when stopping
        sentMessages.clear();
        lastMessageTime.clear();
        log('CLEAN: Cleared message cache');
    }
    
    // Pause monitoring
    function pauseMonitoring() {
        log('PAUSE: PAUSING PARTICIPANT MONITORING...');
        isPaused = true;
    }
    
    // Resume monitoring
    function resumeMonitoring() {
        log('RESUME: RESUMING PARTICIPANT MONITORING...');
        isPaused = false;
    }
        
        // Handle messages from popup
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        // Only accept our messages
        if (!message || message.source !== 'zoomwatch') return;
        
        // Only the top frame handles popup-triggered actions
        if (window !== window.top) return;
        
        log(`MESSAGE: [TOP FRAME] Received message: ${message.action}`);
        
        try {
        switch (message.action) {
            case 'startMonitoring':
            startMonitoring();
                sendResponse({ success: true, message: 'Monitoring started' });
                break;
                
            case 'stopMonitoring':
            stopMonitoring();
                sendResponse({ success: true, message: 'Monitoring stopped' });
                break;
                
            case 'pauseMonitoring':
                pauseMonitoring();
                sendResponse({ success: true, message: 'Monitoring paused' });
                break;
                
            case 'resumeMonitoring':
                resumeMonitoring();
                sendResponse({ success: true, message: 'Monitoring resumed' });
                break;
                
            case 'exploreInterface':
                const exploreResult = exploreZoomInterface();
                sendResponse({ success: true, data: exploreResult });
                break;
                
            case 'findClickableElements':
                const elementsResult = findClickableElements();
                sendResponse({ success: true, data: elementsResult });
                break;
                
            case 'analyzePanels':
                const panelsResult = analyzePanels();
                sendResponse({ success: true, data: panelsResult });
                break;
                
            case 'interceptEvents':
                const interceptResult = interceptZoomEvents();
                sendResponse({ success: true, data: interceptResult });
                break;
                
            case 'findAPIs':
                const apisResult = findZoomAPIs();
                sendResponse({ success: true, data: apisResult });
                break;
                
            case 'debugPanelButtons':
                debugPanelButtons();
                sendResponse({ success: true, message: 'Panel buttons debug complete - check console' });
                break;
                
            case 'debugChatButtons':
                debugChatButtons();
                sendResponse({ success: true, message: 'Chat buttons debug complete - check console' });
                break;
                
            case 'checkMeetingContext':
                const isMeeting = isInZoomMeeting();
                sendResponse({ success: true, data: isMeeting });
                break;
                
            case 'openPanels':
                openPanelsForMonitoring();
                sendResponse({ success: true, message: 'Panels opened - check console' });
                break;
                
            case 'forceOpenPanels':
                forceOpenPanelsForMonitoring();
                sendResponse({ success: true, message: 'Panels force opened - check console' });
                break;
                
            case 'debugMeetingDetection':
                debugMeetingDetection();
                sendResponse({ success: true, message: 'Meeting detection debug complete - check console' });
                break;
                
            case 'debugRecipientSelection':
                debugRecipientSelection();
                sendResponse({ success: true, message: 'Recipient selection debug complete - check console' });
                break;
                
            case 'forceSelectRecipient':
                forceSelectRecipient('Abhi 2'); // Test with a specific participant
                sendResponse({ success: true, message: 'Force selection complete - check console' });
                break;
                
            case 'debugMessageDeduplication':
                debugMessageDeduplication();
                sendResponse({ success: true, message: 'Message deduplication debug complete - check console' });
                break;
                
            case 'debugParticipantSelector':
                log('INFO: DEBUG: About to call debugParticipantSelector');
                (async () => {
                    try {
                        log('INFO: DEBUG: Function exists, calling it...');
                        log('INFO: DEBUG: Function type: ' + typeof debugParticipantSelector);
                        if (typeof debugParticipantSelector === 'function') {
                            const result = await debugParticipantSelector();
                            log(`INFO: DEBUG: debugParticipantSelector returned: ${result}`);
                            sendResponse({ success: true, message: 'Participant selector debug complete - check console' });
                        } else {
                            log('ERROR: ERROR: debugParticipantSelector is not a function');
                            sendResponse({ success: false, message: 'Function not found' });
                        }
                    } catch (error) {
                        log(`ERROR: ERROR calling debugParticipantSelector: ${error.message}`);
                        log(`ERROR: ERROR stack: ${error.stack}`);
                        sendResponse({ success: false, message: `Error: ${error.message}` });
                    }
                })();
                return true; // Keep message channel open for async response
                break;
                
            case 'requestData':
                const summary = localStorage.getItem('zoomwatch_summary');
                const participants = JSON.parse(localStorage.getItem('zoomwatch_participants') || '[]');
                const total = participants.length;
                const camerasOff = participants.filter(p => !p.cameraOn).length;
                
                // Include tracking data in response
                const trackingArray = Array.from(participantTracking.entries()).map(([name, data]) => ({
                    name,
                    ...data
                }));
                
                sendResponse({
                    success: true,
                    data: {
                        total: total,
                        camerasOff: camerasOff,
                        participants: participants,
                        trackingData: trackingArray,
                        monitorProfile: 'Extension User (Monitor)'
                    }
                });
                break;
                
            case 'testChatMessage':
                log('TEST: Testing chat message functionality...');
                (async () => {
                    const testSuccess = await sendChatMessage(
                        message.data?.message || 'Test message from ZoomWatch', 
                        message.data?.recipient || 'Everyone'
                    );
                    sendResponse({ success: testSuccess, message: testSuccess ? 'Test message sent' : 'Test message failed' });
                })();
                return true; // Keep channel open for async response
                break;
                
            case 'toggleAutoWarnings':
                config.enableAutoWarnings = !config.enableAutoWarnings;
                log(`ALERT: Auto-warnings ${config.enableAutoWarnings ? 'enabled' : 'disabled'}`);
                sendResponse({ success: true, enabled: config.enableAutoWarnings });
                break;
                
            case 'openParticipants':
                const openParticipantsResult = openParticipantsPanel();
                sendResponse({ success: openParticipantsResult, message: openParticipantsResult ? 'Participants panel opened' : 'Failed to open participants panel' });
                break;
                
            case 'closeParticipants':
                const closeParticipantsResult = closeParticipantsPanel();
                sendResponse({ success: closeParticipantsResult, message: closeParticipantsResult ? 'Participants panel closed' : 'Failed to close participants panel' });
                break;
                
            case 'openChat':
                const openChatResult = openChatPanel();
                sendResponse({ success: openChatResult, message: openChatResult ? 'Chat panel opened' : 'Failed to open chat panel' });
                break;
                
            case 'closeChat':
                const closeChatResult = closeChatPanel();
                sendResponse({ success: closeChatResult, message: closeChatResult ? 'Chat panel closed' : 'Failed to close chat panel' });
                break;
                
            case 'ZOOMWATCH_PING':
                sendResponse({ success: true, message: 'Pong from content script' });
                break;
                
            case 'testSimple':
                log('TEST: TEST: Simple test case working');
                sendResponse({ success: true, message: 'Simple test working' });
                break;
                
            default:
                log(`ERROR: Unknown action: ${message.action}`);
                sendResponse({ success: false, message: 'Unknown action' });
        }
        } catch (e) {
            log(`ERROR: Handler error: ${e.message}`);
            sendResponse({ success: false, message: `Handler error: ${e.message}` });
        }
        
        return true; // Keep message channel open
    });
    

    
    window.ZoomWatch = {
        startMonitoring,
        stopMonitoring,
        pauseMonitoring,
        resumeMonitoring,
        monitorParticipants,
        findParticipantsList,
        parseParticipants,
        // New warning system functions
        sendChatMessage,
        updateParticipantTracking,
        checkAndSendAutomatedWarnings,
        sendWarningMessage,
        // Panel control functions
        openParticipantsPanel,
        closeParticipantsPanel,
        openChatPanel,
        closeChatPanel,
        // Debug and utility functions
        findChatInput,
        findChatSendButton,
        selectChatRecipient,
        openPanelsForMonitoring,
        forceOpenPanelsForMonitoring,
        debugMeetingDetection,
        debugRecipientSelection,
        forceSelectRecipient,
        debugMessageDeduplication,
        debugParticipantSelector,
        debugPanelButtons,
        debugChatButtons,
        isInZoomMeeting,
        getTrackingData: () => Array.from(participantTracking.entries()),
        getConfig: () => config,
        toggleAutoWarnings: () => {
            config.enableAutoWarnings = !config.enableAutoWarnings;
            return config.enableAutoWarnings;
        },
        testMessage: async (message, recipient) => {
            return await sendChatMessage(message || 'Test from ZoomWatch', recipient || 'Everyone');
        },
        // New debugging and reverse engineering functions
        exploreZoomInterface: () => exploreZoomInterface(),
        findClickableElements: () => findClickableElements(),
        analyzePanels: () => analyzePanels(),
        interceptZoomEvents: () => interceptZoomEvents(),
        findZoomAPIs: () => findZoomAPIs(),

        version: '3.0.0'
    };
    
    // === ZOOM INTERFACE REVERSE ENGINEERING FUNCTIONS ===
    
    // Simple test that runs immediately
    console.log('INFO: IMMEDIATE TEST - Script execution started');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Window object exists:', typeof window !== 'undefined');
    console.log('Document object exists:', typeof document !== 'undefined');
    
    // Comprehensive Zoom interface exploration
    function exploreZoomInterface() {
        log('INFO: === ZOOM INTERFACE EXPLORATION ===');
        
        // Find all buttons and clickable elements
        const buttons = document.querySelectorAll('button, [role="button"], .clickable, [onclick]');
        log(`BUTTONS: Found ${buttons.length} clickable elements`);
        
        const interestingButtons = [];
        buttons.forEach((btn, i) => {
            const text = btn.textContent?.trim() || '';
            const ariaLabel = btn.getAttribute('aria-label') || '';
            const title = btn.title || '';
            const className = btn.className || '';
            const id = btn.id || '';
            
            // Look for participant, chat, or panel related buttons
            if (text.toLowerCase().includes('participant') || 
                text.toLowerCase().includes('chat') ||
                text.toLowerCase().includes('panel') ||
                ariaLabel.toLowerCase().includes('participant') ||
                ariaLabel.toLowerCase().includes('chat') ||
                className.toLowerCase().includes('participant') ||
                className.toLowerCase().includes('chat') ||
                id.toLowerCase().includes('participant') ||
                id.toLowerCase().includes('chat')) {
                
                interestingButtons.push({
                    index: i,
                    text: text.substring(0, 50),
                    ariaLabel: ariaLabel.substring(0, 50),
                    title: title.substring(0, 50),
                    className: className.substring(0, 100),
                    id: id,
                    element: btn
                });
            }
        });
        
        log(`TARGET: Found ${interestingButtons.length} interesting buttons:`);
        interestingButtons.forEach((btn, i) => {
            log(`  ${i + 1}. "${btn.text}" | aria: "${btn.ariaLabel}" | class: "${btn.className}"`);
        });
        
        return { allButtons: buttons, interestingButtons };
    }
    
    // Find all clickable elements with detailed analysis
    function findClickableElements() {
        log('INFO: === CLICKABLE ELEMENTS ANALYSIS ===');
        
        const clickableSelectors = [
            'button',
            '[role="button"]',
            '[onclick]',
            '.clickable',
            'a[href]',
            'input[type="button"]',
            'input[type="submit"]',
            '[tabindex="0"]',
            '[aria-pressed]',
            '[data-tooltip*="participant" i]',
            '[data-tooltip*="chat" i]',
            '[aria-label*="participant" i]',
            '[aria-label*="chat" i]'
        ];
        
        const results = {};
        
        clickableSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                results[selector] = Array.from(elements).map(el => ({
                    text: el.textContent?.trim().substring(0, 30) || '',
                    ariaLabel: el.getAttribute('aria-label') || '',
                    className: el.className || '',
                    id: el.id || '',
                    visible: el.offsetWidth > 0 && el.offsetHeight > 0
                })).filter(item => 
                    item.text.toLowerCase().includes('participant') ||
                    item.text.toLowerCase().includes('chat') ||
                    item.ariaLabel.toLowerCase().includes('participant') ||
                    item.ariaLabel.toLowerCase().includes('chat')
                );
            }
        });
        
        log('TARGET: Clickable elements by selector:');
        Object.entries(results).forEach(([selector, elements]) => {
            if (elements.length > 0) {
                log(`  ${selector}: ${elements.length} elements`);
                elements.forEach((el, i) => {
                    log(`    ${i + 1}: "${el.text}" | "${el.ariaLabel}" | visible: ${el.visible}`);
                });
            }
        });
        
        return results;
    }
    
    // Analyze panel states and structures
    function analyzePanels() {
        log('INFO: === PANEL ANALYSIS ===');
        
        // Look for panel containers
        const panelSelectors = [
            '[class*="panel"]',
            '[class*="sidebar"]',
            '[class*="drawer"]',
            '[id*="panel"]',
            '[id*="sidebar"]',
            '[data-testid*="panel"]',
            '[role="dialog"]',
            '[role="complementary"]'
        ];
        
        const panels = [];
        panelSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.offsetWidth > 200 && el.offsetHeight > 200) { // Significant size
                    panels.push({
                        selector,
                        className: el.className,
                        id: el.id,
                        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
                        width: el.offsetWidth,
                        height: el.offsetHeight,
                        contains: {
                            participants: el.textContent?.toLowerCase().includes('participant') || false,
                            chat: el.textContent?.toLowerCase().includes('chat') || el.textContent?.toLowerCase().includes('message') || false
                        }
                    });
                }
            });
        });
        
        log(`📋 Found ${panels.length} potential panels:`);
        panels.forEach((panel, i) => {
            log(`  ${i + 1}: ${panel.selector} | ${panel.width}x${panel.height} | visible: ${panel.visible}`);
            log(`      contains - participants: ${panel.contains.participants}, chat: ${panel.contains.chat}`);
        });
        
        return panels;
    }
    
    // Intercept and log Zoom events
    function interceptZoomEvents() {
        log('INFO: === ZOOM EVENT INTERCEPTION ===');
        
        // Override common event methods to see what's happening
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type.includes('click') || type.includes('participant') || type.includes('chat')) {
                log(`📡 Event listener added: ${type} on ${this.tagName || 'unknown'}`);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        // Log clicks on interesting elements
        document.addEventListener('click', function(e) {
            const target = e.target;
            const text = target.textContent?.trim() || '';
            const ariaLabel = target.getAttribute('aria-label') || '';
            
            if (text.toLowerCase().includes('participant') || 
                text.toLowerCase().includes('chat') ||
                ariaLabel.toLowerCase().includes('participant') ||
                ariaLabel.toLowerCase().includes('chat')) {
                log(`CLICK: Clicked: "${text}" | aria: "${ariaLabel}" | tag: ${target.tagName}`);
                log(`   Classes: ${target.className}`);
                log(`   ID: ${target.id}`);
            }
        }, true);
        
        log('SUCCESS: Event interception started - perform actions now!');
        return 'Event interception active';
    }
    
    // Find Zoom's internal APIs and global objects
    function findZoomAPIs() {
        log('INFO: === ZOOM API DISCOVERY ===');
        
        const zoomObjects = [];
        
        // Look for Zoom-related global objects
        const globalKeys = Object.keys(window);
        const zoomKeys = globalKeys.filter(key => 
            key.toLowerCase().includes('zoom') ||
            key.toLowerCase().includes('meet') ||
            key.toLowerCase().includes('participant') ||
            key.toLowerCase().includes('chat')
        );
        
        log(`🌐 Global Zoom-related objects: ${zoomKeys.join(', ')}`);
        
        zoomKeys.forEach(key => {
            try {
                const obj = window[key];
                if (obj && typeof obj === 'object') {
                    const methods = Object.getOwnPropertyNames(obj).filter(prop => 
                        typeof obj[prop] === 'function'
                    );
                    if (methods.length > 0) {
                        zoomObjects.push({
                            name: key,
                            methods: methods.slice(0, 10), // First 10 methods
                            type: typeof obj
                        });
                    }
                }
            } catch (e) {
                // Ignore access errors
            }
        });
        
        log('🔧 Zoom objects with methods:');
        zoomObjects.forEach(obj => {
            log(`  ${obj.name}: ${obj.methods.join(', ')}`);
        });
        
        // Look for React components or Angular modules
        const reactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#root');
        if (reactRoot) {
            log('⚛️ React application detected');
        }
        
        // Look for data attributes that might indicate API endpoints
        const elementsWithData = document.querySelectorAll('*[data-testid], *[data-zoom], *[data-id]');
        const apiHints = [];
        elementsWithData.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-') && 
                    (attr.value.includes('participant') || 
                     attr.value.includes('chat') ||
                     attr.value.includes('panel'))) {
                    apiHints.push(`${attr.name}="${attr.value}"`);
                }
            });
        });
        
        if (apiHints.length > 0) {
            log('💡 API hints from data attributes:');
            apiHints.slice(0, 10).forEach(hint => log(`  ${hint}`));
        }
        
        return { zoomObjects, apiHints };
    }
    
    // Check if we're in a Zoom meeting context
    function isInZoomMeeting() {
        const url = window.location.href;
        
        // More comprehensive meeting detection
        const isMeeting = url.includes('/wc/join') || 
                         url.includes('/meeting/') || 
                         url.includes('/start?') ||
                         url.includes('/wc/') ||
                         url.includes('/wb/') ||  // Whiteboard/meeting interface
                         url.includes('/pwa/') || // PWA meeting interface
                         url.includes('zoom.us') && (url.includes('join') || url.includes('start') || url.includes('meeting'));
        
        // Additional checks for iframe context
        const hasMeetingElements = document.querySelector('[class*="meeting"], [class*="participant"], [class*="chat"], [class*="footer"]') !== null;
        const hasVideoElements = document.querySelector('video, [class*="video"], [class*="camera"]') !== null;
        
        // For iframes, be more lenient - if we're on zoom.us and have meeting-like elements, consider it a meeting
        const isIframeMeeting = isIframe && url.includes('zoom.us') && (hasMeetingElements || hasVideoElements);
        
        const finalResult = isMeeting || isIframeMeeting;
        
        log(`INFO: URL check: ${url}`);
        log(`INFO: Is in meeting: ${finalResult} (base: ${isMeeting}, iframe: ${isIframeMeeting})`);
        log(`INFO: Has meeting elements: ${hasMeetingElements}, Has video: ${hasVideoElements}`);
        
        return finalResult;
    }
    }
    
            }
            
            // Wait for chat panel to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Look for the participant in the participants list
            const participantElements = document.querySelectorAll('[class*="participant"], [class*="attendee"], [role="listitem"]');
            
            for (const element of participantElements) {
                const text = element.textContent || '';
                if (text.includes(recipientName)) {
                    log(`SUCCESS: Found participant element: "${text}"`);
                    
                    // Click on the participant to select them
                    element.click();
                    log(`SUCCESS: Clicked on participant: ${recipientName}`);
                    
                    // Wait for selection to take effect
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Now try to send a test message
                    const testMessage = `Test message to ${recipientName}`;
                    const success = await sendChatMessage(testMessage, recipientName);
                    
                    if (success) {
                        log(`SUCCESS: Force selection successful for ${recipientName}`);
                        return true;
                    } else {
                        log(`ERROR: Force selection failed for ${recipientName}`);
                        return false;
                    }
                }
            }
            
            log(`ERROR: Participant ${recipientName} not found in participant list`);
            return false;
            
        } catch (error) {
            log(`ERROR: Error in force selection: ${error.message}`);
            return false;
        }
    }
    
    // Find clickable parent element
    function findClickableParent(element, maxLevels = 5) {
        let current = element;
        let level = 0;
        
        while (current && level < maxLevels) {
            // Check if current element is clickable
            if (isElementClickable(current)) {
                return current;
            }
            
            // Move to parent
            current = current.parentElement;
            level++;
        }
        
        return null;
    }
    
    // Check if an element is clickable
    function isElementClickable(element) {
        return element.onclick || 
               element.getAttribute('role') === 'button' || 
               element.getAttribute('tabindex') !== null ||
               element.tagName === 'BUTTON' ||
               element.tagName === 'A' ||
               element.className.includes('clickable') ||
               element.className.includes('selectable') ||
               element.className.includes('item') ||
               element.className.includes('option') ||
               element.className.includes('menu-item') ||
               element.className.includes('list-item');
    }
    
    // React-compatible event sequence for Zoom's dropdown menus
    async function selectMenuItemReacty(el, win) {
        const w = win || window;
        // Bring into view & focus — React often checks focus/hover
        el.scrollIntoView({ block: 'nearest' });
        try { el.focus({ preventScroll: true }); } catch {}

        const seq = [
            ['pointerover', {bubbles:true}],
            ['mouseover',   {bubbles:true}],
            ['pointerdown', {bubbles:true, button:0}],
            ['mousedown',   {bubbles:true, button:0}],
            ['pointerup',   {bubbles:true, button:0}],
            ['mouseup',     {bubbles:true, button:0}],
            ['click',       {bubbles:true, button:0}],
            // Some Zoom builds commit via keyboard:
            ['keydown',     {bubbles:true, key:'Enter', code:'Enter', keyCode:13, which:13}],
            ['keyup',       {bubbles:true, key:'Enter', code:'Enter', keyCode:13, which:13}],
        ];

        for (const [type, opts] of seq) {
            const Ctor = type.startsWith('key') ? w.KeyboardEvent : (type.startsWith('pointer') ? w.PointerEvent : w.MouseEvent);
            el.dispatchEvent(new Ctor(type, Object.assign({ cancelable:true, view:w }, opts)));
            await new Promise(r => setTimeout(r, 30));
        }
    }

    // Find the iframe that owns the chat receiver button
    function findReceiverOwnerIframe() {
        for (const iframe of document.querySelectorAll('iframe')) {
            try {
                const d = iframe.contentDocument || iframe.contentWindow.document;
                if (d.querySelector('button.chat-receiver-list__receiver, [class*="chat-receiver"][role="button"], .chat-rtf-box [contenteditable="true"]')) {
                    return { iframe, doc: d, win: iframe.contentWindow };
                }
            } catch {}
        }
        return { iframe: null, doc: document, win: window }; // fallback
    }

    // ProseMirror-compatible text setting for chat inputs
    function setProseMirrorText(editableEl, text) {
        try {
            editableEl.focus();
            
            // Method 1: Try execCommand (legacy but sometimes works)
            try {
                editableEl.execCommand('selectAll', false, null);
                editableEl.execCommand('insertText', false, text);
                log('SUCCESS: Used execCommand method for text input');
            } catch (e) {
                log('WARNING: execCommand failed, trying alternative methods');
            }
            
            // Method 2: Direct textContent assignment (for contenteditable)
            if (editableEl.isContentEditable) {
                editableEl.textContent = text;
                log('SUCCESS: Used textContent method for contenteditable');
            } else if (editableEl.value !== undefined) {
                editableEl.value = text;
                log('SUCCESS: Used value method for input element');
            }
            
            // Method 3: Dispatch input event to trigger React state update
            editableEl.dispatchEvent(new InputEvent('input', { 
                bubbles: true, 
                inputType: 'insertText', 
                data: text 
            }));
            
            // Method 4: Also try change event
            editableEl.dispatchEvent(new Event('change', { bubbles: true }));
            
            log(`SUCCESS: Text "${text}" set in chat input`);
            
        } catch (error) {
            log(`ERROR: Error setting text: ${error.message}`);
            // Fallback: just set text content directly
            if (editableEl.isContentEditable) {
                editableEl.textContent = text;
            } else if (editableEl.value !== undefined) {
                editableEl.value = text;
            }
        }
    }

    // Check if element is clickable (from ChatGPT working code)
    function isClickable(el) {
        if (!el) return false;
        const role = (el.getAttribute('role') || '').toLowerCase();
        const cls = el.className || '';
        return (
            el.onclick ||
            role === 'button' ||
            el.getAttribute('tabindex') !== null ||
            el.tagName === 'BUTTON' ||
            el.tagName === 'A' ||
            cls.includes('clickable') ||
            cls.includes('selectable') ||
            cls.includes('menu-item') ||
            cls.includes('list-item') ||
            cls.includes('option')
        );
    }

    // Try multiple click strategies based on our click tracking discoveries
    async function tryMultipleClickStrategies(element) {
        log(`TARGET: Trying multiple click strategies for element: ${element.tagName}.${element.className}`);
        
        let anyStrategyWorked = false;
        
        // Strategy 1: Direct click
        try {
            log('INFO: Strategy 1: Direct click');
            element.click();
            await new Promise(resolve => setTimeout(resolve, 200));
            anyStrategyWorked = true;
            log('SUCCESS: Strategy 1 completed');
        } catch (e) {
            log(`ERROR: Strategy 1 failed: ${e.message}`);
        }
        
        // Strategy 2: MouseEvent dispatch (more realistic)
        try {
            log('INFO: Strategy 2: MouseEvent dispatch');
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(clickEvent);
            await new Promise(resolve => setTimeout(resolve, 200));
            anyStrategyWorked = true;
            log('SUCCESS: Strategy 2 completed');
        } catch (e) {
            log(`ERROR: Strategy 2 failed: ${e.message}`);
        }
        
        // Strategy 3: Click on parent container (based on our click tracking)
        try {
            log('INFO: Strategy 3: Click on parent container');
            const parent = element.parentElement;
            if (parent) {
                parent.click();
                await new Promise(resolve => setTimeout(resolve, 200));
                anyStrategyWorked = true;
                log('SUCCESS: Strategy 3 completed');
            }
        } catch (e) {
            log(`ERROR: Strategy 3 failed: ${e.message}`);
        }
        
        // Strategy 4: Find and click on the actual clickable element
        try {
            log('INFO: Strategy 4: Find actual clickable element');
            const clickableElement = findClickableParent(element, 3);
            if (clickableElement) {
                clickableElement.click();
                await new Promise(resolve => setTimeout(resolve, 200));
                anyStrategyWorked = true;
                log('SUCCESS: Strategy 4 completed');
            }
        } catch (e) {
            log(`ERROR: Strategy 4 failed: ${e.message}`);
        }
        
        // Strategy 5: Try to trigger React events (Zoom's internal system)
        try {
            log('INFO: Strategy 5: Trigger React events');
            
            // Create a more comprehensive event that React might recognize
            const reactEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: 1,
                button: 0
            });
            
            // Dispatch mousedown first, then click
            element.dispatchEvent(reactEvent);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const reactClickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: 1,
                button: 0
            });
            
            element.dispatchEvent(reactClickEvent);
            await new Promise(resolve => setTimeout(resolve, 200));
            anyStrategyWorked = true;
            log('SUCCESS: Strategy 5 completed');
        } catch (e) {
            log(`ERROR: Strategy 5 failed: ${e.message}`);
        }
        
        // Strategy 6: Try to find and trigger the actual React component
        try {
            log('INFO: Strategy 6: Find React component and trigger');
            
            // Look for React internal properties
            const reactKey = Object.keys(element).find(key => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$'));
            if (reactKey) {
                log(`INFO: Found React property: ${reactKey}`);
                
                // Try to access React's internal event handlers
                const reactProps = element[reactKey];
                if (reactProps && reactProps.onClick) {
                    log('INFO: Triggering React onClick handler directly!');
                    reactProps.onClick(new MouseEvent('click'));
                    await new Promise(resolve => setTimeout(resolve, 200));
                    anyStrategyWorked = true;
                    log('SUCCESS: Strategy 6 completed');
                }
            } else {
                log('INFO: No React properties found on element');
            }
        } catch (e) {
            log(`ERROR: Strategy 6 failed: ${e.message}`);
        }
        
        // Strategy 7: Try to find the exact menuitemradio element from click tracking
        try {
            log('INFO: Strategy 7: Find exact menuitemradio element');
            
            // Look for the exact element we saw in click tracking
            const menuitemElements = document.querySelectorAll('[role="menuitemradio"]');
            log(`INFO: Found ${menuitemElements.length} menuitemradio elements`);
            
            for (const menuitem of menuitemElements) {
                const text = menuitem.textContent?.trim() || '';
                if (text === 'Abhi 2') {
                    log(`TARGET: FOUND EXACT MENUITEM ELEMENT: ${menuitem.tagName}.${menuitem.className}`);
                    
                    // Try to trigger the actual React event
                    try {
                        // Look for React internal properties
                        const reactKey = Object.keys(menuitem).find(key => key.startsWith('__reactProps$'));
                        if (reactKey) {
                            log(`INFO: Found React property: ${reactKey}`);
                            const reactProps = menuitem[reactKey];
                            
                            if (reactProps && reactProps.onClick) {
                                log('INFO: Triggering React onClick directly!');
                                reactProps.onClick(new MouseEvent('click'));
                                await new Promise(resolve => setTimeout(resolve, 500));
                                anyStrategyWorked = true;
                                log('SUCCESS: Strategy 7 React onClick triggered!');
                                break;
                            }
                        }
                        
                        // If no React props, try comprehensive event dispatch
                        log('INFO: No React props, trying comprehensive event dispatch...');
                        const events = ['mousedown', 'mouseup', 'click'];
                        for (const eventType of events) {
                            const event = new MouseEvent(eventType, {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                detail: 1,
                                button: 0
                            });
                            menuitem.dispatchEvent(event);
                            log(`SUCCESS: Dispatched ${eventType} event`);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        anyStrategyWorked = true;
                        log('SUCCESS: Strategy 7 comprehensive events completed');
                    } catch (e) {
                        log(`ERROR: Strategy 7 React handling failed: ${e.message}`);
                    }
                }
            }
        } catch (e) {
            log(`ERROR: Strategy 7 failed: ${e.message}`);
        }
        
        if (anyStrategyWorked) {
            log('SUCCESS: At least one strategy completed successfully');
            return true;
        } else {
            log('ERROR: All click strategies failed');
            return false;
        }
    }
    
    log('SUCCESS: ZoomWatch content script loaded and ready!');
    
    // Immediate inline test
    console.log('INFO: INLINE TEST - Extension just loaded');
    console.log('Functions available:', {

        ZoomWatch: typeof window.ZoomWatch
    });
    
    // Basic test to see if the script is running at all
    console.log('INFO: BASIC TEST - Script is running');
    console.log('Current URL:', window.location.href);
    console.log('Is in iframe:', window !== window.top);
    console.log('Document ready state:', document.readyState);
    
    // Call the debug function to see extension context
    debugExtensionContext();
    
    // Automatically start click tracking for debugging
    console.log('INFO: Auto-starting click tracking...');
    setTimeout(() => {
        try {
            addClickTracking();
            console.log('SUCCESS: Click tracking started automatically!');
            console.log('TARGET: Now click on the "Everyone" button and then on a participant name to see what gets logged');
        } catch (e) {
            console.log('ERROR: Error starting click tracking:', e.message);
        }
    }, 2000); // Wait 2 seconds for everything to load
    
    // Add a simple check to verify the extension is working
    setTimeout(() => {
        console.log('INFO: Checking global functions...');
        console.log('startClickTracking:', typeof window.startClickTracking);
        console.log('testZoomWatch:', typeof window.testZoomWatch);
        console.log('debugZoomWatch:', typeof window.debugZoomWatch);
        console.log('ZoomWatch object:', typeof window.ZoomWatch);
        
        if (window.startClickTracking) {
            console.log('SUCCESS: Global functions are available');
        } else {
            console.log('ERROR: Global functions are not available');
        }
        
        if (window.ZoomWatch) {
            console.log('SUCCESS: ZoomWatch object is available');
        } else {
            log('ERROR: ZoomWatch object is not available');
        }
        
        // Try to create a simple test function in the main frame
        try {
            window.testSimpleFunction = function() {
                console.log('TARGET: Simple test function works!');
                return 'SUCCESS';
            };
            console.log('SUCCESS: Created testSimpleFunction:', typeof window.testSimpleFunction);
            
            // Test calling it
            const result = window.testSimpleFunction();
            console.log('SUCCESS: Called testSimpleFunction, result:', result);
        } catch (e) {
            console.log('ERROR: Error creating test function:', e.message);
        }
    }, 1000);
    
})();