// ZoomWatch Extension - Clean & Focused Version
// Focuses on the Participants tab: names + camera status icons

(function() {
    'use strict';
    
    // Version stamp
    const ZW_BUILD = '2025-01-19T23:00+05:30';
    
    // Check if we're in an iframe
    const isMainFrame = window === window.top;
    const isIframe = !isMainFrame;
    
    // Simple logging function
    function log(message) {
        const frameInfo = isIframe ? '[IFRAME]' : '[MAIN]';
        console.log(`[ZoomWatch] ${frameInfo} ${message}`);
    }
    
    log(`🚀 ZoomWatch loaded - Build: ${ZW_BUILD}`);
    
    // Configuration
    const config = {
        checkInterval: 2000, // Check every 2 seconds
        enableAutoWarnings: true,
        warningLevels: {
            level1: { delay: 10000, message: "Please turn on your camera. This is a Level 1 instruction." },
            level2: { delay: 30000, message: "Your camera has been off for 30 seconds. You have 20 seconds to turn it on." },
            level3: { delay: 50000, message: "FINAL WARNING: Your camera has been off for 50 seconds." }
        }
    };
    
    // State
    let isMonitoring = false;
    let isPaused = false;
    const participantTracking = new Map();
    const sentMessages = new Set();
    const messageCooldown = 30000;
    const lastMessageTime = new Map();
    
    // Global monitoring flag
    if (!window.ZoomWatchMonitoringStarted) {
        window.ZoomWatchMonitoringStarted = false;
    }
    
    // Core utility functions
    function hasParticipantsNow() {
        const selectors = ['.participants-section-container', '.participants-list', '[class*="participant"]'];
        if (isIframe) {
            return selectors.some(s => document.querySelector(s));
        }
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (selectors.some(s => doc.querySelector(s))) return true;
            } catch (e) {}
        }
        return false;
    }
    
    function isInZoomMeeting() {
        const url = window.location.href;
        return url.includes('/wc/') || url.includes('/meeting/') || url.includes('zoom.us');
    }
    
    // Panel control functions
    function openParticipantsPanel() {
        const selectors = ['button[aria-label*="participants" i]', 'button[class*="participants"]'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                button.click();
                return true;
            }
        }
        return false;
    }
    
    function openChatPanel() {
        const selectors = ['button[aria-label*="chat" i]:not([aria-label*="team" i])', 'button[class*="chat"]'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                button.click();
                return true;
            }
        }
        return false;
    }
    
    // Chat functions
    function findChatInput() {
        const selectors = ['.chat-rtf-box textarea', '[contenteditable="true"]', 'textarea[placeholder*="message"]'];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetWidth > 0) return element;
        }
        return null;
    }
    
    function findChatSendButton() {
        const selectors = ['.chat-rtf-box__send', 'button[aria-label="send"]', 'button[class*="send"]'];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetWidth > 0) return element;
        }
        return null;
    }
    
    async function sendChatMessage(message, recipientName = 'Everyone') {
        try {
            const chatInput = findChatInput();
            if (!chatInput) return false;
            
            chatInput.focus();
            if (chatInput.contentEditable === 'true') {
                chatInput.textContent = message;
            } else {
                chatInput.value = message;
            }
            
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const sendButton = findChatSendButton();
            if (sendButton && !sendButton.disabled) {
                sendButton.click();
                return true;
            }
            
            // Fallback to Enter key
            chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            return true;
        } catch (error) {
            log(`❌ Error sending message: ${error.message}`);
            return false;
        }
    }
    
    // Participant functions
    function findParticipantsList() {
        const selectors = ['.participants-section-container', '.participants-list-container', '.participants-li'];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }
    
    function parseParticipants(participantsList) {
        if (!participantsList) return [];
        
        const items = participantsList.querySelectorAll('.participants-li');
        const participants = [];
        
        items.forEach(item => {
            if (item.offsetWidth > 500) return;
            
            const name = extractParticipantName(item);
            if (!name || name.length < 2) return;
            
            const cameraOn = checkCameraStatus(item);
            if (name.toLowerCase().includes('participants')) return;
            
            participants.push({ name, cameraOn, element: item });
        });
        
        return participants;
    }
    
    function extractParticipantName(item) {
        const ariaLabel = item.getAttribute('aria-label') || '';
        if (ariaLabel.includes('(me)') || ariaLabel.includes('(Host, me)')) return null;
        
        const nameSelectors = ['.participants-item__display-name', '[class*="display-name"]'];
        for (const selector of nameSelectors) {
            const element = item.querySelector(selector);
            if (element) {
                const text = element.textContent?.trim();
                if (text && text.length > 1 && text.length < 50) return text;
            }
        }
        
        const text = item.textContent?.trim();
        if (text && text.length > 1 && text.length < 100) {
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 1);
            for (const line of lines) {
                if (line.length < 50 && !line.includes('(')) return line;
            }
        }
        return null;
    }
    
    function checkCameraStatus(item) {
        const ariaLabel = item.getAttribute('aria-label') || '';
        if (ariaLabel.includes('video off') || ariaLabel.includes('camera off')) return false;
        if (ariaLabel.includes('video on') || ariaLabel.includes('camera on')) return true;
        
        const iconSelectors = ['[class*="video-on"]', '[class*="video-off"]'];
        for (const selector of iconSelectors) {
            const icon = item.querySelector(selector);
            if (icon) {
                const className = String(icon.className || '');
                return !className.includes('off');
            }
        }
        return true;
    }
    
    // Monitoring functions
    function monitorParticipants() {
        if (!isMonitoring || isPaused) return;
        
        const inMeeting = isInZoomMeeting();
        const hasParticipants = hasParticipantsNow();
        
        if (!inMeeting && !hasParticipants) return;
        
        const participantsList = findParticipantsList();
        const participants = parseParticipants(participantsList);
        processParticipants(participants);
    }
    
    function processParticipants(participants) {
        if (participants.length === 0) return;
        
        let camerasOff = 0;
        let actualParticipants = 0;
        
        participants.forEach(participant => {
            if (participant.name.includes('(me)')) return;
            actualParticipants++;
            if (!participant.cameraOn) camerasOff++;
        });
        
        const summary = `${actualParticipants} participants, ${camerasOff} cameras off`;
        localStorage.setItem('zoomwatch_summary', summary);
        localStorage.setItem('zoomwatch_participants', JSON.stringify(participants));
        
        sendSummaryToPopup(actualParticipants, camerasOff, participants);
        
        if (config.enableAutoWarnings && camerasOff > 0) {
            checkAndSendAutomatedWarnings();
        }
    }
    
    async function checkAndSendAutomatedWarnings() {
        const currentTime = Date.now();
        
        for (const [name, trackingData] of participantTracking) {
            if (!trackingData.cameraOffStartTime) continue;
            if (name.includes('(me)')) continue;
            
            const offDuration = currentTime - trackingData.cameraOffStartTime;
            
            if (offDuration >= config.warningLevels.level1.delay && !trackingData.warningsSent.level1) {
                await sendWarningMessage(name, 'level1', offDuration);
                trackingData.warningsSent.level1 = true;
            }
            
            if (offDuration >= config.warningLevels.level2.delay && !trackingData.warningsSent.level2) {
                await sendWarningMessage(name, 'level2', offDuration);
                trackingData.warningsSent.level2 = true;
            }
            
            if (offDuration >= config.warningLevels.level3.delay && !trackingData.warningsSent.level3) {
                await sendWarningMessage(name, 'level3', offDuration);
                trackingData.warningsSent.level3 = true;
            }
        }
    }
    
    async function sendWarningMessage(participantName, warningLevel, offDuration) {
        const messageId = `${participantName}-${warningLevel}`;
        if (sentMessages.has(messageId)) return;
        
        const lastTime = lastMessageTime.get(participantName);
        const now = Date.now();
        if (lastTime && (now - lastTime) < messageCooldown) return;
        
        const message = config.warningLevels[warningLevel].message;
        const success = await sendChatMessage(message, participantName);
        
        if (success) {
            sentMessages.add(messageId);
            lastMessageTime.set(participantName, Date.now());
            setTimeout(() => sentMessages.delete(messageId), messageCooldown);
        }
    }
    
    function sendSummaryToPopup(total, camerasOff, participants) {
        try {
            chrome.runtime.sendMessage({
                type: 'ZOOM_PARTICIPANT_UPDATE',
                data: { total, camerasOff, participants, timestamp: Date.now() }
            }).catch(() => {});
        } catch (error) {
            log(`❌ Error sending data to popup: ${error.message}`);
        }
    }
    
    // Control functions
    async function startMonitoring() {
        if (isMonitoring || window.ZoomWatchMonitoringStarted) return;
        
        window.ZoomWatchMonitoringStarted = true;
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
    
    function stopMonitoring() {
        isMonitoring = false;
        isPaused = false;
        window.ZoomWatchMonitoringStarted = false;
        sentMessages.clear();
        lastMessageTime.clear();
    }
    
    function pauseMonitoring() { isPaused = true; }
    function resumeMonitoring() { isPaused = false; }
    
    // Message handling
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (!message || message.source !== 'zoomwatch') return;
        if (window !== window.top) return;
        
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
                case 'requestData':
                    const summary = localStorage.getItem('zoomwatch_summary');
                    const participants = JSON.parse(localStorage.getItem('zoomwatch_participants') || '[]');
                    const total = participants.length;
                    const camerasOff = participants.filter(p => !p.cameraOn).length;
                    sendResponse({
                        success: true,
                        data: { total, camerasOff, participants, monitorProfile: 'Extension User' }
                    });
                    break;
                case 'testChatMessage':
                    const testSuccess = await sendChatMessage(
                        message.data?.message || 'Test message from ZoomWatch', 
                        message.data?.recipient || 'Everyone'
                    );
                    sendResponse({ success: testSuccess, message: testSuccess ? 'Test message sent' : 'Test message failed' });
                    break;
                case 'ZOOMWATCH_PING':
                    sendResponse({ success: true, message: 'Pong from content script' });
                    break;
                default:
                    sendResponse({ success: false, message: 'Unknown action' });
            }
        } catch (e) {
            sendResponse({ success: false, message: `Handler error: ${e.message}` });
        }
        return true;
    });
    
    // Global API
    window.ZoomWatch = {
        startMonitoring,
        stopMonitoring,
        pauseMonitoring,
        resumeMonitoring,
        sendChatMessage,
        version: '3.0.0'
    };
    
    log('✅ ZoomWatch content script loaded and ready!');
    
})();
