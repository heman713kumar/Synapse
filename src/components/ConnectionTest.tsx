import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/backendApiService';
// REMOVE this line: import './ConnectionTest.css';

const ConnectionTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Define frontendUrl properly
  const frontendUrl = window.location.origin;
  const targetBackendUrl = (import.meta.env.VITE_API_URL || 'https://synapse-backend-api.onrender.com/api').replace('/api', '');

  const testConnection = async () => {
    setIsLoading(true);
    setBackendStatus('Testing...');
    
    try {
      const isHealthy = await checkBackendHealth();
      setBackendStatus(isHealthy ? 'Backend Connected & Healthy' : 'Backend Connection Failed');
    } catch (error) {
      setBackendStatus('Backend Connection Error');
      console.error('Connection test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="connection-test">
      <h2>Connection Test</h2>
      <div className="status-info">
        <p><strong>Backend Status:</strong> {backendStatus}</p>
        <p><strong>Frontend URL:</strong> {frontendUrl}</p>
        <p><strong>Target Backend URL:</strong> {targetBackendUrl}</p>
      </div>
      <button 
        onClick={testConnection} 
        disabled={isLoading}
        className="test-button"
      >
        {isLoading ? 'Testing...' : 'Test Connection Again'}
      </button>
    </div>
  );
};

export default ConnectionTest;