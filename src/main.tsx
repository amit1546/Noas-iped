import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ask the browser to keep our IndexedDB data even under storage pressure.
navigator.storage?.persist?.().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
