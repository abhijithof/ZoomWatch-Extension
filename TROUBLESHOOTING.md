# 🔧 ZoomWatch Extension Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Extension Not Working at All

**Symptoms:**
- Extension icon shows in toolbar but nothing happens when clicked
- No popup appears
- No console logs from ZoomWatch

**Solutions:**
1. **Check Extension Installation:**
   - Go to `chrome://extensions/`
   - Make sure "Developer mode" is enabled
   - Verify ZoomWatch is loaded and enabled
   - Check for any error messages

2. **Refresh After Installation:**
   - After loading the extension, refresh any open Zoom tabs
   - Close and reopen Zoom tabs
   - Restart Chrome completely

3. **Check Console for Errors:**
   - Open Developer Tools (F12)
   - Check Console tab for error messages
   - Look for messages starting with `[ZoomWatch]`

### 2. Content Script Not Loading

**Symptoms:**
- Extension popup works but no monitoring happens
- No `[ZoomWatch]` logs in console
- `window.ZoomWatch` is undefined

**Solutions:**
1. **Verify Content Script Injection:**
   - Open a Zoom page
   - Open Developer Tools (F12)
   - In Console, type: `window.ZoomWatch`
   - Should return the ZoomWatch object

2. **Check Manifest Permissions:**
   - Verify `manifest.json` has correct permissions
   - Check `host_permissions` includes `https://*.zoom.us/*`
   - Ensure `content_scripts` section is correct

3. **Force Reload Content Script:**
   - Refresh the Zoom page
   - Check if `window.ZoomWatch` appears
   - If not, try disabling and re-enabling the extension

### 3. Popup Not Communicating with Content Script

**Symptoms:**
- Popup buttons don't work
- "Not on Zoom page" error
- Communication errors in console

**Solutions:**
1. **Verify You're on Zoom Page:**
   - URL must contain `zoom.us`
   - Must be in an active Zoom meeting
   - Meeting must be fully loaded

2. **Check Message Passing:**
   - Open Developer Tools on Zoom page
   - Look for `[ZoomWatch]` logs when clicking popup buttons
   - Check for error messages about communication

3. **Test Communication:**
   - Use the debug helper: `debug-extension.html`
   - Check "Message Communication" test
   - Verify background script is running

### 4. No Participants Found

**Symptoms:**
- Extension runs but shows "0 participants"
- Debug shows "NO PARTICIPANTS FOUND"
- Camera monitoring doesn't work

**Solutions:**
1. **Wait for Meeting to Load:**
   - Join the Zoom meeting first
   - Wait for participant names to appear
   - Make sure participant panel is visible

2. **Open Participant Panel:**
   - Click the "Participants" button in Zoom
   - Look for button with text like "Participants (2)"
   - Ensure participant list is visible

3. **Check Zoom Version:**
   - Different Zoom versions use different selectors
   - Extension tries multiple fallback selectors
   - May need to update selectors for new Zoom versions

### 5. Camera Detection Not Working

**Symptoms:**
- Participants found but camera status incorrect
- Always shows "cameras on" or "cameras off"
- No camera status changes detected

**Solutions:**
1. **Check Video Elements:**
   - Look for `<video>` elements in page
   - Verify participants have video streams
   - Check if Zoom is showing video thumbnails

2. **Verify Camera Permissions:**
   - Ensure Zoom has camera access
   - Check browser camera permissions
   - Verify participants are actually using cameras

3. **Use Debug Mode:**
   - Click "Debug Camera Detection" in popup
   - Check console for detailed analysis
   - Look for camera status detection logic

### 6. Reminders Not Sending

**Symptoms:**
- Camera detection works but no reminders sent
- No chat messages appear
- Chat integration errors

**Solutions:**
1. **Check Chat Access:**
   - Ensure chat panel is open in Zoom
   - Verify you have permission to send messages
   - Check if chat input field is found

2. **Verify Reminder Settings:**
   - Check if auto-reminders are enabled
   - Verify reminder message text
   - Check reminder delay settings

3. **Test Chat Integration:**
   - Look for chat input field detection
   - Check console for chat-related errors
   - Verify reminder timing logic

## 🧪 Diagnostic Steps

### Step 1: Basic Extension Check
1. Open `chrome://extensions/`
2. Verify ZoomWatch is loaded and enabled
3. Check for any error messages

### Step 2: Content Script Check
1. Open a Zoom page
2. Open Developer Tools (F12)
3. In Console, type: `window.ZoomWatch`
4. Look for `[ZoomWatch]` logs

### Step 3: Communication Test
1. Use `debug-extension.html` helper
2. Run all diagnostic tests
3. Check communication with background script

### Step 4: Functionality Test
1. Join a Zoom meeting
2. Open ZoomWatch popup
3. Click "Start Monitoring"
4. Check console for monitoring logs

### Step 5: Debug Mode
1. Click "Debug Camera Detection"
2. Review detailed console output
3. Check participant detection results

## 🔍 Debug Information

### Console Logs to Look For
- `[ZoomWatch] 🚀 ZoomWatch content script is loading...`
- `[ZoomWatch] 📍 Current URL: ...`
- `[ZoomWatch] ✅ Found participant panel...`
- `[ZoomWatch] 🚀 STARTING PARTICIPANT MONITORING...`

### Error Messages to Watch For
- `Content script not detected`
- `Communication test failed`
- `No participants found`
- `Chat input not found`

### Common Error Patterns
1. **Permission Denied:** Check extension permissions
2. **Content Script Not Injected:** Refresh page, reload extension
3. **Communication Failed:** Check background script
4. **DOM Elements Missing:** Wait for page to load completely

## 🛠️ Quick Fixes

### Fix 1: Reload Extension
```bash
1. Go to chrome://extensions/
2. Disable ZoomWatch
3. Enable ZoomWatch
4. Refresh Zoom page
```

### Fix 2: Clear Browser Data
```bash
1. Clear browsing data for zoom.us
2. Restart Chrome
3. Reload extension
```

### Fix 3: Check File Structure
```bash
1. Verify all files are present
2. Check manifest.json syntax
3. Ensure content.js is readable
```

### Fix 4: Test on Different Page
```bash
1. Try on zoom.us homepage
2. Test in different Zoom meeting
3. Check if issue is page-specific
```

## 📞 Getting Help

If none of these solutions work:

1. **Check Console Logs:** Look for specific error messages
2. **Use Debug Helper:** Run `debug-extension.html` for detailed diagnostics
3. **Test Page:** Use `test-zoomwatch.html` to isolate issues
4. **Check Zoom Version:** Extension may need updates for new Zoom versions

## 🎯 Most Common Root Causes

1. **Content Script Not Injected (80% of cases)**
   - Solution: Refresh page after extension installation

2. **Not on Zoom Page (15% of cases)**
   - Solution: Navigate to zoom.us domain

3. **Meeting Not Fully Loaded (5% of cases)**
   - Solution: Wait for Zoom meeting to fully initialize

---

**Remember:** The extension only works on `zoom.us` domains and requires the page to be fully loaded before monitoring can begin.
