import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for TensorFlow.js
window.addEventListener('unhandledrejection', event => {
  if (event.reason && event.reason.message && event.reason.message.includes('tensorflow')) {
    console.warn('TensorFlow.js warning:', event.reason.message);
    event.preventDefault(); // Prevent the error from showing in console
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);