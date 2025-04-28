# Smart Skill Extractor

Smart Skill Extractor is a Google Chrome extension that helps job applicants highlight and extract key skills from both job postings and personal resumes. Users can upload a PDF resume, view their top skills categorized by domain, and see matching skills overlaid on career sites like Linkedin.

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
3. **Build the extension**
   ```bash
   npm run build
   ```
4. **Load the extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist` folder in this project

## Features & Team Responsibilities

| Feature                                                               | Team Member          |
| --------------------------------------------------------------------- | -------------------- |
| Upload PDF resume and extract skills using PDF.js                     | Emily Yu (yuemily12) |
| Categorize skills by domain (Programming, Cloud, Web, etc.)           | Emily Yu             |
| Store extracted skills in `chrome.storage` and sync across components | Mudit Marwaha               |
| Overlay matching skills on Linkedin job postings via content script   | Myron Kharkover      |
| UI/UX design for popup (upload, progress, and skill display)          | Emily Yu             |
| Vite + TypeScript React setup, manifest and build configuration       | Myron Kharkover      |
| Error handling, regex escape, and performance optimizations           | Emily Yu & Myron     |
| PDF storage persistence and management across sessions                | Mudit Marwaha        |

## Known Bugs & Incomplete Features

- Skill extraction may miss synonyms or multi-word technologies (e.g., "RESTful API").
- No backend verification: extraction logic runs entirely in the browser.
- Linkedin matching logic only overlays skills; does not compute match score with a given job posting yet.
- Support for non-PDF resume formats (Word, plain text) is not implemented.
- No persistence beyond `chrome.storage`; uninstalling the extension clears uploaded data.

## Landing Page

To run the landing page locally and previewing the landing page locally, you can first install a sinple static-file server.
Command: npm install --global serve
Then, serve the docs folder:
Command: serve docs
Finally, based on the URL printed by the serve command, follow that URL to see the landing page!

---

Contributions and pull requests are welcome! Please open issues for bugs or feature requests. Enjoy smarter job searching with the Smart Skill Extractor!"}
