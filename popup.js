// ZoomWatch Popup - Clean & Focused Interface
// Advanced participant monitoring with real-time updates

class ZoomWatchPopup {
    constructor() {
        this.state = {
            isMonitoring: false,
            isPaused: false,
            isConnected: false,
            participants: [],
            trackingData: [],
            stats: {
                total: 0,
                camerasOff: 0,
                camerasOn: 0,
                warningsSent: 0
            },
            warningSystem: {
                enabled: true
            },
            lastUpdate: null,
            refreshInterval: null
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeUI();
        this.checkConnection();
        this.startAutoRefresh();
    }
    
    setupEventListeners() {
        // Control buttons
        document.getElementById('startBtn')?.addEventListener('click', () => this.startMonitoring());
        document.getElementById('stopBtn')?.addEventListener('click', () => this.stopMonitoring());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.pauseMonitoring());
        
        // Action buttons
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.manualRefresh());
        document.getElementById('testMessageBtn')?.addEventListener('click', () => this.testChatMessage());
        
        // Warning system controls
        document.getElementById('autoWarningsToggle')?.addEventListener('change', (e) => this.toggleAutoWarnings(e.target.checked));
        
        // Participants toggle
        document.getElementById('expandToggle')?.addEventListener('click', () => this.toggleParticipants());
        
