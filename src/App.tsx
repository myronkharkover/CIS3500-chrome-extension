
// src/App.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
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
  // ───── Resume upload states ─────
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoadingPDF, setIsLoadingPDF] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ───── API-key states ─────
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // ───── Toggle display ─────
  const [showSkills, setShowSkills] = useState<boolean>(true);
  const [showJobs, setShowJobs] = useState<boolean>(false);
  const [jobs, setJobs] = useState<JobInfo[]>([]);

  // Load saved jobs when toggled on
  useEffect(() => {
    if (!showJobs) return;
    chrome.storage.local.get(['savedJobs'], result => {
      setJobs(Array.isArray(result.savedJobs) ? result.savedJobs : []);
    });
  }, [showJobs]);

  // ───── On mount: load config ─────
  useEffect(() => {
    chrome.storage.local
      .get(['apiKey', 'resumeFileName', 'userSkills'])
      .then(res => {
        if (typeof res.apiKey === 'string') setStoredKey(res.apiKey);
        if (typeof res.resumeFileName === 'string') setResumeFileName(res.resumeFileName);
        if (Array.isArray(res.userSkills)) setSkills(res.userSkills as Skill[]);
      })
      .catch(err => console.error('Storage get failed', err))
      .finally(() => setLoadingConfig(false));
  }, []);

  // ───── Verify & save API key ─────
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

  // ───── Handle PDF upload ─────
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    setResumeFileName(file.name);
    setIsLoadingPDF(true);
    try {
      const extracted = await processPDF(file);
      setSkills(extracted);
      await chrome.storage.local.set({ resumeFileName: file.name, userSkills: extracted });
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Failed to process PDF. Please try again.');
    } finally {
      setIsLoadingPDF(false);
    }
  };

  const clearResume = async (): Promise<void> => {
    await chrome.storage.local.remove(['resumeFileName', 'userSkills']);
    setResumeFileName(null);
    setSkills([]);
    setError(null);
  };

  // Group skills by category
  const groupedSkills = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  if (loadingConfig) {
    return (
      <div className="app-container">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* API Key Section */}
      {storedKey ? (
        <div className="api-saved-section">
          <p>API Key Saved</p>
          <button onClick={clearKey}>Change Key</button>
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
          <button onClick={handleSaveKey}>Save Key</button>
          {apiKeyError && <p className="error-message">{apiKeyError}</p>}
        </div>
      )}

      {/* Resume Section */}
      <div className="upload-section">
        <h2>Resume</h2>
        {resumeFileName ? (
          <>
            <p className="file-name">Loaded: {resumeFileName}</p>
            <button onClick={clearResume}>Remove Resume</button>
          </>
        ) : (
          <>
            <input type="file" accept=".pdf" onChange={handleFileUpload} />
            {error && <p className="error-message">{error}</p>}
          </>
        )}
      </div>

      {/* Toggle Section */}
      <div className="toggle-section">
        <button onClick={() => setShowSkills(!showSkills)}>
          {showSkills ? 'Hide Skills' : 'Show Skills'}
        </button>
        <button onClick={() => setShowJobs(!showJobs)}>
          {showJobs ? 'Hide Saved Jobs' : 'Show Saved Jobs'}
        </button>
      </div>

      {/* Skills Display */}
      {showSkills && (
        <div className="skills-section">
          <h2>Your Skills</h2>
          {isLoadingPDF ? (
            <p>Extracting…</p>
          ) : skills.length > 0 ? (
            <div className="skills-container">
              {Object.entries(groupedSkills).map(([category, items]) => (
                <div key={category} className="skill-category">
                  <h3>{category}</h3>
                  <ul>
                    {items.map((skill, idx) => (
                      <li key={idx}>{skill.name} ({Math.round(skill.confidence * 100)}%)</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p>Upload a resume to see your skills.</p>
          )}
        </div>
      )}

      {/* Saved Jobs Display */}
      {showJobs && (
        <div className="jobs-section">
          <h2>Saved Jobs</h2>
          {jobs.length > 0 ? (
            <ul className="jobs-list">
              {jobs.map((job, idx) => (
                <li key={idx} className="job-item">
                  <h3>{job.title}</h3>
                  <p><strong>{job.employerName}</strong> — {job.location}</p>
                  <p><em>Industry:</em> {job.industry}</p>
                  <details>
                    <summary>Qualifications</summary>
                    <ul>
                      {job.minimumQualifications.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p>No saved jobs yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
