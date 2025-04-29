import React, { useState, useEffect } from 'react';
import './App.css';
import { processPDF } from './utils/pdfProcessor';
import { JobInfo } from './content';
import { OpenAI } from 'openai';

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


  // ───── API-key states ─────
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // ───── Toggle display ─────
  const [showSkills, setShowSkills] = useState<boolean>(true);
  const [showJobs, setShowJobs] = useState<boolean>(false);
  const [jobs, setJobs] = useState<JobInfo[]>([]);

  useEffect(() => {
    // Load multiple keys in one call
    chrome.storage.local.get(
      ['storedPDF', 'storedPDFName', 'userSkills', 'apiKey'],
      result => {
        // PDF
        if (result.storedPDF) {
          setHasStoredPDF(true);
          setStoredPDFName(result.storedPDFName || '');
        }
        // Skills
        if (Array.isArray(result.userSkills)) {
          setSkills(result.userSkills);
        }
        // API Key
        if (typeof result.apiKey === 'string') {
          setStoredKey(result.apiKey);
        }
        setLoadingConfig(false);
      }
    );
  }, []);
  // Load saved jobs when toggled on
  useEffect(() => {
    if (!showJobs) return;
    chrome.storage.local.get(['savedJobs'], result => {
      setJobs(Array.isArray(result.savedJobs) ? result.savedJobs : []);
    });
  }, [showJobs]);

  //───── Verify & save API key ─────

  const handleSaveKey = async (): Promise<void> => {
    if (!apiKey) {
      setApiKeyError('Please enter an API key before saving.');
      return;
    }
    if (!apiKey.startsWith('sk-')) {
      setApiKeyError('API key must start with "sk-"');
      return;
    }
    try {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      await client.models.list();
      await chrome.storage.local.set({ apiKey });
      setStoredKey(apiKey);
      setApiKeyError(null);
    } catch (err: any) {
      console.error('Error verifying key:', err);
      setApiKeyError('That API key is invalid or revoked.');
    }
  };

  const clearKey = async (): Promise<void> => {
    await chrome.storage.local.remove('apiKey');
    setStoredKey(null);
    setApiKey('');
  };



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

      {/* API Key Section */}
      {storedKey ? (
        <div className="api-section">
          <p>API Key Saved</p>
          <button className= "clear-button" onClick={clearKey}>Change Key</button>
        </div>
      ) : (
        <div className="api-section">
          <h2>Enter Your OpenAI API Key</h2>
          <textarea
            value={apiKey}
            placeholder="sk-********************************"
            onChange={e => { setApiKey(e.target.value.trim()); setApiKeyError(null); }}
            className="api-input"
            rows={3}
          />
          <button className='save-button' onClick={handleSaveKey}>Save Key</button>
          {apiKeyError && <p className="error-message">{apiKeyError}</p>}
        </div>
      )}
      
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
