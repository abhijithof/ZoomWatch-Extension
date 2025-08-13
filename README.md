# 📹 ZoomWatch - Premium Camera Monitor Extension

<div align="center">

![ZoomWatch Logo](https://img.shields.io/badge/📹-ZoomWatch-blue?style=for-the-badge)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?style=for-the-badge&logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=for-the-badge)
![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

**A beautiful, modern Chrome extension that monitors participant camera status in Zoom meetings with real-time updates and professional UI design.**

</div>

## ✨ Features

🎨 **Modern UI Design**
- Beautiful gradient interface with smooth animations
- Real-time connection status indicators
- Professional glassmorphism effects
- Responsive design with Inter font

📊 **Smart Monitoring**
- Real-time participant detection using iframe parsing
- Accurate camera status monitoring (ON/OFF)
- Individual participant list with live updates
- 2-second refresh intervals for instant feedback

🚀 **Advanced Functionality**
- Automatic extension injection across all frames
- Cross-iframe communication system
- Loading states with emoji indicators
- Manual refresh with rotation animations

💪 **Production Ready**
- Clean, professional codebase
- Comprehensive error handling
- Memory efficient with localStorage persistence
- Chrome Web Store ready

## 🎯 How It Works

1. **Iframe Detection**: Automatically finds Zoom meeting content within iframes
2. **Participant Parsing**: Extracts participant names and camera status from `.participants-li` elements
3. **Aria-Label Priority**: Uses `aria-label` attributes for accurate camera detection
4. **Real-time Updates**: Continuously monitors and updates statistics every 2 seconds
5. **Modern Interface**: Displays data through a beautiful, animated popup interface

## 🚀 Quick Start

### Install the Extension

```bash
# Clone the repository
git clone https://github.com/abhijithof/ZoomWatch-Extension.git
cd ZoomWatch-Extension
```

1. **Open Chrome Extensions**: Navigate to `chrome://extensions/`
2. **Enable Developer Mode**: Toggle the switch in the top-right corner
3. **Load Extension**: Click "Load unpacked" and select the `ZoomWatch-Extension` folder
4. **Ready!**: The ZoomWatch icon will appear in your Chrome toolbar

### Using ZoomWatch

1. **Join a Zoom Meeting**: Use the web client at `zoom.us`
2. **Open Participants Panel**: Make sure the participants list is visible
3. **Launch ZoomWatch**: Click the extension icon in your toolbar
4. **Start Monitoring**: Click the "▶️ Start Monitoring" button
5. **Enjoy**: Watch real-time camera statistics with beautiful animations!

## 🎨 Interface Preview

**Modern Popup Features:**
- 🌈 **Animated gradient header** with shifting colors
- 📊 **Interactive stat cards** with hover effects and number animations
- 🔄 **Real-time status indicator** with pulsing dot
- 👥 **Individual participant list** with camera status icons
- ⚡ **Quick action buttons** with smooth transitions
- 📱 **Responsive design** that works on all screen sizes

## 🏗️ Technical Architecture

```
ZoomWatch-Extension/
├── 📄 manifest.json       # Manifest V3 configuration
├── 🔧 content.js          # Main monitoring logic with iframe support
├── ⚙️  background.js       # Service worker for extension lifecycle
├── 🎨 popup.html          # Modern UI layout with components
├── ✨ popup.js            # Advanced popup functionality
├── 🎭 styles.css          # Beautiful styling with animations
├── 🛡️  .gitignore          # Clean development environment
└── 📖 README.md           # This documentation
```

### Core Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Iframe Support**: Works with Zoom's PWA architecture
- **CSS Grid/Flexbox**: Modern responsive layouts
- **CSS Animations**: Smooth transitions and micro-interactions
- **ES6+ JavaScript**: Modern async/await patterns
- **LocalStorage**: Persistent data management

## 🔧 Advanced Configuration

### Camera Detection Logic

The extension uses a priority-based detection system:

1. **Aria-Label Check**: Primary source for camera status
2. **Icon Class Detection**: Fallback using CSS class patterns
3. **Multiple Selectors**: Robust element finding with `.participants-li`

### Supported URL Patterns

- `https://*.zoom.us/wc/*/join/*` 
- `https://*.zoom.us/wc/*/start/*`
- All iframe content within Zoom meetings

### Performance Optimizations

- **Selective Monitoring**: Only runs when explicitly started
- **Efficient Selectors**: Optimized DOM queries
- **Memory Management**: Proper cleanup and garbage collection
- **Debounced Updates**: Prevents excessive API calls

## 🐛 Troubleshooting

### Common Issues

**Extension Not Loading**
```bash
# Solution: Reload the extension
1. Go to chrome://extensions/
2. Find "ZoomWatch" and click reload
3. Refresh your Zoom tab
```

**No Participants Detected**
```bash
# Solution: Check requirements
1. Ensure you're in an actual Zoom meeting (not homepage)
2. Open the participants panel in Zoom
3. Verify the URL contains '/wc/' and '/join' or '/start'
```

**UI Not Updating**
```bash
# Solution: Check connection
1. Look for the green connection dot in popup
2. Try manual refresh button (🔄)
3. Restart monitoring if needed
```

### Debug Mode

Open browser console and look for messages prefixed with `[ZoomWatch]` for detailed debugging information.

## 🚀 Development

### Building from Source

```bash
# No build process required - it's a pure Chrome extension!
# Just load the folder directly in Chrome
```

### Contributing

We welcome contributions! Areas for enhancement:

- 🎨 **UI/UX**: Additional themes, animations, or layouts
- 🔧 **Features**: New monitoring capabilities or integrations
- 🐛 **Bug Fixes**: Improved error handling or edge cases
- 📱 **Compatibility**: Support for different Zoom versions
- ⚡ **Performance**: Optimization and efficiency improvements

### Code Style

- ES6+ JavaScript with async/await
- Semantic HTML5 with accessibility
- Modern CSS with custom properties
- Professional error handling
- Comprehensive logging

## 📄 License

This project is open source and available under the **MIT License**.

## 🌟 Acknowledgments

- **Chrome Extensions API**: For powerful extension capabilities
- **Inter Font**: For beautiful, modern typography
- **CSS Animations**: For smooth, professional interactions
- **Zoom Web Client**: For the meeting platform integration

## 📞 Support

**Need Help?**
1. 📖 Check our comprehensive [INSTALL.md](INSTALL.md) guide
2. 🔍 Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
3. 🐛 Open an issue on GitHub for bugs or feature requests
4. 💬 Check browser console for `[ZoomWatch]` debug messages

---

<div align="center">

**✨ Transforming Zoom meetings with beautiful, modern technology ✨**

![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)
![Chrome Extension](https://img.shields.io/badge/For-Chrome%20Users-blue?style=for-the-badge&logo=google-chrome)

**From "bro this ain't working" to premium Chrome extension! 🚀**

</div>
