// ZoomWatch - Popup (Clean)

class ZoomWatchPopup {
    constructor() {
      this.state = {
        isMonitoring: false,
        isPaused: false,
        isConnected: false,
        participants: [],
        trackingData: [],
        stats: { total: 0, camerasOff: 0, camerasOn: 0, warningsSent: 0 },
        warningSystem: { enabled: true, monitorProfile: null },
        lastUpdate: null,
        refreshInterval: null
      };
      this.init();
    }
  
    init() {
      this.setupEvents();
      this.initializeUI();
      this.checkConnection();
      this.startAutoRefresh();
    }
  
    setupEvents() {
      // Controls
      document.getElementById('startBtn')?.addEventListener('click', () => this.startMonitoring());
      document.getElementById('stopBtn')?.addEventListener('click', () => this.stopMonitoring());
      document.getElementById('pauseBtn')?.addEventListener('click', () => this.pauseMonitoring());
  
      // Actions
      document.getElementById('refreshBtn')?.addEventListener('click', () => this.requestFreshData());
      document.getElementById('settingsBtn')?.addEventListener('click', () => this.toast('Settings coming soon'));
      document.getElementById('expandToggle')?.addEventListener('click', () => this.toggleParticipants());
  
      // Warning controls
      document.getElementById('autoWarningsToggle')?.addEventListener('change', () => this.toggleAutoWarnings());
      document.getElementById('testMessageBtn')?.addEventListener('click', () => this.testChatMessage());
    }
  
    initializeUI() {
      this.updateConnectionStatus('connecting', 'Connecting...');
      this.updateStatusText('Initializing...', 'pending');
      this.updateStatsDisplay({ total: 0, camerasOn: 0, camerasOff: 0 });
      this.updateTimestamp();
    }
  
    // ---- UI helpers ----
    toast(message) {
      this.updateStatusText(message, 'info');
      setTimeout(() => this.updateStatusMessage(), 2000);
    }
  
    updateConnectionStatus(status, text) {
      const dot = document.getElementById('statusDot');
      const label = document.getElementById('connectionText');
      if (dot) dot.className = `status-dot ${status}`;
      if (label) label.textContent = text;
    }
  
    updateStatusText(message, type = 'info') {
      const statusText = document.getElementById('statusText');
      const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6', pending: '#8b5cf6' };
      if (statusText) statusText.textContent = message;
      const dot = document.querySelector('.pulse-dot');
      if (dot) dot.style.background = colors[type] || colors.info;
    }
  
    updateStatusMessage() {
      const { total, camerasOff } = this.state.stats;
      if (total === 0) return this.updateStatusText('No participants detected', 'info');
      if (camerasOff === 0) return this.updateStatusText('All cameras are ON', 'success');
      if (camerasOff === total) return this.updateStatusText('All cameras are OFF', 'warning');
      return this.updateStatusText(`${camerasOff} camera(s) OFF`, 'warning');
    }
  
    updateTimestamp() {
      this.state.lastUpdate = new Date();
      const t = this.state.lastUpdate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const rel = 'just now';
      document.getElementById('updateTime')!.textContent = t;
      document.getElementById('lastUpdate')!.textContent = `Updated ${rel}`;
    }
  
    updateStatsDisplay(stats) {
      if (stats) this.state.stats = { ...this.state.stats, ...stats };
      const { total, camerasOn, camerasOff } = this.state.stats;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
      set('participantCount', total);
      set('camerasOnCount', camerasOn);
      set('camerasOffCount', camerasOff);
      this.updateStatusMessage();
    }
  
