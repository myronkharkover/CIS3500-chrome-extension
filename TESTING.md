# Testing

## 1. Interface Testing

**Approach:** Manual walkthrough (with instructions to add automated React Jest tests in future)

This section outlines step-by-step manual checks for the Chrome extension UI.

### Manual Walkthrough

1. **Popup Load & Layout**

   - **Steps:** Click the extension icon in Chrome toolbar.
   - **Expected:** A popup appears with:
     - Header "Smart Skill Extractor"
     - Upload area with dashed border
     - File input labeled "Choose File"
     - "Your Skills" section with placeholder text
   - **Current Behavior:** Matches expected design and layout.

2. **File Upload Validation**

   - **Steps:** In popup, click "Choose File" and select a non-PDF file (e.g., `.txt`).
   - **Expected:** An inline error message: "Please upload a PDF file".
   - **Current Behavior:** Displays the error in red below the upload area.

3. **PDF Processing & Skill Display**

   - **Steps:** Upload a valid PDF resume (small test PDF containing known keywords: "JavaScript" and "Python").
   - **Expected:** Spinner or "Extracting skills..." text appears briefly, then both skills list under categories with confidence bars.
   - **Current Behavior:** PDF.js text extraction runs, skills show up correctly under categories.



> **Note:** Future improvements could include automated Jest tests with `@testing-library/react` to snapshot components and simulate user events (e.g., file uploads, error states).

---

## 2. Prompt Testing

**Approach:** Automated test cases sent to ChatGPT (GPT-4) to validate prompt effectiveness in extracting and categorizing skills.

We use the model: **gpt-4**

### Test Case 1: Skill Extraction from Plain Text

- **Prompt Template:**
  ```text
  "Extract all technical skills mentioned in the following text. Return a JSON array of skill names. Text: \"Experienced in JavaScript, C++, and cloud (AWS). Worked with Docker.\""
  ```
- **Input:**
  > "Experienced in JavaScript, C++, and cloud (AWS). Worked with Docker."
- **Expected Output:**
  ```json
  ["JavaScript", "C++", "AWS", "Docker"]
  ```
- **Current Behavior:** GPT-4 returns:
  ```json
  ["JavaScript", "C++", "AWS", "Docker"]
  ```
  (Matches expectation)

### Test Case 2: Categorization Prompt

- **Prompt Template:**
  ```text
  "Categorize these skills into their domain categories: [\"React\", \"PostgreSQL\", \"Agile\", \"TensorFlow\"]. Provide a JSON object with category keys and arrays of skills."
  ```
- **Input:**
  > ["React", "PostgreSQL", "Agile", "TensorFlow"]
- **Expected Output:**
  ```json
  {
    "frameworks": ["React"],
    "databases": ["PostgreSQL"],
    "methodologies": ["Agile"],
    "data": ["TensorFlow"]
  }
  ```
- **Current Behavior:** GPT-4 returns:
  ```json
  {
    "frameworks": ["React"],
    "databases": ["PostgreSQL"],
    "methodologies": ["Agile"],
    "data": ["TensorFlow"]
  }
  ```
  (Correct categorization)

> **Next Steps:** Expand prompt tests to cover edge cases (multi-word skills, lowercase input, typos) and consider automated integration testing by hooking into the extension's prompt layer.

## 3. Resume Persistence Testing

**Approach:** Manual testing to verify resume data persistence across browser sessions.

### Test Case: Resume Upload Persistence

1. **Initial Upload**
   - **Steps:** 
     1. Upload a PDF resume through the extension popup
     2. Verify skills are extracted and displayed
     3. Close the browser completely
     4. Reopen browser and extension
   - **Expected:** 
     - Previously uploaded resume should be available
     - Extracted skills should be displayed without requiring re-upload
   - **Current Behavior:** Resume data persists in chrome.storage.local

2. **Multiple Resume Management**
   - **Steps:**
     1. Upload a new resume while another is stored
     2. Close and reopen browser
     3. Check if the most recent resume is correctly displayed
   - **Expected:** 
     - New resume should replace old one
     - Skills should update accordingly
   - **Current Behavior:** Most recent upload is maintained

## 4. Handshake Job Extraction Testing

**Approach:** Manual testing to verify accurate job extraction from Handshake.

### Test Case: Job Description Extraction

1. **Basic Job Extraction**
   - **Steps:**
     1. Navigate to a Handshake job posting
     2. Click extension icon to trigger job extraction
     3. Verify extracted content
   - **Expected:**
     - Job title is accurately captured
     - Company name is correctly identified
     - Full job description is extracted without truncation
     - Location and job type are properly parsed
   - **Current Behavior:** Job details are accurately extracted

2. **Complex Job Postings**
   - **Steps:**
     1. Test with job postings containing:
        - Multiple sections
        - Bullet points
        - Special formatting
        - Embedded links
   - **Expected:**
     - All text content is preserved
     - Formatting is handled appropriately
     - No content is lost or malformed
   - **Current Behavior:** Complex formatting is maintained

## 5. Job Persistence Testing

**Approach:** Manual testing to verify job data persistence across extension sessions.

### Test Case: Job Storage Persistence

1. **Job Storage Across Sessions**
   - **Steps:**
     1. Extract job details from multiple Handshake postings
     2. Close browser completely
     3. Reopen browser and extension
   - **Expected:**
     - Previously extracted jobs should be available
     - Job details should be complete and accurate
     - No data corruption or loss
   - **Current Behavior:** Jobs persist in chrome.storage.local

2. **Job List Management**
   - **Steps:**
     1. Extract multiple jobs
     2. Close and reopen browser
     3. Verify job list order and completeness
   - **Expected:**
     - All jobs are maintained in correct order
     - Job details are complete
     - No duplicate entries
   - **Current Behavior:** Job list is properly maintained

> **Note:** These persistence tests should be run across different scenarios including:
> - Browser crashes
> - Extension updates
> - System restarts
> - Different Chrome profiles
