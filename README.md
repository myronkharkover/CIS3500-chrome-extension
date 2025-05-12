# Smart Skill Extractor

Smart Skill Extractor is a Google Chrome extension that helps job applicants highlight and extract key skills from both job postings and personal resumes. Users can upload a PDF resume, view their top skills categorized by domain, and see matching skills overlaid on career sites like Handshake. The extension uses ChatGPT API calls to analyze job postings and generate a match score based on the alignment between the user's skills and job requirements.

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/myronkharkover/CIS3500-chrome-extension.git
   cd CIS3500-chrome-extension
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Install OpenAI package**
   ```bash
   npm i openai
   ```
4. **Build the extension**
   ```bash
   npm run build
   ```
5. **Build content scripts**
   ```bash
   npm run build:content
   ```
6. **Load the extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist` folder in this project

## Features & Team Responsibilities

| Feature                                                               | Team Member          |
| --------------------------------------------------------------------- | -------------------- |
| Upload PDF resume and extract skills using PDF.js                     | Emily Yu (yuemily12) |
| Categorize skills by domain (Programming, Cloud, Web, etc.)           | Emily Yu             |
| Store extracted skills in `chrome.storage` and sync across components | Mudit Marwaha        |
| Overlay matching skills on Handshake job postings via content script   | Myron Kharkover & Praise Ndlovu  |
| UI/UX design for popup (upload, progress, and skill display)          | Emily Yu & Mudit Marwaha |
| Vite + TypeScript React setup, manifest and build configuration       | Myron Kharkover      |
| Error handling, regex escape, and performance optimizations           | Emily Yu & Myron     |
| PDF storage persistence and management across sessions                | Mudit Marwaha        |
| Testing (interface, prompt, persistence, and job extraction)          | Emily Yu & Mudit Marwaha |
| Job matching with ChatGPT integration and match score generation      | Praise Ndlovu & Myron Kharkover |
| Match Score UI and Storage                                            | Praise Ndlovu & Mudit Marwaha|

## Known Bugs & Incomplete Features

- Skill extraction may occasionally miss complex multi-word technologies or industry-specific terminology
- Handshake job extraction is currently limited to basic job details; advanced features like salary range and application deadline extraction are not implemented
- Job matching algorithm currently uses basic keyword matching; more sophisticated semantic matching is planned for future updates
- Extension performance may be slower with very large PDF resumes (>10MB)
- No support for batch processing multiple resumes
- Limited to English language resumes and job postings
- No export functionality for extracted skills or job matches
- No integration with other job platforms beyond Handshake

## Landing Page

To run the landing page locally and previewing the landing page locally, you can first install a sinple static-file server.
Command: npm install --global serve
Then, serve the docs folder:
Command: serve docs
Finally, based on the URL printed by the serve command, follow that URL to see the landing page!

---

Contributions and pull requests are welcome! Please open issues for bugs or feature requests. Enjoy smarter job searching with the Smart Skill Extractor!
