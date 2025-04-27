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

4. **Handshake/LinkedIn Overlay**
   - **Steps:** Navigate to a LinkedIn job posting and send the `GET_SKILLS` message (popup or background triggers overlay).
   - **Expected:** A fixed-position overlay listing the user's skills with confidence bars.
   - **Current Behavior:** Overlay appears in top-right as expected.

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
