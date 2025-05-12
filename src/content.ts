import OpenAI from "openai";

export interface JobInfo {
  employerName: string;
  title: string;
  location: string;
  minimumQualifications: string[];
  industry: string;
  score?: number;
  [key: string]: any;
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_JOB") {
    console.log("New job message received");
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

    // Add saved jobs section
    chrome.storage.local.get(['savedJobs'], (result) => {
      const savedJobs: JobInfo[] = Array.isArray(result.savedJobs) ? result.savedJobs : [];
      if (savedJobs.length > 0) {
        const jobsHeader = document.createElement('h3');
        jobsHeader.textContent = 'Saved Jobs';
        jobsHeader.style.cssText = `
          margin: 20px 0 10px 0;
          color: #2c3e50;
          font-size: 1.1em;
        `;
        overlay.appendChild(jobsHeader);

        const jobsList = document.createElement('ul');
        jobsList.style.cssText = `
          list-style: none;
          padding: 0;
          margin: 0;
        `;

        savedJobs.forEach(job => {
          const jobItem = document.createElement('li');
          jobItem.style.cssText = `
            margin: 5px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
          `;

          const jobTitle = document.createElement('div');
          jobTitle.textContent = `${job.title} at ${job.employerName}`;
          jobTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
          `;

          const qualificationsHeader = document.createElement('div');
          qualificationsHeader.textContent = 'Required Qualifications:';
          qualificationsHeader.style.cssText = `
            font-weight: bold;
            margin: 5px 0;
            color: #2c3e50;
          `;

          const qualificationsList = document.createElement('ul');
          qualificationsList.style.cssText = `
            list-style: disc;
            padding-left: 15px;
            margin: 5px 0;
          `;

          job.minimumQualifications.forEach(qual => {
            const qualItem = document.createElement('li');
            qualItem.textContent = qual;
            qualificationsList.appendChild(qualItem);
          });

          const scoreContainer = document.createElement('div');
          scoreContainer.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ecf0f1;
          `;

          const scoreText = document.createElement('p');
          scoreText.textContent = `Job Match: ${job.score?.toFixed(1) || 'N/A'}/10`;
          scoreText.style.cssText = `
            font-weight: bold;
            color: ${job.score && job.score >= 7 ? '#2ecc71' : job.score && job.score >= 5 ? '#f39c12' : '#e74c3c'};
            margin: 0;
          `;

          scoreContainer.appendChild(scoreText);

          jobItem.appendChild(jobTitle);
          jobItem.appendChild(qualificationsHeader);
          jobItem.appendChild(qualificationsList);
          jobItem.appendChild(scoreContainer);
          jobsList.appendChild(jobItem);
        });

        overlay.appendChild(jobsList);
      }
    });

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
  
  // Truncate the content to fit within token limits
  // Assuming ~4 characters per token, we'll keep it under 15000 tokens (60000 characters)
  const truncatedContent = htmlBlob.slice(0, 60000);
  
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: [
          "You're a JSON-extraction assistant. Assume that unless indicated that skills are only preferred or would be nice to have that they are required.",
          "Extract job info into JSON with these fields:",
          "- employerName, title, location",
          "- minimumQualifications: array of skill names ONLY (no extra descriptors).",
          "- industry: choose the one best industry label (e.g. Hardware, Software)."
        ].join(" ")
      },
      { role: "user", content: truncatedContent }
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
  console.log("Adding Summarize button");
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
      console.log("Parsed job:", job);
      
      await calculateJobScore(job);

      chrome.storage.local.get(['savedJobs'], (result) => {
        const savedJobs: JobInfo[] = Array.isArray(result.savedJobs)
          ? result.savedJobs
          : [];
        savedJobs.push(job);
        
        chrome.storage.local.set({ savedJobs }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving job:', chrome.runtime.lastError);
            showMessage('Error saving job', 'error');
          } else {
            console.log('Job saved:', job);
            showMessage('Job saved successfully!', 'success');
          }
        });
      });
    } catch (e) {
      console.error("Error parsing job:", e);
      showMessage('Failed to process job information', 'error');
    }
  });
  console.log("Adding button to container", container);
  container.appendChild(btn);
}

async function processJobContent(content: string) {
  try {
    const job = await parseJobFromHtml(content);
    console.log("Parsed job:", job);

    chrome.storage.sync.get(['savedJobs'], (result) => {
      const savedJobs: JobInfo[] = Array.isArray(result.savedJobs)
        ? result.savedJobs
        : [];
      savedJobs.push(job);
      
      chrome.storage.sync.set({ savedJobs }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving job:', chrome.runtime.lastError);
          showMessage('Error saving job', 'error');
        } else {
          console.log('Job saved:', job);
          showMessage('Job extracted successfully!', 'success');
        }
      });
    });
  } catch (e: unknown) {
    console.error("Error processing job:", e);
    showMessage('Failed to process job information', 'error');
  }
}

function showMessage(message: string, type: 'success' | 'error') {
  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 1000;
  `;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}

async function calculateJobScore(job: JobInfo): Promise<void> {
  const client = await makeClient();
  
  chrome.storage.local.get(['userSkills'], async (result) => {
    const userSkills = result.userSkills || [];
    
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a job matching expert. Analyze the user's skills and the job's required qualifications. Return ONLY a number from 0-10 with one decimal place representing how well the user's skills match the job requirements. Consider both the presence of required skills and the user's confidence in those skills."
        },
        {
          role: "user",
          content: `Job Requirements: ${JSON.stringify(job.minimumQualifications)}\nUser Skills: ${JSON.stringify(userSkills)}`
        }
      ]
    });

    const score = parseFloat(response.choices[0].message.content || '0');
    job.score = Math.min(10, Math.max(0, score));
    
    // Update the score display immediately
    const scoreText = document.querySelector('.skills-overlay p') as HTMLElement;
    if (scoreText) {
      scoreText.textContent = `Job Match: ${job.score.toFixed(1)}/10`;
      scoreText.style.color = job.score >= 7 ? '#2ecc71' : job.score >= 5 ? '#f39c12' : '#e74c3c';
    }
    
    chrome.storage.local.get(['savedJobs'], (result) => {
      const savedJobs: JobInfo[] = Array.isArray(result.savedJobs) ? result.savedJobs : [];
      const index = savedJobs.findIndex(j => j.title === job.title && j.employerName === job.employerName);
      if (index !== -1) {
        savedJobs[index] = job;
        chrome.storage.local.set({ savedJobs });
      }
    });
  });
}

async function getResumeText(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['storedPDFName'], (result) => {
      resolve(result.storedPDFName || '');
    });
  });
}