        // Stat cards hover effects
        this.setupStatCardAnimations();
    }
    
    initializeUI() {
        this.updateConnectionStatus('connecting', 'Connecting...');
        this.updateStatsDisplay();
        this.updateStatusText('Initializing...', 'pending');
        this.updateButtonStates();
    }
    
    setupStatCardAnimations() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            });
        });
    }
    
    async checkConnection() {
        try {
            const response = await this.sendMessage({ action: 'ZOOMWATCH_PING' });
            if (response && response.success) {
                this.updateConnectionStatus('connected', 'Connected');
                this.state.isConnected = true;
                this.requestData();
            } else {
                this.updateConnectionStatus('disconnected', 'Not Connected');
                this.state.isConnected = false;
            }
        } catch (error) {
            this.updateConnectionStatus('disconnected', 'Connection Failed');
            this.state.isConnected = false;
        }
    }
    
    async requestData() {
        if (!this.state.isConnected) return;
        
        try {
            const response = await this.sendMessage({ action: 'requestData' });
            if (response && response.success) {
                this.updateData(response.data);
            }
        } catch (error) {
            console.error('Error requesting data:', error);
        }
    }
    
    updateData(data) {
        this.state.participants = data.participants || [];
        this.state.trackingData = data.trackingData || [];
        this.state.stats.total = data.total || 0;
        this.state.stats.camerasOff = data.camerasOff || 0;
        this.state.stats.camerasOn = this.state.stats.total - this.state.stats.camerasOff;
        this.state.stats.warningsSent = this.state.trackingData.reduce((sum, item) => sum + item.warningTimestamps.length, 0);
        
        this.state.lastUpdate = new Date();
        this.updateStatsDisplay();
        this.updateParticipantsList();
        this.updateLastUpdateTime();
    }
    
    updateStatsDisplay() {
        // Update total participants
        const totalEl = document.getElementById('totalParticipants');
        if (totalEl) {
            totalEl.textContent = this.state.stats.total;
            this.animateNumber(totalEl, this.state.stats.total);
        }
        
        // Update cameras off
        const camerasOffEl = document.getElementById('camerasOff');
        if (camerasOffEl) {
            camerasOffEl.textContent = this.state.stats.camerasOff;
            this.animateNumber(camerasOffEl, this.state.stats.camerasOff);
        }
        
        // Update cameras on
        const camerasOnEl = document.getElementById('camerasOn');
        if (camerasOnEl) {
            camerasOnEl.textContent = this.state.stats.camerasOn;
            this.animateNumber(camerasOnEl, this.state.stats.camerasOn);
        }
        
        // Update warnings sent
        const warningsEl = document.getElementById('warningsSent');
        if (warningsEl) {
            warningsEl.textContent = this.state.stats.warningsSent;
            this.animateNumber(warningsEl, this.state.stats.warningsSent);
        }
    }
    
    animateNumber(element, targetValue) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue === targetValue) return;
        
        const increment = (targetValue - currentValue) / 10;
        let current = currentValue;
        
        const animation = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(animation);
            }
            element.textContent = Math.round(current);
        }, 50);
    }
    
    updateParticipantsList() {
        const container = document.getElementById('participantsList');
        if (!container) return;
        
        if (this.state.participants.length === 0) {
            container.innerHTML = '<div class="no-participants">No participants found</div>';
            return;
        }
        
        const participantsHTML = this.state.participants.map(participant => {
            const statusClass = participant.cameraOn ? 'camera-on' : 'camera-off';
            const statusIcon = participant.cameraOn ? '📹' : '🚫';
            const statusText = participant.cameraOn ? 'Camera ON' : 'Camera OFF';
            
            return `
                <div class="participant-item ${statusClass}">
                    <div class="participant-info">
                        <span class="participant-name">${participant.name}</span>
                        <span class="participant-status">
                            ${statusIcon} ${statusText}
                        </span>
                    </div>
                    <div class="participant-actions">
                        <button class="btn-small" onclick="popup.sendWarning('${participant.name}')">
                            Send Warning
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = participantsHTML;
    }
    
    updateLastUpdateTime() {
        if (!this.state.lastUpdate) return;
        
        const now = new Date();
        const diff = now - this.state.lastUpdate;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        
        let timeText;
        if (seconds < 60) {
            timeText = `${seconds}s ago`;
        } else if (minutes < 60) {
            timeText = `${minutes}m ago`;
        } else {
            const hours = Math.floor(minutes / 60);
            timeText = `${hours}h ago`;
        }
        
        const updateTimeEl = document.getElementById('updateTime');
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (updateTimeEl) updateTimeEl.textContent = this.state.lastUpdate.toLocaleTimeString();
        if (lastUpdateEl) lastUpdateEl.textContent = `Updated ${timeText}`;
    }
    
    updateConnectionStatus(status, message) {
        const statusEl = document.getElementById('connectionStatus');
        if (!statusEl) return;
        
        statusEl.className = `status-indicator ${status}`;
        statusEl.textContent = message;
    }
    
    updateStatusText(text, type = 'info') {
        const statusEl = document.getElementById('statusText');
        if (!statusEl) return;
        
        statusEl.textContent = text;
        statusEl.className = `status-text ${type}`;
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (startBtn) startBtn.disabled = this.state.isMonitoring;
        if (stopBtn) stopBtn.disabled = !this.state.isMonitoring;
        if (pauseBtn) pauseBtn.disabled = !this.state.isMonitoring;
        
        if (pauseBtn) {
            pauseBtn.textContent = this.state.isPaused ? 'Resume' : 'Pause';
        }
    }
    
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || button.textContent;
        }
    }
    
    // Monitoring controls
    async startMonitoring() {
        this.setButtonLoading('startBtn', true);
        
        try {
            const response = await this.sendMessage({ action: 'startMonitoring' });
            if (response && response.success) {
                this.state.isMonitoring = true;
                this.state.isPaused = false;
                this.updateStatusText('Monitoring started successfully', 'success');
                this.updateButtonStates();
                this.showSuccessAnimation();
            } else {
                this.updateStatusText('Failed to start monitoring', 'error');
                this.showErrorAnimation();
            }
        } catch (error) {
            this.updateStatusText('Error starting monitoring', 'error');
            this.showErrorAnimation();
        } finally {
            this.setButtonLoading('startBtn', false);
        }
    }
    
    async stopMonitoring() {
        this.setButtonLoading('stopBtn', true);
        
        try {
            const response = await this.sendMessage({ action: 'stopMonitoring' });
            if (response && response.success) {
                this.state.isMonitoring = false;
                this.state.isPaused = false;
                this.updateStatusText('Monitoring stopped', 'warning');
                this.updateButtonStates();
            }
        } catch (error) {
            this.updateStatusText('Error stopping monitoring', 'error');
        } finally {
            this.setButtonLoading('stopBtn', false);
        }
    }
    
    async pauseMonitoring() {
        this.setButtonLoading('pauseBtn', true);
        
        try {
            const response = await this.sendMessage({ 
                action: this.state.isPaused ? 'resumeMonitoring' : 'pauseMonitoring' 
            });
            
            if (response && response.success) {
                this.state.isPaused = !this.state.isPaused;
                this.updateStatusText(
                    this.state.isPaused ? 'Monitoring paused' : 'Monitoring resumed', 
                    'warning'
                );
                this.updateButtonStates();
            }
        } catch (error) {
            this.updateStatusText('Error pausing monitoring', 'error');
        } finally {
            this.setButtonLoading('pauseBtn', false);
        }
    }
    
    async manualRefresh() {
        this.setButtonLoading('refreshBtn', true);
        
        try {
            await this.requestData();
            this.updateStatusText('Data refreshed', 'success');
            this.showSuccessAnimation();
        } catch (error) {
            this.updateStatusText('Error refreshing data', 'error');
            this.showErrorAnimation();
        } finally {
            this.setButtonLoading('refreshBtn', false);
        }
    }
    
    async testChatMessage() {
        const message = prompt('Enter test message:');
        if (!message) return;
        
        const recipient = prompt('Enter recipient name (or leave empty for Everyone):') || 'Everyone';
        
        try {
            const response = await this.sendMessage({
                action: 'testChatMessage',
                data: { message, recipient }
            });
            
            if (response && response.success) {
                this.updateStatusText('Test message sent successfully', 'success');
                this.showSuccessAnimation();
            } else {
                this.updateStatusText('Failed to send test message', 'error');
                this.showErrorAnimation();
            }
        } catch (error) {
            this.updateStatusText('Error sending test message', 'error');
            this.showErrorAnimation();
        }
    }
    
    async toggleAutoWarnings(enabled) {
        try {
            const response = await this.sendMessage({ action: 'toggleAutoWarnings' });
            if (response && response.success) {
                this.state.warningSystem.enabled = enabled;
                this.updateStatusText(
                    `Auto-warnings ${enabled ? 'enabled' : 'disabled'}`, 
                    'success'
                );
            }
        } catch (error) {
            this.updateStatusText('Error toggling auto-warnings', 'error');
        }
    }
    
    async sendWarning(participantName) {
        const message = prompt(`Enter warning message for ${participantName}:`);
        if (!message) return;
        
        try {
            const response = await this.sendMessage({
                action: 'testChatMessage',
                data: { message, recipient: participantName }
            });
            
            if (response && response.success) {
                this.updateStatusText(`Warning sent to ${participantName}`, 'success');
                this.showSuccessAnimation();
            } else {
                this.updateStatusText(`Failed to send warning to ${participantName}`, 'error');
                this.showErrorAnimation();
            }
        } catch (error) {
            this.updateStatusText(`Error sending warning to ${participantName}`, 'error');
            this.showErrorAnimation();
        }
    }
    
    toggleParticipants() {
        const container = document.getElementById('participantsContainer');
        const toggle = document.getElementById('expandToggle');
        
        if (!container || !toggle) return;
        
        const isExpanded = container.classList.contains('expanded');
        
        if (isExpanded) {
            container.classList.remove('expanded');
            toggle.textContent = 'Show Participants';
        } else {
            container.classList.add('expanded');
            toggle.textContent = 'Hide Participants';
        }
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
    
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) {
                        reject(new Error('No active tab found'));
                        return;
                    }
                    
                    const tab = tabs[0];
                    chrome.tabs.sendMessage(tab.id, { ...message, source: 'zoomwatch' }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    showSuccessAnimation() {
        const statusEl = document.getElementById('statusText');
        if (statusEl) {
            statusEl.style.animation = 'successPulse 0.5s ease-in-out';
            setTimeout(() => {
                statusEl.style.animation = '';
            }, 500);
        }
    }
    
    showErrorAnimation() {
        const statusEl = document.getElementById('statusText');
        if (statusEl) {
            statusEl.style.animation = 'errorShake 0.5s ease-in-out';
            setTimeout(() => {
                statusEl.style.animation = '';
            }, 500);
        }
    }
    
    destroy() {
        this.stopAutoRefresh();
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popup = new ZoomWatchPopup();
});

// Cleanup when popup is closed
window.addEventListener('beforeunload', () => {
    if (window.popup) {
        window.popup.destroy();
    }
});
