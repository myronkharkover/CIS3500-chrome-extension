// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SKILLS') {
    // Get skills from storage
    chrome.storage.local.get(['userSkills'], (result) => {
      if (result.userSkills) {
        // Create a skills overlay on Handshake job pages
        createSkillsOverlay(result.userSkills);
      }
    });
  }
});

function createSkillsOverlay(skills: { name: string; confidence: number }[]) {
  // Check if we're on a Handshake job page
  if (window.location.href.includes('joinhandshake.com/jobs')) {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'skills-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
    `;

    // Create header
    const header = document.createElement('h3');
    header.textContent = 'Your Matching Skills';
    header.style.cssText = `
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 1.1em;
    `;
    overlay.appendChild(header);

    // Create skills list
    const skillsList = document.createElement('ul');
    skillsList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0;
    `;

    skills.forEach(skill => {
      const skillItem = document.createElement('li');
      skillItem.style.cssText = `
        margin: 5px 0;
        padding: 5px;
        background: #f8f9fa;
        border-radius: 4px;
      `;

      const skillName = document.createElement('span');
      skillName.textContent = skill.name;
      skillName.style.cssText = `
        font-weight: bold;
        margin-right: 10px;
      `;

      const confidenceBar = document.createElement('div');
      confidenceBar.style.cssText = `
        height: 6px;
        background: #ecf0f1;
        border-radius: 3px;
        margin-top: 5px;
        overflow: hidden;
      `;

      const confidenceFill = document.createElement('div');
      confidenceFill.style.cssText = `
        height: 100%;
        background: #3498db;
        width: ${skill.confidence * 100}%;
      `;

      confidenceBar.appendChild(confidenceFill);
      skillItem.appendChild(skillName);
      skillItem.appendChild(confidenceBar);
      skillsList.appendChild(skillItem);
    });

    overlay.appendChild(skillsList);
    document.body.appendChild(overlay);
  }
} 