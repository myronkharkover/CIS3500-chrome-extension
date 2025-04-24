// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Skill Extractor installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SKILLS') {
    // Get skills from storage
    chrome.storage.local.get(['userSkills'], (result) => {
      if (result.userSkills) {
        sendResponse({ success: true, skills: result.userSkills });
      } else {
        sendResponse({ success: false, message: 'No skills found' });
      }
    });
    return true; // Keep the message channel open for async response
  }
}); 