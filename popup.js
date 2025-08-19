// ZoomWatch Popup - Clean & Essential Interface
// Advanced participant monitoring with real-time updates

class ZoomWatchPopup {
    constructor() {
        this.state = {
            isMonitoring: false,
            isPaused: false,
            isConnected: false,
            participants: [],
            trackingData: [],
            recentWarnings: [],
            stats: {
                total: 0,
                camerasOff: 0,
                camerasOn: 0,
                remindersSent: 0,
                warningsSent: 0
            },
            warningSystem: {
                enabled: true,
                monitorProfile: 'Extension User'
            },
            lastUpdate: null,
            refreshInterval: null
        };
        
        this.init();
    }
    
    init() {
        log('🚀 Initializing ZoomWatch popup...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize UI state
        this.initializeUI();
        
        // Check connection and request initial data
        this.checkConnection();
        
        // Start auto-refresh
        this.startAutoRefresh();
    }
    
    setupEventListeners() {
        // Control buttons
        document.getElementById('startBtn')?.addEventListener('click', () => this.startMonitoring());
        document.getElementById('stopBtn')?.addEventListener('click', () => this.stopMonitoring());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.pauseMonitoring());
        
        // Action buttons
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.manualRefresh());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        
        // Warning system controls
        document.getElementById('autoWarningsToggle')?.addEventListener('change', (e) => this.toggleAutoWarnings(e.target.checked));
        
        // Participants toggle
        document.getElementById('expandToggle')?.addEventListener('click', () => this.toggleParticipants());
        
