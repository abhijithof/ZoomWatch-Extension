// Deep search to find where ABHIJITH actually is on the page
// Run this in the browser console

console.log('🔍 DEEP SEARCH FOR ABHIJITH');

// Test 1: Search in ALL text content (case insensitive)
const allElements = document.querySelectorAll('*');
const abhijithElements = [];
const participants1Elements = [];

allElements.forEach(el => {
    const text = el.textContent || '';
    const lowerText = text.toLowerCase();
    
    // Look for your name in any form
    if (lowerText.includes('abhijith') || lowerText.includes('ᴀʙʜɪᴊɪᴛʜ')) {
        abhijithElements.push({
            element: el,
            text: text.substring(0, 100),
            visible: el.offsetWidth > 0 && el.offsetHeight > 0
        });
    }
    
    // Look for "Participants (1)"
    if (lowerText.includes('participants') && lowerText.includes('1')) {
        participants1Elements.push({
            element: el,
            text: text.substring(0, 100),
            visible: el.offsetWidth > 0 && el.offsetHeight > 0
        });
    }
});

console.log(`Found ${abhijithElements.length} elements containing ABHIJITH:`);
abhijithElements.forEach((item, i) => {
    console.log(`  ${i+1}: ${item.element.tagName}.${item.element.className}`);
    console.log(`     Text: "${item.text}"`);
    console.log(`     Visible: ${item.visible}`);
    console.log(`     Size: ${item.element.offsetWidth}x${item.element.offsetHeight}`);
});

console.log(`\nFound ${participants1Elements.length} elements with "Participants (1)":`);
participants1Elements.forEach((item, i) => {
    console.log(`  ${i+1}: ${item.element.tagName}.${item.element.className}`);
    console.log(`     Text: "${item.text}"`);
    console.log(`     Visible: ${item.visible}`);
});

// Test 2: Check if content is in iframes
const iframes = document.querySelectorAll('iframe');
console.log(`\nFound ${iframes.length} iframes on page:`);
iframes.forEach((iframe, i) => {
    console.log(`  ${i+1}: ${iframe.src || 'no src'}`);
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const iframeText = iframeDoc.body?.textContent || '';
            if (iframeText.toLowerCase().includes('abhijith')) {
                console.log(`    🎯 FOUND ABHIJITH in iframe ${i+1}!`);
            }
        }
    } catch (e) {
        console.log(`    Cannot access iframe ${i+1} content (cross-origin)`);
    }
});

// Test 3: Check if elements are loaded dynamically
console.log('\n🔍 Waiting 3 seconds then checking again...');
setTimeout(() => {
    const newAbhijithElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.toLowerCase().includes('abhijith') || text.toLowerCase().includes('ᴀʙʜɪᴊɪᴛʜ');
    });
    
    console.log(`After 3 seconds: Found ${newAbhijithElements.length} elements with ABHIJITH`);
    newAbhijithElements.forEach((el, i) => {
        console.log(`  ${i+1}: ${el.tagName}.${el.className} - "${el.textContent?.substring(0, 50)}"`);
    });
}, 3000);

console.log('\n🎯 Deep search complete!');
