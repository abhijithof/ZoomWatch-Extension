// Quick test to see what participants elements exist on the page
// Run this in the browser console

console.log('🔍 Testing selectors on the page...');

// Test 1: Look for any element with "participant" in the class
const participantElements = document.querySelectorAll('[class*="participant"]');
console.log(`Found ${participantElements.length} elements with "participant" in class:`);
participantElements.forEach((el, i) => {
    console.log(`  ${i+1}: ${el.tagName}.${el.className}`);
});

// Test 2: Look for any element with "Participants" text
const participantTextElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && el.textContent.includes('Participants')
);
console.log(`Found ${participantTextElements.length} elements with "Participants" text:`);
participantTextElements.forEach((el, i) => {
    console.log(`  ${i+1}: ${el.tagName}.${el.className} - "${el.textContent.substring(0, 50)}"`);
});

// Test 3: Look for your name specifically
const nameElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && (el.textContent.includes('ABHIJITH') || el.textContent.includes('ᴀʙʜɪᴊɪᴛʜ'))
);
console.log(`Found ${nameElements.length} elements with your name:`);
nameElements.forEach((el, i) => {
    console.log(`  ${i+1}: ${el.tagName}.${el.className} - "${el.textContent}"`);
});

// Test 4: Look for video icons
const videoIcons = document.querySelectorAll('[class*="video"], [class*="camera"]');
console.log(`Found ${videoIcons.length} video/camera elements:`);
videoIcons.forEach((el, i) => {
    console.log(`  ${i+1}: ${el.tagName}.${el.className}`);
});

console.log('🎯 Test complete!');
