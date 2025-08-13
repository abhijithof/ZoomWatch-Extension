// ZoomWatch Popup - Modern & Sleek Interface
// Advanced participant monitoring with real-time updates

class ZoomWatchPopup {
    constructor() {
        this.state = {
            isMonitoring: false,
            isPaused: false,
            isConnected: false,
            participants: [],
            stats: {
                total: 0,
                camerasOff: 0,
                camerasOn: 0,
                remindersSent: 0
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
        document.getElementById('debugBtn')?.addEventListener('click', () => this.debugCameraDetection());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        
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
        
        // Update timestamp
        this.updateTimestamp();
        
        // Animate entrance
        this.animateEntrance();
    }
    
    animateEntrance() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }
    
    setupStatCardAnimations() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    // Connection and status management
    async checkConnection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url && tab.url.includes('zoom.us')) {
                this.state.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected');
                await this.requestFreshData();
            } else {
                this.state.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Not on Zoom');
                this.updateStatusText('Please navigate to a Zoom meeting', 'warning');
            }
        } catch (error) {
            log(`❌ Connection check failed: ${error.message}`);
            this.updateConnectionStatus('disconnected', 'Connection Failed');
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
    
    updateStatusText(message, type = 'info') {
        const statusText = document.getElementById('statusText');
        const pulseDot = document.querySelector('.pulse-dot');
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        if (pulseDot) {
            pulseDot.style.background = this.getStatusColor(type);
        }
    }
    
    getStatusColor(type) {
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            pending: '#8b5cf6'
        };
        return colors[type] || colors.info;
    }
    
    // Monitoring controls
    async startMonitoring() {
        log('🟢 Starting monitoring...');
        
        // Add loading state
        this.setButtonLoading('startBtn', true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'startMonitoring' });
            
            if (response && response.success) {
                this.state.isMonitoring = true;
                this.updateStatusText('Monitoring active...', 'success');
                this.updateButtonStates();
                this.showSuccessAnimation();
                log('✅ Monitoring started successfully');
            } else {
                log('❌ Failed to start monitoring');
                this.updateStatusText('Failed to start monitoring', 'error');
                this.showErrorAnimation();
            }
        } catch (error) {
            log(`❌ Error starting monitoring: ${error.message}`);
            this.updateStatusText('Error starting monitoring', 'error');
            this.showErrorAnimation();
        } finally {
            this.setButtonLoading('startBtn', false);
        }
    }
    
    async stopMonitoring() {
        log('🔴 Stopping monitoring...');
        
        this.setButtonLoading('stopBtn', true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'stopMonitoring' });
            
            if (response && response.success) {
                this.state.isMonitoring = false;
                this.updateStatusText('Monitoring stopped', 'warning');
                this.updateButtonStates();
                log('✅ Monitoring stopped successfully');
            }
        } catch (error) {
            log(`❌ Error stopping monitoring: ${error.message}`);
            this.updateStatusText('Error stopping monitoring', 'error');
        } finally {
            this.setButtonLoading('stopBtn', false);
        }
    }
    
    async pauseMonitoring() {
        log('⏸️ Pausing monitoring...');
        
        this.setButtonLoading('pauseBtn', true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'pauseMonitoring' });
            
            if (response && response.success) {
                this.state.isPaused = true;
                this.updateStatusText('Monitoring paused', 'warning');
                this.updateButtonStates();
                log('✅ Monitoring paused successfully');
            }
        } catch (error) {
            log(`❌ Error pausing monitoring: ${error.message}`);
            this.updateStatusText('Error pausing monitoring', 'error');
        } finally {
            this.setButtonLoading('pauseBtn', false);
        }
    }
    
    // UI Helper methods
    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.6';
            const iconSpan = button.querySelector('.btn-icon');
            if (iconSpan) {
                iconSpan.textContent = '⏳';
            }
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            // Restore original icon based on button
            const iconSpan = button.querySelector('.btn-icon');
            if (iconSpan) {
                const originalIcons = {
                    'startBtn': '▶️',
                    'stopBtn': '⏹️',
                    'pauseBtn': '⏸️'
                };
                iconSpan.textContent = originalIcons[buttonId] || '▶️';
            }
        }
    }
    
    showSuccessAnimation() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transform = 'scale(1.05)';
                card.style.transition = 'transform 0.2s ease';
                
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
    }
    
    showErrorAnimation() {
        const container = document.querySelector('.popup-container');
        if (container) {
            container.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                container.style.animation = '';
            }, 500);
        }
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.state.isMonitoring) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'flex';
            pauseBtn.style.display = 'flex';
        } else {
            startBtn.style.display = 'flex';
            stopBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
        }
    }
    
    // Data management
    async requestFreshData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'requestData' });
            
            if (response && response.success && response.data) {
                this.state.stats = {
                    total: response.data.total || 0,
                    camerasOff: response.data.camerasOff || 0,
                    camerasOn: (response.data.total || 0) - (response.data.camerasOff || 0),
                    remindersSent: this.state.stats.remindersSent
                };
                
                // Update participants list if available
                if (response.data.participants) {
                    this.state.participants = response.data.participants;
                    this.updateParticipantsList();
                }
                
                this.updateStatsDisplay();
                this.updateTimestamp();
                this.animateStatsUpdate();
                
                log(`✅ Updated stats: ${this.state.stats.total} participants, ${this.state.stats.camerasOff} cameras off`);
            } else {
                // Fallback: try to get data from localStorage
                await this.loadDataFromStorage();
            }
        } catch (error) {
            log(`❌ Error requesting data: ${error.message}`);
            await this.loadDataFromStorage();
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
                
                this.state.stats = {
                    total: total,
                    camerasOff: camerasOff,
                    camerasOn: total - camerasOff,
                    remindersSent: this.state.stats.remindersSent
                };
                
                this.state.participants = participants;
                this.updateStatsDisplay();
                this.updateParticipantsList();
                this.updateTimestamp();
                log(`✅ Loaded data from storage: ${total} participants, ${camerasOff} cameras off`);
            }
        } catch (error) {
            log(`❌ Error loading from storage: ${error.message}`);
        }
    }
    
    // Display update methods
    updateStatsDisplay() {
        this.updateStatCard('participantCount', this.state.stats.total);
        this.updateStatCard('camerasOnCount', this.state.stats.camerasOn);
        this.updateStatCard('camerasOffCount', this.state.stats.camerasOff);
        
        // Update status message
        this.updateStatusMessage();
    }
    
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate number change
            const currentValue = parseInt(element.textContent) || 0;
            if (currentValue !== value) {
                this.animateNumberChange(element, currentValue, value);
            }
        }
    }
    
    animateNumberChange(element, from, to) {
        const duration = 500;
        const steps = 30;
        const stepValue = (to - from) / steps;
        let current = from;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            current += stepValue;
            element.textContent = Math.round(current);
            
            if (step >= steps) {
                clearInterval(timer);
                element.textContent = to;
            }
        }, duration / steps);
    }
    
    animateStatsUpdate() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    updateStatusMessage() {
        if (this.state.stats.total === 0) {
            this.updateStatusText('No participants detected', 'info');
        } else if (this.state.stats.camerasOff === 0) {
            this.updateStatusText('All cameras are ON', 'success');
        } else if (this.state.stats.camerasOff === this.state.stats.total) {
            this.updateStatusText('All cameras are OFF', 'warning');
        } else {
            this.updateStatusText(`${this.state.stats.camerasOff} camera(s) OFF`, 'warning');
        }
    }
    
    updateParticipantsList() {
        const participantsList = document.getElementById('participantsList');
        const participantsSection = document.getElementById('participantsSection');
        
        if (!participantsList || !participantsSection) return;
        
        if (this.state.participants.length > 0) {
            participantsSection.style.display = 'block';
            
            participantsList.innerHTML = '';
            this.state.participants.forEach(participant => {
                const item = this.createParticipantItem(participant);
                participantsList.appendChild(item);
            });
        } else {
            participantsSection.style.display = 'none';
        }
    }
    
    createParticipantItem(participant) {
        const item = document.createElement('div');
        item.className = 'participant-item';
        
        const name = document.createElement('span');
        name.className = 'participant-name';
        name.textContent = participant.name || 'Unknown';
        
        const status = document.createElement('span');
        status.className = `camera-status ${participant.cameraOn ? 'on' : 'off'}`;
        status.innerHTML = `
            <span>${participant.cameraOn ? '🟢' : '🔴'}</span>
            <span>${participant.cameraOn ? 'ON' : 'OFF'}</span>
        `;
        
        item.appendChild(name);
        item.appendChild(status);
        
        return item;
    }
    
    updateTimestamp() {
        this.state.lastUpdate = new Date();
        const updateTimeElement = document.getElementById('updateTime');
        const lastUpdateElement = document.getElementById('lastUpdate');
        
        if (updateTimeElement) {
            updateTimeElement.textContent = this.formatTime(this.state.lastUpdate);
        }
        
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Updated ${this.formatRelativeTime(this.state.lastUpdate)}`;
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    }
    
    // Auto-refresh and intervals
    startAutoRefresh() {
        if (this.state.refreshInterval) {
            clearInterval(this.state.refreshInterval);
        }
        
        this.state.refreshInterval = setInterval(async () => {
            if (this.state.isMonitoring && !this.state.isPaused) {
                await this.requestFreshData();
            }
        }, 2000);
    }
    
    stopAutoRefresh() {
        if (this.state.refreshInterval) {
            clearInterval(this.state.refreshInterval);
            this.state.refreshInterval = null;
        }
    }
    
    // Action button handlers
    async manualRefresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
            }, 500);
        }
        
        await this.requestFreshData();
    }
    
    toggleParticipants() {
        const participantsList = document.getElementById('participantsList');
        const expandToggle = document.getElementById('expandToggle');
        
        if (participantsList && expandToggle) {
            const isVisible = participantsList.style.display !== 'none';
            participantsList.style.display = isVisible ? 'none' : 'block';
            expandToggle.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
    
    openSettings() {
        // Placeholder for settings functionality
        this.updateStatusText('Settings coming soon!', 'info');
        setTimeout(() => {
            this.updateStatusMessage();
        }, 2000);
    }
    
    async debugCameraDetection() {
        log('🔍 Debugging camera detection...');
        
        this.updateStatusText('Running debug...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Execute debug script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    console.log('\n🔍 === ZOOMWATCH DEBUG INFO ===');
                    console.log('Timestamp:', new Date().toISOString());
                    console.log('URL:', window.location.href);
                    console.log('ZoomWatch loaded:', !!window.ZoomWatch);
                    
                    if (window.ZoomWatch) {
                        console.log('Available functions:', Object.keys(window.ZoomWatch));
                        
                        if (typeof window.ZoomWatch.findParticipantsList === 'function') {
                            const list = window.ZoomWatch.findParticipantsList();
                            console.log('Participants list element:', list);
                            
                            if (list) {
                                const participants = window.ZoomWatch.parseParticipants(list);
                                console.log('Parsed participants:', participants);
                                console.log('Total participants:', participants.length);
                                
                                participants.forEach((p, i) => {
                                    console.log(`Participant ${i + 1}:`, p.name, '- Camera:', p.cameraOn ? 'ON' : 'OFF');
                                });
                            } else {
                                console.log('❌ No participants list found');
                            }
                        } else {
                            console.log('❌ findParticipantsList function not available');
                        }
                    } else {
                        console.log('❌ ZoomWatch not loaded - extension may not be running');
                    }
                    console.log('=== END DEBUG INFO ===\n');
                }
            });
            
            this.updateStatusText('Debug complete - check console', 'success');
            
            // Reset status after 3 seconds
            setTimeout(() => {
                this.updateStatusMessage();
            }, 3000);
            
        } catch (error) {
            log(`❌ Error debugging: ${error.message}`);
            this.updateStatusText('Debug failed', 'error');
        }
    }
}

// Add shake animation to CSS
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;

// Inject shake animation CSS
const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Logging function
function log(message) {
    console.log(`[ZoomWatch Popup] ${message}`);
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZoomWatchPopup();
});
