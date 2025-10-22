// C:\Users\hemant\Downloads\synapse\src\index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assuming App.tsx is now in src/
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- TEMPORARILY COMMENTED OUT SERVICE WORKER REGISTRATION ---
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const PRODUCTION_ORIGIN = "https://heman713kumar.github.io";

    if (window.location.origin === PRODUCTION_ORIGIN) {
      navigator.serviceWorker.register("/Synapse/sw.js", { scope: "/Synapse/" })
        .then(registration => {
          console.log("Service Worker registered:", registration);
        })
        .catch(error => {
          console.error("Service Worker registration failed:", error);
        });
    } else {
      console.log("Service Worker registration skipped. Current origin:", window.location.origin);
    }
  });
} else {
    console.log("Service workers are not supported in this browser.");
}
*/
console.log("Service Worker registration is currently DISABLED for testing.");
// --- END OF TEMPORARY COMMENT OUT ---