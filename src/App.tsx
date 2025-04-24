import React, { useState } from 'react';
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setIsLoading(true);
      setError(null);
      
      try {
        const extractedSkills = await processPDF(file);
        setSkills(extractedSkills);
        
        // Store skills in chrome.storage
        chrome.storage.local.set({ userSkills: extractedSkills });
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
