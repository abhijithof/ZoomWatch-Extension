// Copy and paste this into the browser console to see what's on the page

console.log('🔍 Simple Participant Test');

// Test 1: Find all elements with "participant" in class
const participantElements = document.querySelectorAll('*[class*="participant" i]');
console.log(`Found ${participantElements.length} participant elements:`);
participantElements.forEach((el, i) => {
    console.log(`  ${i+1}: ${el.tagName}.${el.className}`);
    console.log(`     Text: "${el.textContent?.substring(0, 100)}"`);
    console.log(`     Size: ${el.offsetWidth}x${el.offsetHeight}`);
});

// Test 2: Find your name specifically
const abhijithElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && el.textContent.includes('ABHIJITH')
);
console.log(`\nFound ${abhijithElements.length} elements with ABHIJITH:`);
abhijithElements.forEach((el, i) => {
    console.log(`  ${i+1}: ${el.tagName}.${el.className}`);
    console.log(`     Text: "${el.textContent}"`);
    console.log(`     Parent: ${el.parentElement?.tagName}.${el.parentElement?.className}`);
});

// Test 3: Try to manually parse participants
if (abhijithElements.length > 0) {
    const nameElement = abhijithElements[0];
    console.log(`\n🔍 Testing camera status for: ${nameElement.textContent}`);
    
    // Look for camera icons in parent
    const parent = nameElement.closest('[class*="participant"], [class*="item"], [id*="participant"]') || nameElement.parentElement;
    console.log(`  Parent element: ${parent?.tagName}.${parent?.className}`);
    
    // Look for video icons
    const videoIcons = parent?.querySelectorAll('[class*="video"], [class*="camera"], svg');
    console.log(`  Found ${videoIcons?.length || 0} potential camera icons:`);
    videoIcons?.forEach((icon, i) => {
        console.log(`    ${i+1}: ${icon.tagName}.${icon.className}`);
    });
    
    // Check aria-label
    const ariaLabel = parent?.getAttribute('aria-label') || nameElement.getAttribute('aria-label');
    console.log(`  Aria-label: "${ariaLabel}"`);
}

console.log('\n🎯 Test complete!');
