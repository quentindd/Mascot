console.log('[Mascoty] ui.js bundle loaded, starting execution...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('[Mascoty] React imports successful');
console.log('[Mascoty] React version:', React.version);
console.log('[Mascoty] ReactDOM available:', !!ReactDOM);

// Wait for DOM to be ready
function initApp() {
  console.log('[Mascoty] initApp called, looking for root element...');
  console.log('[Mascoty] document.readyState:', document.readyState);
  console.log('[Mascoty] document.body exists:', !!document.body);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[Mascoty] Root element not found!');
    console.error('[Mascoty] document.body:', document.body);
    console.error('[Mascoty] document.innerHTML:', document.documentElement.innerHTML.substring(0, 200));
    // Retry after a short delay
    setTimeout(initApp, 100);
    return;
  }
  console.log('[Mascoty] Root element found:', rootElement);
  console.log('[Mascoty] Mounting React app...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('[Mascoty] React root created');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(App, null)
      )
    );
    console.log('[Mascoty] React app mounted successfully');
  } catch (error) {
    console.error('[Mascoty] Error mounting React app:', error);
    console.error('[Mascoty] Error stack:', error.stack);
  }
}

// Try immediately, but also set up multiple fallbacks
if (document.readyState === 'loading') {
  console.log('[Mascoty] DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  console.log('[Mascoty] DOM already ready, initializing immediately...');
  // Use setTimeout to ensure DOM is fully ready
  setTimeout(initApp, 0);
}

// Fallback: try again after a delay
setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement && !rootElement.hasChildNodes()) {
    console.log('[Mascoty] Fallback: Root element exists but empty, retrying...');
    initApp();
  }
}, 100);
