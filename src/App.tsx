import React, { useState, useEffect } from 'react';
import './App.css';
import { processPDF } from './utils/pdfProcessor';

interface Skill {
  name: string;
  confidence: number;
  category: string;
}

const App: React.FC = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStoredPDF, setHasStoredPDF] = useState(false);
  const [storedPDFName, setStoredPDFName] = useState<string>('');

  useEffect(() => {
    // Check if there's a stored PDF when component mounts
    chrome.storage.local.get(['storedPDF', 'userSkills', 'storedPDFName'], (result) => {
      if (result.storedPDF) {
        setHasStoredPDF(true);
        setStoredPDFName(result.storedPDFName || '');
      }
      if (result.userSkills) {
        setSkills(result.userSkills);
      }
    });
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setIsLoading(true);
      setError(null);
      
      try {
        const extractedSkills = await processPDF(file);
        setSkills(extractedSkills);
        
        // Store skills and PDF in chrome.storage
        const reader = new FileReader();
        reader.onload = async (e) => {
          const pdfData = e.target?.result;
          await chrome.storage.local.set({ 
            userSkills: extractedSkills,
            storedPDF: pdfData,
            storedPDFName: file.name
          });
          setHasStoredPDF(true);
          setStoredPDFName(file.name);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError('Failed to process PDF. Please try again.');
        console.error('Error processing PDF:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleClearPDF = async () => {
    await chrome.storage.local.remove(['storedPDF', 'userSkills', 'storedPDFName']);
    setResumeFile(null);
    setSkills([]);
    setHasStoredPDF(false);
    setStoredPDFName('');
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="app-container">
      <h1>Smart Skill Extractor</h1>
      
      <div className="upload-section">
        <h2>Upload Your Resume</h2>
        {hasStoredPDF ? (
          <div className="stored-pdf-info">
            <p>You have a stored resume: "{storedPDFName}". Upload a new one to replace it.</p>
            <button onClick={handleClearPDF} className="clear-button">
              Clear Stored Resume
            </button>
          </div>
        ) : null}
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="file-input"
        />
        {resumeFile && (
          <p className="file-name">Selected file: {resumeFile.name}</p>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="skills-section">
        <h2>Your Skills</h2>
        {isLoading ? (
          <p>Extracting skills...</p>
        ) : skills.length > 0 ? (
          <div className="skills-container">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="skill-category">
                <h3 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <ul className="skills-list">
                  {categorySkills.map((skill, index) => (
                    <li key={index} className="skill-item">
                      <span className="skill-name">{skill.name}</span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${skill.confidence * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p>Upload a resume to see your skills</p>
        )}
      </div>
    </div>
  );
};

export default App;
