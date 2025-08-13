# 🚀 ZoomWatch Installation & Setup Guide

<div align="center">

![Installation Guide](https://img.shields.io/badge/📦-Installation%20Guide-blue?style=for-the-badge)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?style=for-the-badge&logo=google-chrome)
![Easy Setup](https://img.shields.io/badge/Setup-Easy-success?style=for-the-badge)

**Complete guide to install and configure your ZoomWatch extension**

</div>

## 📦 Quick Installation

### Method 1: Clone from GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/abhijithof/ZoomWatch-Extension.git

# Navigate to the folder
cd ZoomWatch-Extension
```

### Method 2: Download ZIP

1. Visit [GitHub Repository](https://github.com/abhijithof/ZoomWatch-Extension)
2. Click **"Code"** → **"Download ZIP"**
3. Extract to a folder on your computer

## 🔧 Chrome Extension Setup

### Step 1: Enable Developer Mode

1. **Open Chrome Extensions**: Navigate to `chrome://extensions/`
2. **Enable Developer Mode**: Toggle the switch in the **top-right corner**
3. **Verify**: You should see additional buttons appear

### Step 2: Load the Extension

1. **Click "Load unpacked"**: Button should be visible after enabling developer mode
2. **Select Folder**: Choose the `ZoomWatch-Extension` folder
3. **Confirm**: The extension will appear in your extensions list

### Step 3: Verify Installation

✅ **Check for ZoomWatch icon** in your Chrome toolbar  
✅ **Extension appears** in `chrome://extensions/` list  
✅ **No error messages** in the extension card  

## 🎯 Testing Your Installation

### Basic Functionality Test

1. **Join a Zoom Meeting**: Use the web client at `zoom.us`
2. **Open Participants Panel**: Make sure it's visible in Zoom
3. **Click ZoomWatch Icon**: Should open the modern popup
4. **Check Connection Status**: Look for green "Connected" indicator
5. **Start Monitoring**: Click the "▶️ Start Monitoring" button

### Expected Results

🟢 **Connection Status**: "Connected" with green dot  
🟢 **Participant Count**: Shows actual number of participants  
🟢 **Camera Status**: Displays correct ON/OFF counts  
🟢 **Real-time Updates**: Numbers change when participants join/leave  

## 🛠️ Troubleshooting

### ❌ Extension Not Loading

**Problem**: ZoomWatch doesn't appear in toolbar

**Solutions**:
```bash
1. Go to chrome://extensions/
2. Find "ZoomWatch" in the list
3. Click the reload button (🔄)
4. Check for any error messages
5. Ensure all files are present in folder
```

### ❌ "Not on Zoom" Message

**Problem**: Extension shows "Not on Zoom" even when in meeting

**Solutions**:
```bash
1. Verify you're using zoom.us (not desktop app)
2. Check URL contains '/wc/' and '/join' or '/start'
3. Refresh the Zoom page
4. Make sure you're in an actual meeting, not homepage
```

### ❌ No Participants Detected

**Problem**: Shows "0 participants" even with people in meeting

**Solutions**:
```bash
1. Open the participants panel in Zoom (sidebar)
2. Wait 5-10 seconds for dynamic loading
3. Check console for [ZoomWatch] messages
4. Try stopping and restarting monitoring
```

### ❌ Permission Errors

**Problem**: Extension can't access Zoom pages

**Solutions**:
```bash
1. Check manifest.json is present
2. Reload extension in chrome://extensions/
3. Grant permissions when prompted
4. Refresh Zoom tabs after installation
```

## 🔍 Advanced Debugging

### Console Debugging

1. **Open Developer Tools**: Press `F12` on Zoom page
2. **Go to Console Tab**: Look for messages
3. **Filter by ZoomWatch**: Search for `[ZoomWatch]`
4. **Check for Errors**: Red messages indicate issues

### Extension Debugging

1. **Go to Extensions Page**: `chrome://extensions/`
2. **Find ZoomWatch**: In the extensions list
3. **Click "Inspect views"**: Select "popup.html"
4. **Check Console**: For popup-specific errors

### Network Issues

```bash
# If extension won't load from GitHub:
1. Check internet connection
2. Try downloading ZIP instead
3. Verify folder structure is correct
4. Ensure no antivirus blocking
```

## 📁 File Structure Verification

Make sure your folder contains these files:

```
ZoomWatch-Extension/
├── ✅ manifest.json       # Extension configuration
├── ✅ content.js          # Main monitoring logic
├── ✅ background.js       # Service worker
├── ✅ popup.html          # Modern UI layout
├── ✅ popup.js            # Popup functionality
├── ✅ styles.css          # Beautiful styling
├── ✅ .gitignore          # Development files
├── ✅ README.md           # Documentation
├── ✅ INSTALL.md          # This file
└── ✅ TROUBLESHOOTING.md  # Detailed help
```

## 🎨 UI Features Guide

### Modern Popup Interface

**Header Section**:
- 🌈 Animated gradient background
- 📱 Connection status indicator
- 🎭 ZoomWatch branding

**Stats Cards**:
- 👥 Total participants count
- 📹 Cameras ON count  
- 📷 Cameras OFF count
- ✨ Hover animations

**Control Buttons**:
- ▶️ Start/Stop monitoring
- 🔄 Manual refresh
- 🔍 Debug console
- ⚙️ Settings (coming soon)

### Real-time Features

- **Live Updates**: Every 2 seconds
- **Smooth Animations**: Number changes animate
- **Status Indicators**: Color-coded feedback
- **Loading States**: Visual feedback during actions

## 🚀 Performance Tips

### Optimal Usage

1. **Start monitoring only when needed** to save resources
2. **Keep participants panel open** for best detection
3. **Use latest Chrome version** for best compatibility
4. **Close unused tabs** if experiencing slowness

### Browser Requirements

- **Chrome 88+**: For Manifest V3 support
- **JavaScript Enabled**: Required for functionality
- **Local Storage**: For settings persistence
- **Zoom Web Client**: Desktop app not supported

## ✅ Installation Checklist

Before reporting issues, verify:

- [ ] **Developer mode enabled** in Chrome
- [ ] **Extension loaded** successfully  
- [ ] **No error messages** in extensions page
- [ ] **ZoomWatch icon** visible in toolbar
- [ ] **Using Zoom web client** (not desktop app)
- [ ] **In actual meeting** (not homepage)
- [ ] **Participants panel open** in Zoom
- [ ] **Console shows** `[ZoomWatch]` messages

## 📞 Getting Help

### Self-Help Resources

1. 📖 **README.md**: Comprehensive feature guide
2. 🛠️ **TROUBLESHOOTING.md**: Detailed problem solutions  
3. 🔍 **Browser Console**: Real-time debugging info
4. 💬 **Extension Popup**: Status and error messages

### Community Support

1. 🐛 **GitHub Issues**: Report bugs or request features
2. 💡 **Discussions**: Share tips and tricks
3. 📧 **Contact**: For technical support

---

<div align="center">

**🎯 Ready to monitor your Zoom meetings like a pro!**

![Chrome Extension](https://img.shields.io/badge/Built%20for-Chrome%20Users-blue?style=for-the-badge&logo=google-chrome)
![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

**From installation to monitoring in under 2 minutes! ⚡**

</div>
