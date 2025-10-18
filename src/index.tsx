import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

// Conditionally register the service worker only on the production origin.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // The official production origin for GitHub Pages.
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
      // Prevent registration in any non-production or sandbox environment.
      console.log("Service Worker registration skipped. Current origin:", window.location.origin);
    }
  });
} else {
    console.log("Service workers are not supported in this browser.");
}