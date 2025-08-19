// ZoomWatch Side Panel - Modern & Sleek Interface
// Advanced participant monitoring with real-time updates

class ZoomWatchSidePanel {
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
                monitorProfile: null
            },
        lastUpdate: null,
        refreshInterval: null
      };
        
      this.init();
    }
  
    init() {
        // Initializing ZoomWatch popup
        
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
        
        // Warning system controls
        document.getElementById('autoWarningsToggle')?.addEventListener('change', (e) => this.toggleAutoWarnings(e.target.checked));
        document.getElementById('testMessageBtn')?.addEventListener('click', () => this.testChatMessage());
        
        // Debug and reverse engineering controls
        document.getElementById('exploreBtn')?.addEventListener('click', () => this.exploreZoomInterface());
        document.getElementById('findElementsBtn')?.addEventListener('click', () => this.findClickableElements());
        document.getElementById('analyzePanelsBtn')?.addEventListener('click', () => this.analyzePanels());
        document.getElementById('interceptEventsBtn')?.addEventListener('click', () => this.interceptZoomEvents());
        document.getElementById('findAPIsBtn')?.addEventListener('click', () => this.findZoomAPIs());
        document.getElementById('debugPanelButtonsBtn')?.addEventListener('click', () => this.debugPanelButtons());
        document.getElementById('debugChatButtonsBtn')?.addEventListener('click', () => this.debugChatButtons());
        document.getElementById('checkMeetingContextBtn')?.addEventListener('click', () => this.checkMeetingContext());
        document.getElementById('debugParticipantSelectorBtn')?.addEventListener('click', () => this.debugParticipantSelector());
        document.getElementById('openPanelsBtn')?.addEventListener('click', () => this.openPanels());
        document.getElementById('forceOpenPanelsBtn')?.addEventListener('click', () => this.forceOpenPanels());
        document.getElementById('debugMeetingDetectionBtn')?.addEventListener('click', () => this.debugMeetingDetection());
        document.getElementById('debugRecipientSelectionBtn')?.addEventListener('click', () => this.debugRecipientSelection());
        document.getElementById('forceSelectRecipientBtn')?.addEventListener('click', () => this.forceSelectRecipient());
        document.getElementById('debugMessageDeduplicationBtn')?.addEventListener('click', () => this.debugMessageDeduplication());
        
        // Panel control testing buttons
        document.getElementById('openParticipantsBtn')?.addEventListener('click', () => this.openParticipantsPanel());
        document.getElementById('closeParticipantsBtn')?.addEventListener('click', () => this.closeParticipantsPanel());
        document.getElementById('openChatBtn')?.addEventListener('click', () => this.openChatPanel());
        document.getElementById('closeChatBtn')?.addEventListener('click', () => this.closeChatPanel());
        
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
            // Connection check failed
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
        // Starting monitoring
        
        // Add loading state
        this.setButtonLoading('startBtn', true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(
                tab.id,
                { source: 'zoomwatch', action: 'startMonitoring' },
                { frameId: 0 }
            );
            
            if (response && response.success) {
                this.state.isMonitoring = true;
                this.updateStatusText('Monitoring active...', 'success');
                this.updateButtonStates();
                this.showSuccessAnimation();
                // Monitoring started successfully
            } else {
                // Failed to start monitoring
                this.updateStatusText('Failed to start monitoring', 'error');
                this.showErrorAnimation();
            }
        } catch (error) {
            // Error starting monitoring
            this.updateStatusText('Error starting monitoring', 'error');
            this.showErrorAnimation();
        } finally {
            this.setButtonLoading('startBtn', false);
        }
    }
    
    async stopMonitoring() {
        // Stopping monitoring
        
        this.setButtonLoading('stopBtn', true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(
                tab.id,
                { source: 'zoomwatch', action: 'stopMonitoring' },
                { frameId: 0 }
            );
            
            if (response && response.success) {
                this.state.isMonitoring = false;
                this.updateStatusText('Monitoring stopped', 'warning');
                this.updateButtonStates();
                // Monitoring stopped successfully
            }
        } catch (error) {
            // Error stopping monitoring
            this.updateStatusText('Error stopping monitoring', 'error');
        } finally {
            this.setButtonLoading('stopBtn', false);
        }
    }
    
    async pauseMonitoring() {
        // Pausing monitoring
        
        this.setButtonLoading('pauseBtn', true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(
                tab.id,
                { source: 'zoomwatch', action: 'pauseMonitoring' },
                { frameId: 0 }
            );
            
            if (response && response.success) {
                this.state.isPaused = true;
                this.updateStatusText('Monitoring paused', 'warning');
                this.updateButtonStates();
                // Monitoring paused successfully
            }
        } catch (error) {
            // Error pausing monitoring
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
                // Calculate warnings sent from tracking data
                let totalWarnings = 0;
                if (response.data.trackingData) {
                    this.state.trackingData = response.data.trackingData;
                    totalWarnings = response.data.trackingData.reduce((sum, participant) => {
                        return sum + participant.warningTimestamps.length;
                    }, 0);
                }
                
                this.state.stats = {
                    total: response.data.total || 0,
                    camerasOff: response.data.camerasOff || 0,
                    camerasOn: (response.data.total || 0) - (response.data.camerasOff || 0),
                    remindersSent: this.state.stats.remindersSent,
                    warningsSent: totalWarnings
                };
                
                // Update warning system info
                if (response.data.monitorProfile) {
                    this.state.warningSystem.monitorProfile = response.data.monitorProfile;
                    this.updateMonitorProfile();
                }
                
                // Update participants list if available
                if (response.data.participants) {
                    this.state.participants = response.data.participants;
                    this.updateParticipantsList();
                }
                
                this.updateStatsDisplay();
                this.updateWarningStats();
                this.updateTimestamp();
                this.animateStatsUpdate();
                
                // Stats updated successfully
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
    
    // Warning system methods
    async toggleAutoWarnings(enabled) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleAutoWarnings' });
            
            if (response && response.success) {
                this.state.warningSystem.enabled = response.enabled;
                this.updateStatusText(`Auto-warnings ${response.enabled ? 'enabled' : 'disabled'}`, 'info');
                log(`✅ Auto-warnings ${response.enabled ? 'enabled' : 'disabled'}`);
            }
        } catch (error) {
            log(`❌ Error toggling auto-warnings: ${error.message}`);
            // Reset toggle on error
            document.getElementById('autoWarningsToggle').checked = this.state.warningSystem.enabled;
        }
    }
    
    async testChatMessage() {
        try {
            this.updateStatusText('Sending test message...', 'info');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'testChatMessage',
                data: {
                    message: 'Test message from ZoomWatch - Chat integration working!',
                    recipient: 'Everyone'
                }
            });
            
            if (response && response.success) {
                this.updateStatusText('Test message sent successfully!', 'success');
                log('✅ Test message sent successfully');
        } else {
                this.updateStatusText('Test message failed', 'error');
                log('❌ Test message failed');
            }
            
            // Reset status after 3 seconds
            setTimeout(() => {
                this.updateStatusMessage();
            }, 3000);
            
        } catch (error) {
            log(`❌ Error sending test message: ${error.message}`);
            this.updateStatusText('Test message error', 'error');
        }
    }
    
    updateWarningStats() {
        const warningsSentElement = document.getElementById('warningsSentCount');
        if (warningsSentElement) {
            warningsSentElement.textContent = this.state.stats.warningsSent || 0;
        }
    }
    
    updateMonitorProfile() {
        const monitorElement = document.getElementById('monitorProfile');
        if (monitorElement) {
            const profile = this.state.warningSystem.monitorProfile;
            if (profile) {
                monitorElement.textContent = profile.length > 15 ? profile.substring(0, 15) + '...' : profile;
                monitorElement.title = profile; // Show full name in tooltip
            } else {
                monitorElement.textContent = 'Detecting...';
                monitorElement.title = '';
            }
        }
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
    
    // === REVERSE ENGINEERING METHODS ===
    
    async exploreZoomInterface() {
        try {
            this.updateStatusText('Exploring Zoom interface...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'exploreInterface' });
            
            if (response && response.success) {
                log('✅ Interface exploration complete:', response.data);
                this.updateStatusText('Interface exploration complete - check console & extension logs', 'success');
            } else {
                this.updateStatusText('Interface exploration failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error exploring interface: ${error.message}`);
            this.updateStatusText('Interface exploration error', 'error');
        }
    }
    
    async findClickableElements() {
        try {
            this.updateStatusText('Finding clickable elements...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'findClickableElements' });
            
            if (response && response.success) {
                log('✅ Element analysis complete:', response.data);
                this.updateStatusText('Element analysis complete - check console & extension logs', 'success');
            } else {
                this.updateStatusText('Element analysis failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error finding elements: ${error.message}`);
            this.updateStatusText('Element analysis error', 'error');
        }
    }
    
    async analyzePanels() {
        try {
            this.updateStatusText('Analyzing panels...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'analyzePanels' });
            
            if (response && response.success) {
                log('✅ Panel analysis complete:', response.data);
                this.updateStatusText('Panel analysis complete - check console & extension logs', 'success');
            } else {
                this.updateStatusText('Panel analysis failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error analyzing panels: ${error.message}`);
            this.updateStatusText('Panel analysis error', 'error');
        }
    }
    
    async interceptZoomEvents() {
        try {
            this.updateStatusText('Starting event interception...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'interceptEvents' });
            
            if (response && response.success) {
                log('✅ Event interception started:', response.data);
                this.updateStatusText('Event interception active - perform actions now!', 'success');
            } else {
                this.updateStatusText('Event interception failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 5000);
        } catch (error) {
            log(`❌ Error intercepting events: ${error.message}`);
            this.updateStatusText('Event interception error', 'error');
        }
    }
    
    async findZoomAPIs() {
        try {
            this.updateStatusText('Discovering Zoom APIs...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'findAPIs' });
            
            if (response && response.success) {
                log('✅ API discovery complete:', response.data);
                this.updateStatusText('API discovery complete - check console & extension logs', 'success');
            } else {
                this.updateStatusText('API discovery failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error finding APIs: ${error.message}`);
            this.updateStatusText('API discovery error', 'error');
        }
    }
    
    async debugPanelButtons() {
        try {
            this.updateStatusText('Debugging panel buttons...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'debugPanelButtons' });
            
            if (response && response.success) {
                this.updateStatusText('Panel debug complete - check console', 'success');
            } else {
                this.updateStatusText('Panel debug failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error debugging panels: ${error.message}`);
            this.updateStatusText('Panel debug error', 'error');
        }
    }
    
    async debugChatButtons() {
        try {
            this.updateStatusText('Debugging chat buttons...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'debugChatButtons' });
            
            if (response && response.success) {
                this.updateStatusText('Chat debug complete - check console', 'success');
            } else {
                this.updateStatusText('Chat debug failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error debugging chat: ${error.message}`);
            this.updateStatusText('Chat debug error', 'error');
        }
    }
    
    async checkMeetingContext() {
        try {
            this.updateStatusText('Checking meeting context...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkMeetingContext' });
            
            if (response && response.success) {
                const isMeeting = response.data;
                if (isMeeting) {
                    this.updateStatusText('✅ In Zoom meeting - panel controls enabled', 'success');
                } else {
                    this.updateStatusText('❌ Not in Zoom meeting - panel controls disabled', 'error');
                }
            } else {
                this.updateStatusText('Context check failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error checking context: ${error.message}`);
            this.updateStatusText('Context check error', 'error');
        }
    }
    
    async debugParticipantSelector() {
        try {
            this.updateStatusText('Debugging participant selector...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Force message to top frame only with source tag
            const response = await chrome.tabs.sendMessage(
                tab.id,
                { source: 'zoomwatch', action: 'debugParticipantSelector' },
                { frameId: 0 } // Top-level frame only
            );
            
            if (response && response.success) {
                this.updateStatusText('Participant selector debug complete - check console', 'success');
            } else {
                this.updateStatusText(response?.message || 'Participant selector debug failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error debugging participant selector: ${error.message}`);
            this.updateStatusText('Participant selector debug error', 'error');
        }
    }
    
    async openPanels() {
        try {
            this.updateStatusText('Opening panels...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'openPanels' });
            
            if (response && response.success) {
                this.updateStatusText('Panels opened successfully - check console', 'success');
            } else {
                this.updateStatusText('Failed to open panels', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error opening panels: ${error.message}`);
            this.updateStatusText('Panel opening error', 'error');
        }
    }
    
    async forceOpenPanels() {
        try {
            this.updateStatusText('Force opening panels...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'forceOpenPanels' });
            
            if (response && response.success) {
                this.updateStatusText('Panels force opened - check console', 'success');
            } else {
                this.updateStatusText('Failed to force open panels', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error force opening panels: ${error.message}`);
            this.updateStatusText('Force panel opening error', 'error');
        }
    }
    
    async debugMeetingDetection() {
        try {
            this.updateStatusText('Debugging meeting detection...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'debugMeetingDetection' });
            
            if (response && response.success) {
                this.updateStatusText('Meeting detection debug complete - check console', 'success');
            } else {
                this.updateStatusText('Meeting detection debug failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error debugging meeting detection: ${error.message}`);
            this.updateStatusText('Meeting detection debug error', 'error');
        }
    }
    
    async debugRecipientSelection() {
        try {
            this.updateStatusText('Debugging recipient selection...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'debugRecipientSelection' });
            
            if (response && response.success) {
                this.updateStatusText('Recipient selection debug complete - check console', 'success');
            } else {
                this.updateStatusText('Recipient selection debug failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error debugging recipient selection: ${error.message}`);
            this.updateStatusText('Recipient selection debug error', 'error');
        }
    }
    
    async forceSelectRecipient() {
        try {
            this.updateStatusText('Force selecting recipient...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'forceSelectRecipient' });
            
            if (response && response.success) {
                this.updateStatusText('Force selection complete - check console', 'success');
            } else {
                this.updateStatusText('Force selection failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error force selecting recipient: ${error.message}`);
            this.updateStatusText('Force selection error', 'error');
        }
    }
    
    async debugMessageDeduplication() {
        try {
            this.updateStatusText('Debugging message deduplication...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'debugMessageDeduplication' });
            
            if (response && response.success) {
                this.updateStatusText('Message deduplication debug complete - check console', 'success');
            } else {
                this.updateStatusText('Message deduplication debug failed', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 3000);
        } catch (error) {
            log(`❌ Error debugging message deduplication: ${error.message}`);
            this.updateStatusText('Message deduplication debug error', 'error');
        }
    }
    
    // === PANEL CONTROL METHODS ===
    
    async openParticipantsPanel() {
        try {
            this.updateStatusText('Opening participants panel...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'openParticipants' });
            
            if (response && response.success) {
                this.updateStatusText('Participants panel opened!', 'success');
            } else {
                this.updateStatusText('Failed to open participants panel', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 2000);
        } catch (error) {
            log(`❌ Error opening participants panel: ${error.message}`);
            this.updateStatusText('Error opening participants panel', 'error');
        }
    }
    
    async closeParticipantsPanel() {
        try {
            this.updateStatusText('Closing participants panel...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'closeParticipants' });
            
            if (response && response.success) {
                this.updateStatusText('Participants panel closed!', 'success');
            } else {
                this.updateStatusText('Failed to close participants panel', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 2000);
        } catch (error) {
            log(`❌ Error closing participants panel: ${error.message}`);
            this.updateStatusText('Error closing participants panel', 'error');
        }
    }
    
    async openChatPanel() {
        try {
            this.updateStatusText('Opening chat panel...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'openChat' });
            
            if (response && response.success) {
                this.updateStatusText('Chat panel opened!', 'success');
            } else {
                this.updateStatusText('Failed to open chat panel', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 2000);
        } catch (error) {
            log(`❌ Error opening chat panel: ${error.message}`);
            this.updateStatusText('Error opening chat panel', 'error');
        }
    }
    
    async closeChatPanel() {
        try {
            this.updateStatusText('Closing chat panel...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'closeChat' });
            
            if (response && response.success) {
                this.updateStatusText('Chat panel closed!', 'success');
            } else {
                this.updateStatusText('Failed to close chat panel', 'error');
            }
            setTimeout(() => this.updateStatusMessage(), 2000);
        } catch (error) {
            log(`❌ Error closing chat panel: ${error.message}`);
            this.updateStatusText('Error closing chat panel', 'error');
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
    console.log(`[ZoomWatch Side Panel] ${message}`);
}

// Initialize side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZoomWatchSidePanel();
});
  