        // Stat cards hover effects
        this.setupStatCardAnimations();
    }
    
    initializeUI() {
        // Set initial connection status
        this.updateConnectionStatus('connecting', 'Connecting...');
        
        // Initialize stats display
        this.updateStatsDisplay();
        
        // Set initial status
        this.updateStatusText('Initializing...', 'pending');
        
        // Set initial warning system state
        this.updateWarningSystemUI();
    }
    
    async checkConnection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.updateConnectionStatus('error', 'No active tab');
                return;
            }
            
            // Check if ZoomWatch is loaded in the tab
            const response = await chrome.tabs.sendMessage(tab.id, { 
                source: 'zoomwatch', 
                action: 'ZOOMWATCH_PING' 
            });
            
            if (response && response.success) {
                this.updateConnectionStatus('connected', 'Connected');
                this.state.isConnected = true;
                this.requestData();
            } else {
                this.updateConnectionStatus('error', 'Not connected');
                this.state.isConnected = false;
            }
            
        } catch (error) {
            log(`❌ Connection check failed: ${error.message}`);
            this.updateConnectionStatus('error', 'Connection failed');
            this.state.isConnected = false;
        }
    }
    
    async requestData() {
        if (!this.state.isConnected) return;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { 
                source: 'zoomwatch', 
                action: 'requestData' 
            });
            
            if (response && response.success) {
                this.updateData(response.data);
            }
        } catch (error) {
            log(`❌ Data request failed: ${error.message}`);
        }
    }
    
    updateData(data) {
        if (!data) return;
        
        // Update stats
        this.state.stats.total = data.total || 0;
        this.state.stats.camerasOff = data.camerasOff || 0;
        this.state.stats.camerasOn = this.state.stats.total - this.state.stats.camerasOff;
        
        // Update participants
        this.state.participants = data.participants || [];
        
        // Update tracking data
        this.state.trackingData = data.trackingData || [];
        
        // Update monitor profile
        if (data.monitorProfile) {
            this.state.warningSystem.monitorProfile = data.monitorProfile;
        }
        
        // Update UI
        this.updateStatsDisplay();
        this.updateParticipantsDisplay();
        this.updateWarningsDisplay();
        this.updateWarningSystemUI();
        
        // Update timestamp
        this.state.lastUpdate = new Date();
        this.updateLastUpdate();
    }
    
    updateStatsDisplay() {
        // Update participant count
        const totalElement = document.getElementById('participantCount');
        if (totalElement) {
            totalElement.textContent = this.state.stats.total;
        }
        
        // Update cameras on count
        const camerasOnElement = document.getElementById('camerasOnCount');
        if (camerasOnElement) {
            camerasOnElement.textContent = this.state.stats.camerasOn;
        }
        
        // Update cameras off count
        const camerasOffElement = document.getElementById('camerasOffCount');
        if (camerasOffElement) {
            camerasOffElement.textContent = this.state.stats.camerasOff;
        }
        
        // Update stat card colors based on status
        this.updateStatCardColors();
    }
    
    updateStatCardColors() {
        const totalCard = document.getElementById('totalCard');
        const camerasOnCard = document.getElementById('camerasOnCard');
        const camerasOffCard = document.getElementById('camerasOffCard');
        
        if (totalCard) {
            totalCard.className = `stat-card primary ${this.state.stats.total > 0 ? 'active' : 'inactive'}`;
        }
        
        if (camerasOnCard) {
            camerasOnCard.className = `stat-card success ${this.state.stats.camerasOn > 0 ? 'active' : 'inactive'}`;
        }
        
        if (camerasOffCard) {
            camerasOffCard.className = `stat-card warning ${this.state.stats.camerasOff > 0 ? 'active' : 'inactive'}`;
        }
    }
    
    updateParticipantsDisplay() {
        const participantsSection = document.getElementById('participantsSection');
        const participantsList = document.getElementById('participantsList');
        
        if (!participantsSection || !participantsList) return;
        
        if (this.state.participants.length === 0) {
            participantsSection.style.display = 'none';
            return;
        }
        
        participantsSection.style.display = 'block';
        
        // Clear existing list
        participantsList.innerHTML = '';
        
        // Add participants
        this.state.participants.forEach(participant => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant-item';
            participantElement.innerHTML = `
                <div class="participant-info">
                    <span class="participant-name">${participant.name}</span>
                    <span class="participant-status ${participant.cameraOn ? 'camera-on' : 'camera-off'}">
                        ${participant.cameraOn ? '📹' : '📷'}
                    </span>
                </div>
            `;
            participantsList.appendChild(participantElement);
        });
    }
    
    updateWarningsDisplay() {
        const warningsSection = document.getElementById('warningsSection');
        const warningsList = document.getElementById('warningsList');
        const warningCount = document.getElementById('warningCount');
        
        if (!warningsSection || !warningsList || !warningCount) return;
        
        if (this.state.trackingData.length === 0) {
            warningsSection.style.display = 'none';
            return;
        }
        
        warningsSection.style.display = 'block';
        warningCount.textContent = this.state.trackingData.length;
        
        // Clear existing list
        warningsList.innerHTML = '';
        
        // Add tracking data
        this.state.trackingData.forEach(tracking => {
            const warningElement = document.createElement('div');
            warningElement.className = 'warning-item';
            warningElement.innerHTML = `
                <div class="warning-info">
                    <span class="warning-participant">${tracking.name}</span>
                    <span class="warning-status">Camera: ${tracking.cameraOn ? 'ON' : 'OFF'}</span>
                </div>
            `;
            warningsList.appendChild(warningElement);
        });
    }
    
    updateWarningSystemUI() {
        const toggle = document.getElementById('autoWarningsToggle');
        if (toggle) {
            toggle.checked = this.state.warningSystem.enabled;
        }
    }
    
    updateConnectionStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const connectionText = document.getElementById('connectionText');
        
        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }
        
        if (connectionText) {
            connectionText.textContent = text;
        }
    }
    
    updateStatusText(text, type = 'info') {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (statusText) {
            statusText.textContent = text;
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${type}`;
        }
    }
    
    updateStatusMessage() {
        if (!this.state.isConnected) {
            this.updateStatusText('Not connected to Zoom meeting', 'error');
            return;
        }
        
        if (this.state.isMonitoring) {
            this.updateStatusText('Monitoring active', 'success');
        } else if (this.state.isPaused) {
            this.updateStatusText('Monitoring paused', 'warning');
        } else {
            this.updateStatusText('Ready to monitor', 'info');
        }
    }
    
    updateLastUpdate() {
        const updateTime = document.getElementById('updateTime');
        if (updateTime && this.state.lastUpdate) {
            const now = new Date();
            const diff = now - this.state.lastUpdate;
            const seconds = Math.floor(diff / 1000);
            
            if (seconds < 60) {
                updateTime.textContent = `${seconds}s ago`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                updateTime.textContent = `${minutes}m ago`;
            } else {
                const hours = Math.floor(seconds / 3600);
                updateTime.textContent = `${hours}h ago`;
            }
        }
    }
    
    async startMonitoring() {
        if (!this.state.isConnected) {
            this.showNotification('Not connected to Zoom meeting', 'error');
            return;
        }
        
        try {
            this.updateStatusText('Starting monitoring...', 'info');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { 
                source: 'zoomwatch', 
                action: 'startMonitoring' 
            });
            
            if (response && response.success) {
                this.state.isMonitoring = true;
                this.state.isPaused = false;
                this.updateControlButtons();
                this.updateStatusText('Monitoring started', 'success');
                this.showNotification('Monitoring started successfully', 'success');
            } else {
                this.updateStatusText('Failed to start monitoring', 'error');
                this.showNotification('Failed to start monitoring', 'error');
            }
            
        } catch (error) {
            log(`❌ Error starting monitoring: ${error.message}`);
            this.updateStatusText('Start monitoring failed', 'error');
            this.showNotification('Failed to start monitoring: ' + error.message, 'error');
        }
    }
    
    async stopMonitoring() {
        try {
            this.updateStatusText('Stopping monitoring...', 'info');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { 
                source: 'zoomwatch', 
                action: 'stopMonitoring' 
            });
            
            if (response && response.success) {
                this.state.isMonitoring = false;
                this.state.isPaused = false;
                this.updateControlButtons();
                this.updateStatusText('Monitoring stopped', 'info');
                this.showNotification('Monitoring stopped', 'info');
            } else {
                this.updateStatusText('Failed to stop monitoring', 'error');
            }
            
        } catch (error) {
            log(`❌ Error stopping monitoring: ${error.message}`);
            this.updateStatusText('Stop monitoring failed', 'error');
        }
    }
    
    async pauseMonitoring() {
        try {
            this.updateStatusText('Pausing monitoring...', 'info');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { 
                source: 'zoomwatch', 
                action: 'pauseMonitoring' 
            });
            
            if (response && response.success) {
                this.state.isPaused = !this.state.isPaused;
                this.updateControlButtons();
                this.updateStatusText(this.state.isPaused ? 'Monitoring paused' : 'Monitoring resumed', 'warning');
                this.showNotification(this.state.isPaused ? 'Monitoring paused' : 'Monitoring resumed', 'info');
            } else {
                this.updateStatusText('Failed to pause/resume monitoring', 'error');
            }
            
        } catch (error) {
            log(`❌ Error pausing monitoring: ${error.message}`);
            this.updateStatusText('Pause monitoring failed', 'error');
        }
    }
    
    updateControlButtons() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (startBtn) {
            startBtn.style.display = this.state.isMonitoring ? 'none' : 'block';
        }
        
        if (stopBtn) {
            stopBtn.style.display = this.state.isMonitoring ? 'block' : 'none';
        }
        
        if (pauseBtn) {
            pauseBtn.style.display = this.state.isMonitoring ? 'block' : 'none';
            pauseBtn.innerHTML = `<span class="btn-icon">${this.state.isPaused ? '▶️' : '⏸️'}</span><span>${this.state.isPaused ? 'Resume' : 'Pause'}</span>`;
        }
    }
    
    async toggleAutoWarnings(enabled) {
        this.state.warningSystem.enabled = enabled;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { 
                source: 'zoomwatch', 
                action: 'toggleAutoWarnings' 
            });
            
            this.showNotification(`Auto-warnings ${enabled ? 'enabled' : 'disabled'}`, 'success');
            
        } catch (error) {
            log(`❌ Error toggling auto-warnings: ${error.message}`);
            this.showNotification('Failed to update auto-warnings setting', 'error');
        }
    }
    
    toggleParticipants() {
        const participantsSection = document.getElementById('participantsSection');
        const expandToggle = document.getElementById('expandToggle');
        
        if (participantsSection && expandToggle) {
            const isVisible = participantsSection.style.display !== 'none';
            participantsSection.style.display = isVisible ? 'none' : 'block';
            expandToggle.innerHTML = isVisible ? '👁️' : '👁️‍🗨️';
        }
    }
    
    async manualRefresh() {
        this.updateStatusText('Refreshing...', 'info');
        await this.requestData();
        this.updateStatusText('Refresh complete', 'success');
        
        setTimeout(() => {
            this.updateStatusMessage();
        }, 2000);
    }
    
    openSettings() {
        // Placeholder for settings functionality
        this.showNotification('Settings not yet implemented', 'info');
    }
    
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.state.isConnected && this.state.isMonitoring) {
                this.requestData();
            }
        }, 5000); // Refresh every 5 seconds when monitoring
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    setupStatCardAnimations() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });
        });
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    destroy() {
        this.stopAutoRefresh();
    }
}

// Utility function for logging
function log(message) {
    console.log(`[ZoomWatch Popup] ${message}`);
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.zoomWatchPopup = new ZoomWatchPopup();
});

// Clean up when popup is closed
window.addEventListener('beforeunload', () => {
    if (window.zoomWatchPopup) {
        window.zoomWatchPopup.destroy();
    }
});
