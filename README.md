# 📹 ZoomWatch - Camera Monitor & Auto-Reminder

A Chrome extension that automatically monitors participant camera status in Zoom meetings and sends friendly reminders when cameras are turned off.

## ✨ Features

- **Real-time Monitoring**: Automatically detects when participants turn their cameras on/off
- **Smart Reminders**: Sends automatic chat messages after 45 seconds of camera being off
- **Beautiful UI**: Clean, modern popup interface with real-time statistics
- **Configurable**: Customize reminder messages, timing, and monitoring intervals
- **Non-intrusive**: Works silently in the background without disrupting meetings

## 🚀 How It Works

1. **Browser Extension**: Runs inside the Zoom web client
2. **DOM Monitoring**: Watches participant video elements for status changes
3. **Auto Messages**: Sends reminders via Zoom's built-in chat system
4. **Smart Detection**: Uses multiple selectors to work with different Zoom versions

## 📦 Installation

### Method 1: Load Unpacked Extension (Development)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. The ZoomWatch icon should appear in your toolbar

### Method 2: Build from Source

```bash
# Clone the repository
git clone <your-repo-url>
cd zoomwatch-extension

# Install dependencies (if any)
npm install

# Build the extension
npm run build
```

## 🔧 Usage

1. **Install the extension** following the installation steps above
2. **Join a Zoom meeting** in your browser
3. **Click the ZoomWatch icon** in your toolbar
4. **Click "Start Monitoring"** to begin automatic camera monitoring
5. **Sit back and relax** - the extension will handle the rest!

## ⚙️ Configuration

The extension comes with sensible defaults, but you can customize:

- **Reminder Message**: Change the text sent to participants
- **Reminder Delay**: Adjust how long to wait before sending reminders
- **Monitoring Interval**: Change how often to check camera status
- **Auto-Reminders**: Toggle automatic reminder functionality

## 🏗️ Architecture

```
├── manifest.json          # Extension configuration
├── content.js            # Runs inside Zoom pages
├── background.js         # Service worker for background tasks
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── styles.css            # UI styling
└── README.md            # This file
```

### Key Components

- **Content Script** (`content.js`): Monitors Zoom DOM for participant changes
- **Background Script** (`background.js`): Handles extension lifecycle and notifications
- **Popup Interface** (`popup.html/js`): User controls and status display
- **Manifest** (`manifest.json`): Extension permissions and configuration

## 🔍 Technical Details

### Camera Detection
The extension uses multiple CSS selectors to find participant elements:
- `[data-testid="participant-item"]`
- `.participant-item`
- `.participant-list-item`

### Chat Integration
Automatically finds and uses Zoom's chat system:
- Locates chat input field
- Types reminder message
- Clicks send button

### Error Handling
- Graceful fallbacks for different Zoom versions
- Comprehensive logging for debugging
- Non-blocking error recovery

## 🚨 Important Notes

- **Browser Only**: Works with Zoom web client, not desktop app
- **Permissions**: Requires access to Zoom tabs and storage
- **Chat Access**: Needs to interact with Zoom's chat system
- **Participant Names**: Relies on visible participant names in Zoom

## 🐛 Troubleshooting

### Extension Not Working?
1. Make sure you're using Zoom web client (not desktop app)
2. Check that the extension is enabled in `chrome://extensions/`
3. Refresh the Zoom page after installing
4. Check browser console for error messages

### Reminders Not Sending?
1. Verify chat is open in Zoom
2. Check if participant names are visible
3. Ensure you have permission to send messages
4. Check extension popup for status

### Performance Issues?
1. Reduce monitoring interval in settings
2. Close other tabs with heavy extensions
3. Restart browser if needed

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Support for more Zoom versions
- Additional reminder customization
- Better error handling
- Performance optimizations
- UI/UX improvements

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ⚠️ Disclaimer

This extension is for educational and productivity purposes. Please:
- Respect meeting participants' privacy
- Use responsibly and ethically
- Comply with your organization's policies
- Don't spam or abuse the chat system

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Open an issue on GitHub
4. Check if Zoom has updated their interface

---

**Made with ❤️ for better Zoom meetings**
