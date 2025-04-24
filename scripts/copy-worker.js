const fs = require("fs");
const path = require("path");

// Create dist/chunks directory if it doesn't exist
const chunksDir = path.join(__dirname, "../dist/chunks");
if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

// Copy PDF.js worker file
const workerSrc = path.join(
  __dirname,
  "../node_modules/pdfjs-dist/build/pdf.worker.min.js"
);
const workerDest = path.join(chunksDir, "pdf.worker.min.js");

fs.copyFileSync(workerSrc, workerDest);
console.log("PDF.js worker file copied successfully!");
