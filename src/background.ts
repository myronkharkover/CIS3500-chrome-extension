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

chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  const url = details.url;
  if (!url.startsWith("https://app.joinhandshake.com/stu/jobs/")) return;

  // 1) Inject contentScript.js into that tab
  chrome.scripting.executeScript({
    target: { tabId: details.tabId },
    files: ['content.bundle.js']
  }).then(() => {
    // 2) Only once it’s loaded, send your NEW_JOB message
    chrome.tabs.sendMessage(details.tabId, {
      type: "NEW_JOB",
      jobUrl: url
    });
  }).catch(err => console.error("Injection failed:", err));
}, {
  url: [{ hostEquals: "app.joinhandshake.com", pathPrefix: "/stu/jobs/" }]
});