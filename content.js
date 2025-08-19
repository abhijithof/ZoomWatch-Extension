// ZoomWatch Extension - Simple Participant Monitor
// Focuses on the Participants tab: names + camera status icons

(function() {
    'use strict';
    
    // Check if we're in an iframe
    const isMainFrame = window === window.top;
    const isIframe = !isMainFrame;
    
    // Logging function with frame indicator
    function log(message) {
        const frameInfo = isIframe ? '[IFRAME]' : '[MAIN]';
        console.log(`[ZoomWatch] ${frameInfo} ${message}`);
    }
    
    // Function to check if participants exist (can be called multiple times)
    function hasParticipantsNow() {
        // In iframe, check current document
        if (isIframe) {
            return document.querySelector('.participants-section-container') !== null;
        }
        
        // In main frame, check all iframes for participants
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc.querySelector('.participants-section-container')) {
                    return true;
                }
            } catch (e) {
                // Cannot access iframe
            }
        }
        return false;
    }
    
    // Configuration
    const config = {
        checkInterval: 2000, // Check every 2 seconds
        enableAutoReminders: true,
        reminderInterval: 30000 // Send reminder every 30 seconds if cameras off
    };
    
    // State
    let isMonitoring = false;
    let isPaused = false;
    let lastReminderTime = 0;
    
    // Check if we're in a Zoom meeting
    function isInMeeting() {
        const url = window.location.href;
        return url.includes('/wc/') && (url.includes('/join') || url.includes('/start'));
    }
    
    // Enhanced function to check if we're in a Zoom meeting (including iframe context)
    function isInZoomMeeting() {
        const url = window.location.href;
        const base = url.includes('/wc/') && (url.includes('/join') || url.includes('/start'));
        const iframe = window !== window.top;
        
        log(`🔍 URL check: ${url}`);
        log(`🔍 Is in meeting: ${base} (base: ${base}, iframe: ${iframe})`);
        
        // Check for meeting elements
        const hasMeetingElements = document.querySelector('.meeting-client, .meeting-client-inner, [class*="meeting"]') !== null;
        const hasVideo = document.querySelector('video') !== null;
        
        log(`🔍 Has meeting elements: ${hasMeetingElements}, Has video: ${hasVideo}`);
        
        return base || (iframe && (hasMeetingElements || hasVideo));
    }
    
    // Open panels for monitoring (enhanced with iframe detection)
    async function openPanelsForMonitoring() {
        log('🔓 Opening panels for monitoring...');
        
        // ENHANCED: Check if we're in main frame and need to look in iframes
        if (window === window.top) {
            log('🔍 Main frame detected, checking iframes for meeting interface...');
            const iframes = document.querySelectorAll('iframe');
            
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                    const iframeUrl = iframeDoc.URL || '';
                    
                    // Check if this iframe contains the meeting
                    if (iframeUrl.includes('/wc/') && iframeUrl.includes('/start')) {
                        log(`✅ Found meeting iframe ${i + 1}: ${iframeUrl}`);
                        
                        // Try to open panels in this iframe
                        const iframeZoomWatch = iframes[i].contentWindow.ZoomWatch;
                        if (iframeZoomWatch && iframeZoomWatch.openPanelsForMonitoring) {
                            log(`🎯 Calling openPanelsForMonitoring in iframe ${i + 1}`);
                            const result = await iframeZoomWatch.openPanelsForMonitoring();
                            if (result) {
                                log(`✅ Successfully opened panels in iframe ${i + 1}`);
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    log(`⚠️ Could not access iframe ${i + 1}: ${e.message}`);
                }
            }
            
            log('⚠️ No meeting iframes found or panels could not be opened in iframes');
        }
        
        // Fallback: Try to open panels in current context
        log('🔍 Attempting to open panels in current context...');
        
        let panelsOpened = 0;
        
        // Open participants panel
        log('🔓 Attempting to open participants panel...');
        const participantsOpened = openParticipantsPanel();
        if (participantsOpened) {
            log('✅ Participants panel opened for monitoring');
            panelsOpened++;
        }
        
        // Open chat panel
        log('💬 Attempting to open chat panel...');
        const chatOpened = openChatPanel();
        if (chatOpened) {
            log('✅ Chat panel opened for monitoring');
            panelsOpened++;
        }
        
        log(`✅ Successfully opened ${panelsOpened} panels for monitoring`);
        return panelsOpened > 0;
    }
    
    // Open participants panel
    function openParticipantsPanel() {
        log('🔓 Attempting to open participants panel...');
        
        if (!isInZoomMeeting()) {
            log('❌ Not in Zoom meeting');
            return false;
        }
        
        // Look for participants button
        const participantsButton = document.querySelector('button[aria-label*="participants" i]:not([aria-label*="close" i])');
        if (participantsButton) {
            log(`✅ Found participants button: button[aria-label*="participants" i]:not([aria-label*="close" i])`);
            log(`   Aria-label: "${participantsButton.getAttribute('aria-label')}" | Class: "${participantsButton.className}"`);
            
            participantsButton.click();
            log('✅ Participants panel opened');
            return true;
        }
        
        log('❌ Participants button not found');
        return false;
    }
    
    // Close participants panel
    function closeParticipantsPanel() {
        log('📴 Attempting to close participants panel...');
        
        if (!isInZoomMeeting()) {
            log('❌ Not in Zoom meeting');
            return false;
        }
        
        // Look for close participants button
        const closeButton = document.querySelector('button[aria-label*="close" i][aria-label*="participants" i]');
        if (closeButton) {
            log(`✅ Found close participants button: button[aria-label*="close" i][aria-label*="participants" i]`);
            log(`   Aria-label: "${closeButton.getAttribute('aria-label')}" | Class: "${closeButton.className}"`);
            
            closeButton.click();
            log('✅ Participants panel closed');
            return true;
        }
        
        log('❌ Close participants button not found');
        return false;
    }
    
    // Open chat panel
    function openChatPanel() {
        log('💬 Attempting to open chat panel...');
        
        if (!isInZoomMeeting()) {
            log('❌ Not in Zoom meeting');
            return false;
        }
        
        // Look for chat button
        const chatButton = document.querySelector('button[aria-label*="chat" i][class*="footer"]:not([aria-label*="team" i]):not([aria-label*="close" i])');
        if (chatButton) {
            log(`✅ Found chat button: button[aria-label*="chat" i][class*="footer"]:not([aria-label*="team" i]):not([aria-label*="close" i])`);
            log(`   Aria-label: "${chatButton.getAttribute('aria-label')}" | Class: "${chatButton.className}"`);
            
            chatButton.click();
            log('✅ Chat panel opened');
            return true;
        }
        
        log('❌ Meeting chat button not found');
        return false;
    }
    
    // Close chat panel
    function closeChatPanel() {
        log('🔕 Attempting to close chat panel...');
        
        if (!isInZoomMeeting()) {
            log('❌ Not in Zoom meeting');
            return false;
        }
        
        // Look for close chat button
        const closeButton = document.querySelector('button[aria-label*="close" i][aria-label*="chat" i]');
        if (closeButton) {
            log(`✅ Found close chat button: button[aria-label*="close" i][aria-label*="chat" i]`);
            log(`   Aria-label: "${closeButton.getAttribute('aria-label')}" | Class: "${closeButton.className}"`);
            
            closeButton.click();
            log('✅ Chat panel closed');
            return true;
        }
        
        log('❌ Close chat button not found');
        return false;
    }
    
    // Find the Participants tab and get participant list (enhanced with iframe detection)
    function findParticipantsList() {
        log('🔍 Looking for Participants tab...');
        
        // ENHANCED: First check iframes for participants (since panels are now opening in iframes)
        if (window === window.top) {
            log('🔍 Main frame detected, checking iframes for participants...');
            const iframes = document.querySelectorAll('iframe');
            
            for (let i = 0; i < iframes.length; i++) {
                try {
                    const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                    const iframeUrl = iframeDoc.URL || '';
                    
                    // Check if this iframe contains the meeting
                    if (iframeUrl.includes('/wc/') && iframeUrl.includes('/start')) {
                        log(`🔍 Checking meeting iframe ${i + 1} for participants: ${iframeUrl}`);
                        
                        // Look for participants in this iframe
                        const iframeParticipants = iframeDoc.querySelector('.participants-section-container');
                        if (iframeParticipants) {
                            log(`✅ Found participants in meeting iframe ${i + 1}: .participants-section-container`);
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
                                log(`✅ Found participants in meeting iframe ${i + 1} with selector: ${selector}`);
                                return altParticipants;
                            }
                        }
                    }
                } catch (e) {
                    log(`⚠️ Could not access iframe ${i + 1}: ${e.message}`);
                }
            }
            
            log('⚠️ No participants found in meeting iframes, falling back to main frame search...');
        }
        
        // Fallback: Search in current context (main frame or iframe)
        log('🔍 Searching current context for participants...');
        
        // Debug: Log all elements that might be participants-related
        const allParticipantElements = document.querySelectorAll('*[class*="participant" i]');
        log(`🔍 Found ${allParticipantElements.length} elements with "participant" in class name`);
        allParticipantElements.forEach((el, i) => {
            if (i < 5) { // Log first 5 to avoid spam
                log(`   ${i+1}: ${el.tagName}.${el.className}`);
            }
        });
        
        // Debug: Look for any element containing "Participants" text
        const participantsTextElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('Participants') && el.offsetWidth > 0
        );
        log(`🔍 Found ${participantsTextElements.length} elements containing "Participants" text`);
        participantsTextElements.forEach((el, i) => {
            if (i < 3) { // Log first 3
                log(`   ${i+1}: ${el.tagName}.${el.className} - "${el.textContent.substring(0, 30)}"`);
            }
        });
        
        // Method 1: Look for the specific participants container (found in deep search!)
        const participantsContainer = document.querySelector('.participants-section-container');
        if (participantsContainer) {
            log('✅ Found participants section container');
            return participantsContainer;
        }
        
        // Method 2: Look for the participants list directly (found in deep search!)
        const participantsList = document.querySelector('.participants-list-container.participants-ul');
        if (participantsList) {
            log('✅ Found participants list container');
            return participantsList;
        }
        
        // Method 3: Look for participant items anywhere on the page (found in deep search!)
        const participantItems = document.querySelectorAll('.participants-li');
        if (participantItems.length > 0) {
            log(`✅ Found ${participantItems.length} participant items`);
            return participantItems[0].closest('.participants-section-container') || participantItems[0].parentElement;
        }
        
        // Method 4: Look for any element with "participant" in the class (case insensitive)
        const anyParticipantElement = document.querySelector('[class*="participant" i]');
        if (anyParticipantElement) {
            log(`✅ Found participants in current context with selector: ${anyParticipantElement.className}`);
            return anyParticipantElement.closest('[class*="section"], [class*="container"], [class*="wrapper"]') || anyParticipantElement;
        }
        
        log('❌ No participants list found in current context or iframes');
        return null;
    }
    
    // Parse participant names and camera status from the list
    function parseParticipants(participantsList) {
        if (!participantsList) {
            log('❌ No participants list provided');
        return [];
    }
    
        log('📋 Parsing participants from list...');
        log(`   List element: ${participantsList.tagName}.${participantsList.className}`);
        
        // Use ONLY .participants-li to avoid duplicates (from investigation results)
        const participantItems = participantsList.querySelectorAll('.participants-li');
        log(`   Found ${participantItems.length} unique participant items`);
        
        if (participantItems.length > 0) {
            log(`✅ Found ${participantItems.length} participant items, processing...`);
            return parseParticipantItems(Array.from(participantItems));
        } else {
            log('❌ No participant items found in list');
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
            
            log(`👤 Participant ${index + 1}: ${name} (Camera: ${cameraOn ? '🟢 ON' : '🔴 OFF'})`);
            
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
                log(`   📹 Camera status from aria-label: "${ariaLabel}" (${isOff ? '🔴 OFF' : '🟢 ON'})`);
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
                log(`   📹 Found camera icon: ${selector} (${isOff ? '🔴 OFF' : '🟢 ON'})`);
                return !isOff; // Return true if NOT off/muted
            }
        }
        
        // Look for title attribute for camera status
        const title = item.title || '';
        if (title) {
            const isOff = title.includes('video off') || title.includes('camera off');
            const isOn = title.includes('video on') || title.includes('camera on');
            
            if (isOff || isOn) {
                log(`   📹 Camera status from title: "${title}" (${isOff ? '🔴 OFF' : '🟢 ON'})`);
                return !isOff;
            }
        }
        
        // Default: assume camera is ON if we can't determine
        log('   📹 Camera status unclear, assuming ON');
            return true;
    }
    
    // Main monitoring function
    function monitorParticipants() {
        if (!isMonitoring || isPaused) return;
        
        log('=== MONITORING PARTICIPANTS ===');
        
        if (!isInMeeting()) {
            log('❌ Not in a Zoom meeting');
                    return;
                }
                
        // Find and parse participants (only when panel is already open)
        const participantsList = findParticipantsList();
        const participants = parseParticipants(participantsList);
        processParticipants(participants);
    }
    
    // Process the found participants
    function processParticipants(participants) {
        log('📊 Processing participants...');
                
                if (participants.length === 0) {
            log('❌ No participants found');
                            return;
                        }
                        
        log(`✅ Found ${participants.length} participants`);
                        
        // Count cameras off
        let camerasOff = 0;
        participants.forEach(participant => {
            if (!participant.cameraOn) {
                            camerasOff++;
            }
        });
        
        // Create summary
                const summary = `${participants.length} participants, ${camerasOff} cameras off`;
        log(`📊 Summary: ${summary}`);
        
        // Store data for popup access
        localStorage.setItem('zoomwatch_summary', summary);
        localStorage.setItem('zoomwatch_participants', JSON.stringify(participants));
                
                // Send summary to popup
        sendSummaryToPopup(participants.length, camerasOff, participants);
        
                // Check and send reminders if needed
        if (config.enableAutoReminders && camerasOff > 0) {
            checkAndSendReminders(participants.length, camerasOff);
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
            log(`❌ Error sending data to popup: ${error.message}`);
        }
    }
    
    // Check and send reminders
    function checkAndSendReminders(total, camerasOff) {
        const now = Date.now();
        if (now - lastReminderTime < config.reminderInterval) {
            return; // Too soon for another reminder
        }
        
        log(`🔔 Sending reminder: ${camerasOff} cameras are off`);
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
            log(`❌ Error sending reminder: ${error.message}`);
        }
    }
    
    // Start monitoring (enhanced with iframe detection)
    function startMonitoring() {
        if (isMonitoring) {
            log('⚠️ Already monitoring');
            return;
        }
        
        // Check if we have participants in this frame
        if (isIframe && !hasParticipantsNow()) {
            log('⏳ Waiting for participants to load in iframe...');
            // Wait up to 5 seconds for participants to appear
            let attempts = 0;
            const waitInterval = setInterval(() => {
                attempts++;
                if (hasParticipantsNow()) {
                    log('✅ Participants found! Starting monitoring...');
                    clearInterval(waitInterval);
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
                    log('⏭️ No participants found after waiting, skipping monitoring...');
                    clearInterval(waitInterval);
                }
            }, 500);
            return;
        }
        
        log('🚀 STARTING PARTICIPANT MONITORING...');
        isMonitoring = true;
        isPaused = false;
        
        // First, open panels for monitoring
        openPanelsForMonitoring().then(() => {
            // Start the monitoring loop
            monitorParticipants();
            const interval = setInterval(() => {
                if (isMonitoring && !isPaused) {
                    monitorParticipants();
                } else {
                    clearInterval(interval);
                }
            }, config.checkInterval);
        }).catch(error => {
            log(`❌ Error opening panels: ${error.message}`);
            // Still try to monitor even if panels fail
            monitorParticipants();
            const interval = setInterval(() => {
                if (isMonitoring && !isPaused) {
                    monitorParticipants();
                } else {
                    clearInterval(interval);
                }
            }, config.checkInterval);
        });
    }
    
    // Stop monitoring
    function stopMonitoring() {
        log('⏹️ STOPPING PARTICIPANT MONITORING...');
        isMonitoring = false;
        isPaused = false;
    }
    
    // Pause monitoring
    function pauseMonitoring() {
        log('⏸️ PAUSING PARTICIPANT MONITORING...');
        isPaused = true;
    }
    
    // Resume monitoring
    function resumeMonitoring() {
        log('▶️ RESUMING PARTICIPANT MONITORING...');
        isPaused = false;
    }
    
    // Duplicate function removed
        
    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        log(`📨 Received message: ${message.action}`);
        
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
                
            case 'requestData':
                const summary = localStorage.getItem('zoomwatch_summary');
                const participants = JSON.parse(localStorage.getItem('zoomwatch_participants') || '[]');
                const total = participants.length;
                const camerasOff = participants.filter(p => !p.cameraOn).length;
                
                sendResponse({
                    success: true,
                    data: {
                        total: total,
                        camerasOff: camerasOff,
                        participants: participants
                    }
                });
                break;
                
            case 'ZOOMWATCH_PING':
                sendResponse({ success: true, message: 'Pong from content script' });
                break;
                
            default:
                log(`❌ Unknown action: ${message.action}`);
                sendResponse({ success: false, message: 'Unknown action' });
        }
        
        return true; // Keep message channel open
    });
    
    // Make functions available globally for debugging
    window.ZoomWatch = {
        startMonitoring,
        stopMonitoring,
        pauseMonitoring,
        resumeMonitoring,
        monitorParticipants,
        findParticipantsList,
        parseParticipants,
        openPanelsForMonitoring,
        openParticipantsPanel,
        closeParticipantsPanel,
        openChatPanel,
        closeChatPanel,
        isInZoomMeeting,
        version: '3.0.0'
    };
    
    log('✅ ZoomWatch content script loaded and ready!');
    
})();

