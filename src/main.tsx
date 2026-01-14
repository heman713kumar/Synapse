// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css';

// --- CLEANED AND SIMPLIFIED SERVICE WORKER CODE ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the Service Worker once on page load.
    // The browser handles subsequent updates automatically based on content changes.
    navigator.serviceWorker.register('/Synapse/sw.js') // Path relative to domain root
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
// --- END CLEANED SERVICE WORKER CODE ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)