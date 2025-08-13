# 🚀 ZoomWatch Extension Installation Guide

## Quick Fix Steps

If your extension isn't working, follow these steps in order:

### 1. 🔄 Reload the Extension
1. Go to `chrome://extensions/`
2. Make sure "Developer mode" is enabled (toggle in top right)
3. Find "ZoomWatch Camera Monitor" in the list
4. Click the "Reload" button (🔄 icon)
5. Wait for it to reload

### 2. 🌐 Refresh Zoom Pages
1. After reloading the extension, refresh any open Zoom tabs
2. Or close and reopen Zoom tabs
3. Make sure you're on a `zoom.us` domain

### 3. 🧪 Test the Extension
1. Open `test-zoomwatch.html` in your browser
2. Click "Run All Tests" to check if everything is working
3. Look for any error messages

### 4. 🔍 Check Console for Errors
1. Open Developer Tools (F12) on a Zoom page
2. Look in the Console tab for messages starting with `[ZoomWatch]`
3. Check for any red error messages

## Common Issues & Solutions

### ❌ Extension Not Loading
- **Solution**: Reload the extension in `chrome://extensions/`
- **Check**: Make sure "Developer mode" is enabled

### ❌ Content Script Not Working
- **Solution**: Refresh the Zoom page after installing the extension
- **Check**: Look for `window.ZoomWatch` in console

### ❌ Not on Zoom Page
- **Solution**: Navigate to `https://zoom.us` or join a meeting
- **Check**: URL must contain `zoom.us`

### ❌ Communication Errors
- **Solution**: Check if background script is running
- **Check**: Look for extension errors in `chrome://extensions/`

## Testing Your Extension

1. **Open the test page**: `test-zoomwatch.html`
2. **Run diagnostics**: Click "Run All Tests"
3. **Check results**: Look for green checkmarks
4. **Follow recommendations**: If tests fail, follow the troubleshooting steps

## Still Not Working?

If none of the above works:

1. **Check the troubleshooting guide**: `TROUBLESHOOTING.md`
2. **Use the debug helper**: `debug-extension.html`
3. **Run the fix script**: Copy and paste the contents of `fix-extension.js` into the browser console on a Zoom page

## File Structure

Make sure all these files are present:
- `manifest.json` - Extension configuration
- `content.js` - Main extension logic
- `popup.js` - Extension popup interface
- `background.js` - Background service worker
- `popup.html` - Extension popup HTML
- `styles.css` - Extension styling

## Need Help?

1. Check the console for error messages
2. Use the test page to diagnose issues
3. Follow the troubleshooting guide
4. Make sure you're on a Zoom page when testing

---

**Remember**: The extension only works on `zoom.us` domains and requires the page to be fully loaded!
