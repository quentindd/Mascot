console.log('[Mascot] ui.js bundle loaded, starting execution...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('[Mascot] React imports successful');

// Wait for DOM to be ready
function initApp() {
  console.log('[Mascot] initApp called, looking for root element...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[Mascot] Root element not found!');
    console.error('[Mascot] document.body:', document.body);
    console.error('[Mascot] document.readyState:', document.readyState);
    return;
  }
  console.log('[Mascot] Root element found, mounting React app...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('[Mascot] React app mounted successfully');
  } catch (error) {
    console.error('[Mascot] Error mounting React app:', error);
  }
}

// Try immediately
if (document.readyState === 'loading') {
  console.log('[Mascot] DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  console.log('[Mascot] DOM already ready, initializing immediately...');
  initApp();
}
