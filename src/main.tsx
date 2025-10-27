// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css';

// --- ADD SERVICE WORKER CODE HERE ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the base path from vite.config.ts
    navigator.serviceWorker.register('/Synapse/sw.js') // Path relative to domain root
      .then((registration) => {
        console.log('SW registered: ', registration);
        // Attempt to update registration immediately after registration
        registration.update(); // Add this line
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
// Optional: Attempt update on subsequent loads if SW is already active
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        registration.update();
    });
}
// --- END SERVICE WORKER CODE ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)