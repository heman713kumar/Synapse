// C:\Users\hemant\Downloads\synapse\src\components\ConnectionTest.tsx
import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/backendApiService'; // Import the specific function

const ConnectionTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setBackendStatus('Checking...');
    try {
      const isHealthy = await checkBackendHealth(); // Use the imported function
      if (isHealthy) {
        setBackendStatus('✅ Backend Connected & Healthy');
      } else {
        setBackendStatus('❌ Backend Connection Failed (Health Check)');
      }
    } catch (error: any) {
      setBackendStatus(`❌ Backend Connection Failed: ${error.message}`);
      console.error('Connection test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  const frontendUrl = window.location.origin;
  // Derive backend base URL from the VITE_API_URL or fallback
  const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

  return (
    <div className="p-5 bg-gray-100 dark:bg-gray-800 m-5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200">
      <h2 className="text-xl font-bold mb-3">Connection Test</h2>
      <p><strong>Backend Status:</strong> {backendStatus}</p>
      <p><strong>Frontend URL:</strong> {frontendUrl}</p>
      <p><strong>Target Backend URL:</strong> {backendBaseUrl}</p>

      <button
        onClick={testBackendConnection}
        disabled={loading}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing...' : 'Test Connection Again'}
      </button>
    </div>
  );
};

export default ConnectionTest; // Add default export if needed elsewhere