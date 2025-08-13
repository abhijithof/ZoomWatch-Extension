// Test participant detection in Zoom meeting
// Run this in the browser console when you're in a Zoom meeting

(function() {
    console.log('🧪 Testing participant detection...');
    
    // Check if we're in a meeting
    if (!window.location.href.includes('/wc/') && !window.location.href.includes('/join')) {
        console.log('❌ Not in a Zoom meeting');
        return;
    }
    
    console.log('✅ In Zoom meeting');
    
    // Test 1: Look for video elements
    console.log('\n📹 Test 1: Looking for video elements...');
    const videos = document.querySelectorAll('video');
    console.log(`Found ${videos.length} video elements`);
    
    if (videos.length > 0) {
        videos.forEach((video, index) => {
            const container = video.closest('[class*="video"], [class*="participant"], [class*="user"]');
            const size = `${video.offsetWidth}x${video.offsetHeight}`;
            const readyState = video.readyState;
            const videoWidth = video.videoWidth;
            
            console.log(`   Video ${index + 1}:`);
            console.log(`     Size: ${size}`);
            console.log(`     Ready State: ${readyState}`);
            console.log(`     Video Width: ${videoWidth}`);
            console.log(`     Container: ${container ? container.className : 'None'}`);
        });
    }
    
    // Test 2: Look for participant names
    console.log('\n📛 Test 2: Looking for participant names...');
    const nameSelectors = [
        '[class*="name"]',
        '[class*="display-name"]',
        '[class*="participant-name"]'
    ];
    
    nameSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`   ${selector}: ${elements.length} elements`);
            elements.forEach((el, index) => {
                const text = el.textContent || '';
                const size = `${el.offsetWidth}x${el.offsetHeight}`;
                console.log(`     ${index + 1}: "${text}" (${size})`);
            });
        }
    });
    
    // Test 3: Look for camera status indicators
    console.log('\n📹 Test 3: Looking for camera status indicators...');
    const cameraSelectors = [
        '[class*="camera-on"]',
        '[class*="camera-off"]',
        '[class*="video-on"]',
        '[class*="video-off"]',
        '.zmicon-videocam',
        '.zmicon-videocam-off'
    ];
    
    cameraSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`   ${selector}: ${elements.length} elements`);
            elements.forEach((el, index) => {
                const text = el.textContent || '';
                const ariaLabel = el.getAttribute('aria-label') || '';
                console.log(`     ${index + 1}: text="${text}", aria-label="${ariaLabel}"`);
            });
        }
    });
    
    // Test 4: Look for participant list items
    console.log('\n👥 Test 4: Looking for participant list items...');
    const participantSelectors = [
        '[data-testid="participant-item"]',
        '.participant-item',
        '[class*="participant-item"]'
    ];
    
    participantSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`   ${selector}: ${elements.length} elements`);
            elements.forEach((el, index) => {
                const text = el.textContent || '';
                const size = `${el.offsetWidth}x${el.offsetHeight}`;
                console.log(`     ${index + 1}: "${text}" (${size})`);
            });
        }
    });
    
    // Test 5: Look for your name specifically
    console.log('\n🔍 Test 5: Looking for your name (ABHIJITH)...');
    const allElements = document.querySelectorAll('*');
    const nameElements = Array.from(allElements).filter(el => {
        const text = el.textContent || '';
        return text.includes('ABHIJITH') || text.includes('Abhijith');
    });
    
    if (nameElements.length > 0) {
        console.log(`Found ${nameElements.length} elements containing your name`);
        nameElements.forEach((el, index) => {
            const text = el.textContent || '';
            const size = `${el.offsetWidth}x${el.offsetHeight}`;
            const tagName = el.tagName;
            const classes = el.className || '';
            console.log(`   ${index + 1}: <${tagName}> "${text}" (${size}) classes: ${classes}`);
        });
    } else {
        console.log('❌ No elements found with your name');
    }
    
    console.log('\n🎯 Test complete! Check the results above.');
    
})();
