import OpenAI from "openai";

export interface JobInfo {
  employerName: string;
  title: string;
  location: string;
  minimumQualifications: string[];
  industry: string;
  [key: string]: any;
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_JOB") {
    addSummarizeButton();
  }

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

/** Read the OpenAI key stored under "apiKey" in chrome.storage.local */
async function getApiKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["apiKey"], (result) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      const key = result.apiKey;
      if (typeof key !== "string" || !key) {
        return reject(new Error("apiKey not found in storage"));
      }
      resolve(key);
    });
  });
}

/** Construct a new OpenAI client with the stored key */
async function makeClient(): Promise<OpenAI> {
  const apiKey = await getApiKey();
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

/**
 * Send the HTML blob to OpenAI and parse out a structured JobInfo object.
 */
export async function parseJobFromHtml(htmlBlob: string): Promise<JobInfo> {
  const client = await makeClient();
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    messages: [
      {
        role: "system",
        content: [
          "You’re a JSON-extraction assistant.",
          "Extract job info into JSON with these fields:",
          "- employerName, title, location",
          "- minimumQualifications: array of skill names ONLY (no extra descriptors).",
          "- industry: choose the one best industry label (e.g. Hardware, Software)."
        ].join(" ")
      },
      { role: "user", content: htmlBlob }
    ]
  });

  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw !== "string") {
    throw new Error("Unexpected response format; no content found");
  }

  const jsonString = raw
    .replace(/^\s*```?json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(jsonString) as JobInfo;
  } catch (err) {
    console.error("Failed to parse JSON:", jsonString);
    throw err;
  }
}

/** Click the "More" button to expand the job description */
function clickMoreButton(): void {
  const btn = document.querySelector<HTMLButtonElement>(".view-more-button");
  if (btn) {
    btn.click();
  }
}

/** Inject a "Summarize" button next to the "Apply" button */
function addSummarizeButton(): void {
  const applyBtn = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Apply"]'
  );
  if (!applyBtn) return;

  const container = applyBtn.parentElement;
  if (!container ||
      container.querySelector<HTMLButtonElement>('button[aria-label="Summarize"]')
  ) {
    return;
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Summarize");
  btn.className = applyBtn.className;
  btn.textContent = "Extract";
  btn.style.marginLeft = "8px";

  btn.addEventListener("click", async () => {
    clickMoreButton();
    const card = document.querySelector<HTMLDivElement>(
      'div.style__full-height___E_Ofr.style__card___1rhof[data-hook="card"]'
    );
    if (!card) return;
    try {
      const job = await parseJobFromHtml(card.innerHTML);

      chrome.storage.local.get(['savedJobs'], (result) => {
        // 1. Read back an array (or start with an empty one)
        const savedJobs: JobInfo[] = Array.isArray(result.savedJobs)
          ? result.savedJobs
          : [];
      
        // 2. Push your parsed job object directly (not a string)
        savedJobs.push(job);
      
        // 3. Store the array of JS objects
        chrome.storage.local.set({ savedJobs }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving job:', chrome.runtime.lastError);
          }
        });
      });
    } catch (e) {
      console.error("Error parsing job:", e);
    }
  });

  container.appendChild(btn);
}