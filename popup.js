// ZoomWatch Popup - Simple and Clean
// Displays participant count and camera status

class ZoomWatchPopup {
    constructor() {
        this.stats = {
            total: 0,
            camerasOff: 0,
            camerasOn: 0,
            remindersSent: 0
        };
        
        this.init();
    }
    
    init() {
        log('🚀 Initializing ZoomWatch popup...');
        
        // Set up event listeners
        document.getElementById('startBtn').addEventListener('click', () => this.startMonitoring());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopMonitoring());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseMonitoring());
        document.getElementById('debugBtn').addEventListener('click', () => this.debugCameraDetection());
        document.getElementById('inspectBtn').addEventListener('click', () => this.inspectPage());
        
        // Request initial data
        this.requestFreshData();
        
        // Set up auto-refresh
        setInterval(() => {
            if (this.isMonitoring) {
                this.requestFreshData();
            }
        }, 2000);
    }
    
    async startMonitoring() {
        log('🟢 Starting monitoring...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'startMonitoring' });
            
            if (response && response.success) {
                this.isMonitoring = true;
                this.updateStatus('Monitoring started...');
                this.updateButtonStates();
                log('✅ Monitoring started successfully');
            } else {
                log('❌ Failed to start monitoring');
                this.updateStatus('Failed to start monitoring');
            }
        } catch (error) {
            log(`❌ Error starting monitoring: ${error.message}`);
            this.updateStatus('Error starting monitoring');
        }
    }
    
    async stopMonitoring() {
        log('🔴 Stopping monitoring...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'stopMonitoring' });
            
            if (response && response.success) {
                this.isMonitoring = false;
                this.updateStatus('Monitoring stopped');
                this.updateButtonStates();
                log('✅ Monitoring stopped successfully');
            }
        } catch (error) {
            log(`❌ Error stopping monitoring: ${error.message}`);
        }
    }
    
    async pauseMonitoring() {
        log('⏸️ Pausing monitoring...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'pauseMonitoring' });
            
            if (response && response.success) {
                this.isPaused = true;
                this.updateStatus('Monitoring paused');
                this.updateButtonStates();
                log('✅ Monitoring paused successfully');
            }
        } catch (error) {
            log(`❌ Error pausing monitoring: ${error.message}`);
        }
    }
    
    async requestFreshData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'requestData' });
            
            if (response && response.success && response.data) {
                this.stats = {
                    total: response.data.total || 0,
                    camerasOff: response.data.camerasOff || 0,
                    camerasOn: (response.data.total || 0) - (response.data.camerasOff || 0),
                    remindersSent: this.stats.remindersSent
                };
                
                this.updateStats();
                log(`✅ Updated stats: ${this.stats.total} participants, ${this.stats.camerasOff} cameras off`);
            } else {
                // Fallback: try to get data from localStorage
                this.loadDataFromStorage();
            }
        } catch (error) {
            log(`❌ Error requesting data: ${error.message}`);
            this.loadDataFromStorage();
        }
    }
    
    async loadDataFromStorage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Execute script to get data from page's localStorage
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const summary = localStorage.getItem('zoomwatch_summary');
                    const participants = JSON.parse(localStorage.getItem('zoomwatch_participants') || '[]');
                    return { summary, participants };
                }
            });
            
            if (results && results[0] && results[0].result) {
                const data = results[0].result;
                const participants = data.participants || [];
                const total = participants.length;
                const camerasOff = participants.filter(p => !p.cameraOn).length;
                
                this.stats = {
                    total: total,
                    camerasOff: camerasOff,
                    camerasOn: total - camerasOff,
                    remindersSent: this.stats.remindersSent
                };
                
                this.updateStats();
                log(`✅ Loaded data from storage: ${total} participants, ${camerasOff} cameras off`);
            }
        } catch (error) {
            log(`❌ Error loading from storage: ${error.message}`);
        }
    }
    
    updateStats() {
        // Update participant count
        const participantCount = document.getElementById('participantCount');
        if (participantCount) {
            participantCount.textContent = this.stats.total > 0 ? this.stats.total : '-';
        }
        
        // Update cameras off count
        const camerasOffCount = document.getElementById('camerasOffCount');
        if (camerasOffCount) {
            camerasOffCount.textContent = this.stats.camerasOff > 0 ? this.stats.camerasOff : '-';
        }
        
        // Update cameras on count
        const camerasOnCount = document.getElementById('camerasOnCount');
        if (camerasOnCount) {
            camerasOnCount.textContent = this.stats.camerasOn > 0 ? this.stats.camerasOn : '-';
        }
        
        // Update status text
        this.updateStatusText();
    }
    
    updateStatusText() {
        const statusText = document.getElementById('statusText');
        if (!statusText) return;
        
        if (this.stats.total === 0) {
            statusText.textContent = 'No participants detected';
        } else if (this.stats.camerasOff === 0) {
            statusText.textContent = 'All cameras are ON';
        } else if (this.stats.camerasOff === this.stats.total) {
            statusText.textContent = 'All cameras are OFF';
        } else {
            statusText.textContent = `${this.stats.camerasOff} camera(s) OFF`;
        }
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isMonitoring) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
        }
    }
    
    async debugCameraDetection() {
        log('🔍 Debugging camera detection...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Execute debug script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    if (window.ZoomWatch) {
                        console.log('🔍 ZoomWatch debug info:');
                        console.log('Functions:', Object.keys(window.ZoomWatch));
                        
                        if (typeof window.ZoomWatch.findParticipantsList === 'function') {
                            const list = window.ZoomWatch.findParticipantsList();
                            console.log('Participants list:', list);
                            
                            if (list) {
                                const participants = window.ZoomWatch.parseParticipants(list);
                                console.log('Parsed participants:', participants);
                            }
                        }
                    } else {
                        console.log('❌ ZoomWatch not loaded');
                    }
                }
            });
            
            this.updateStatus('Debug info sent to console');
        } catch (error) {
            log(`❌ Error debugging: ${error.message}`);
            this.updateStatus('Debug failed');
        }
    }
    
    async inspectPage() {
        log('🔍 Opening page inspector...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'inspectPage' });
            this.updateStatus('Page inspector opened');
        } catch (error) {
            log(`❌ Error opening inspector: ${error.message}`);
            this.updateStatus('Inspector failed');
        }
    }
}

// Logging function
function log(message) {
    console.log(`[ZoomWatch Popup] ${message}`);
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZoomWatchPopup();
});