    updateParticipantsList() {
      const list = document.getElementById('participantsList');
      const section = document.getElementById('participantsSection');
      if (!list || !section) return;
  
      list.innerHTML = '';
      if (!this.state.participants?.length) {
        section.style.display = 'none';
        return;
      }
      section.style.display = 'block';
  
      this.state.participants.forEach(p => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        const name = document.createElement('span');
        name.className = 'participant-name';
        name.textContent = p.name || 'Unknown';
        const status = document.createElement('span');
        status.className = `camera-status ${p.cameraOn ? 'on' : 'off'}`;
        status.innerHTML = `<span>${p.cameraOn ? '🟢' : '🔴'}</span><span>${p.cameraOn ? 'ON' : 'OFF'}</span>`;
        item.appendChild(name);
        item.appendChild(status);
        list.appendChild(item);
      });
    }
  
    toggleParticipants() {
      const list = document.getElementById('participantsList');
      const toggle = document.getElementById('expandToggle');
      if (!list || !toggle) return;
      const show = list.style.display === 'none';
      list.style.display = show ? 'block' : 'none';
      toggle.style.transform = show ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  
    setButtons() {
      const { isMonitoring } = this.state;
      const start = document.getElementById('startBtn');
      const stop  = document.getElementById('stopBtn');
      const pause = document.getElementById('pauseBtn');
      if (start) start.style.display = isMonitoring ? 'none' : 'flex';
      if (stop)  stop .style.display = isMonitoring ? 'flex' : 'none';
      if (pause) pause.style.display = isMonitoring ? 'flex' : 'none';
    }
  
    // ---- Connection / data ----
    async checkConnection() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url?.includes('zoom.us')) {
          this.state.isConnected = true;
          this.updateConnectionStatus('connected', 'Connected');
          await this.requestFreshData();
        } else {
          this.state.isConnected = false;
          this.updateConnectionStatus('disconnected', 'Not on Zoom');
          this.updateStatusText('Please navigate to a Zoom meeting', 'warning');
        }
      } catch {
        this.updateConnectionStatus('disconnected', 'Connection Failed');
      }
    }
  
    async requestFreshData() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'requestData' });
        if (res?.success && res.data) {
          const td = res.data.trackingData || [];
          const warningsSent = td.reduce((s, r) => s + (r.warningTimestamps?.length || 0), 0);
          this.state.trackingData = td;
          this.state.participants = res.data.participants || [];
          this.updateStatsDisplay({
            total: res.data.total || 0,
            camerasOff: res.data.camerasOff || 0,
            camerasOn: (res.data.total || 0) - (res.data.camerasOff || 0),
            warningsSent
          });
          this.updateWarningStats();
          this.state.warningSystem.monitorProfile = res.data.monitorProfile || null;
          this.updateMonitorProfile();
          this.updateParticipantsList();
          this.updateTimestamp();
        }
      } catch {
        // ignore; user might not be on Zoom or content not yet injected
      }
    }
  
    startAutoRefresh() {
      if (this.state.refreshInterval) clearInterval(this.state.refreshInterval);
      this.state.refreshInterval = setInterval(() => {
        if (this.state.isMonitoring && !this.state.isPaused) this.requestFreshData();
      }, 2000);
    }
  
    // ---- Actions ----
    async startMonitoring() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'startMonitoring' });
        if (res?.success) {
          this.state.isMonitoring = true;
          this.setButtons();
          this.updateStatusText('Monitoring active...', 'success');
          await this.requestFreshData();
        } else this.updateStatusText('Failed to start', 'error');
      } catch { this.updateStatusText('Error starting', 'error'); }
    }
  
    async stopMonitoring() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'stopMonitoring' });
        if (res?.success) {
          this.state.isMonitoring = false;
          this.setButtons();
          this.updateStatusText('Monitoring stopped', 'warning');
        }
      } catch { this.updateStatusText('Error stopping', 'error'); }
    }
  
    async pauseMonitoring() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'pauseMonitoring' });
        if (res?.success) {
          this.state.isPaused = true;
          this.updateStatusText('Monitoring paused', 'warning');
        }
      } catch { this.updateStatusText('Error pausing', 'error'); }
    }
  
    async resumeMonitoring() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'resumeMonitoring' });
        if (res?.success) {
          this.state.isPaused = false;
          this.updateStatusText('Monitoring resumed', 'success');
        }
      } catch { this.updateStatusText('Error resuming', 'error'); }
    }
  
    async toggleAutoWarnings() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, { action: 'toggleAutoWarnings' });
        if (res?.success) {
          this.state.warningSystem.enabled = !!res.enabled;
          this.updateStatusText(`Auto-warnings ${res.enabled ? 'enabled' : 'disabled'}`, 'info');
        }
      } catch { this.updateStatusText('Error toggling warnings', 'error'); }
    }
  
    async testChatMessage() {
      try {
        this.updateStatusText('Sending test message...', 'info');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const res = await chrome.tabs.sendMessage(tab.id, {
          action: 'testChatMessage',
          data: { message: 'Test message from ZoomWatch - Chat integration working!', recipient: 'Everyone' }
        });
        this.updateStatusText(res?.success ? 'Test message sent!' : 'Test failed', res?.success ? 'success' : 'error');
        setTimeout(() => this.updateStatusMessage(), 1500);
      } catch { this.updateStatusText('Test error', 'error'); }
    }
  
    // ---- Minor UI helpers ----
    updateWarningStats() {
      const el = document.getElementById('warningsSentCount');
      if (el) el.textContent = String(this.state.stats.warningsSent || 0);
    }
  
    updateMonitorProfile() {
      const el = document.getElementById('monitorProfile');
      const p = this.state.warningSystem.monitorProfile;
      if (el) {
        el.textContent = p ? (p.length > 18 ? p.slice(0, 18) + '…' : p) : 'Detecting...';
        el.title = p || '';
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => new ZoomWatchPopup());
  