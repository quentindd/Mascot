console.log('[Mascot] ui.js bundle loaded, starting execution...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('[Mascot] React imports successful');
console.log('[Mascot] React version:', React.version);
console.log('[Mascot] ReactDOM available:', !!ReactDOM);

// Wait for DOM to be ready
function initApp() {
  console.log('[Mascot] initApp called, looking for root element...');
  console.log('[Mascot] document.readyState:', document.readyState);
  console.log('[Mascot] document.body exists:', !!document.body);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[Mascot] Root element not found!');
    console.error('[Mascot] document.body:', document.body);
    console.error('[Mascot] document.innerHTML:', document.documentElement.innerHTML.substring(0, 200));
    // Retry after a short delay
    setTimeout(initApp, 100);
    return;
  }
  console.log('[Mascot] Root element found:', rootElement);
  console.log('[Mascot] Mounting React app...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('[Mascot] React root created');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(App, null)
      )
    );
    console.log('[Mascot] React app mounted successfully');
  } catch (error) {
    console.error('[Mascot] Error mounting React app:', error);
    console.error('[Mascot] Error stack:', error.stack);
  }
}

// Try immediately, but also set up multiple fallbacks
if (document.readyState === 'loading') {
  console.log('[Mascot] DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  console.log('[Mascot] DOM already ready, initializing immediately...');
  // Use setTimeout to ensure DOM is fully ready
  setTimeout(initApp, 0);
}

// Fallback: try again after a delay
setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement && !rootElement.hasChildNodes()) {
    console.log('[Mascot] Fallback: Root element exists but empty, retrying...');
    initApp();
  }
}, 100);
