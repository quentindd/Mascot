import React, { useState, useEffect } from 'react';
import { CharacterTab } from './tabs/CharacterTab';
import { AnimationsTab } from './tabs/AnimationsTab';
import { LogosTab } from './tabs/LogosTab';
import { AccountTab } from './tabs/AccountTab';
import { RPCClient } from './rpc/client';
import './App.css';

type Tab = 'character' | 'animations' | 'logos' | 'account';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('character');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [selectedMascot, setSelectedMascot] = useState<any>(null);
  const [mascots, setMascots] = useState<any[]>([]);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const rpc = new RPCClient();

  useEffect(() => {
    console.log('[Mascot] App component mounted');
    
    // Request stored token from plugin code
    rpc.send('get-stored-token');

    // Listen for RPC messages
    rpc.on('token-loaded', (data: { token: string }) => {
      console.log('[Mascot] Token loaded from storage');
      setToken(data.token);
      setIsAuthenticated(true);
      rpc.send('init', { token: data.token });
    });

    rpc.on('stored-token', (data: { token: string | null }) => {
      if (data.token && data.token.trim()) {
        console.log('[Mascot] Token retrieved from storage');
        setToken(data.token);
        setIsAuthenticated(true);
        rpc.send('init', { token: data.token });
      } else {
        // No token stored, show auth screen
        console.log('[Mascot] No token stored, showing auth screen');
      }
    });

    rpc.on('init-complete', () => {
      loadMascots();
      loadCredits();
    });

    rpc.on('mascots-loaded', (data: { mascots: any[] }) => {
      setMascots(data.mascots);
    });

    rpc.on('mascot-generated', (data: { mascot: any }) => {
      console.log('[Mascot] Adding mascot to list:', data.mascot);
      setMascots((prev) => {
        const newList = [data.mascot, ...prev];
        console.log('[Mascot] Updated mascots list:', newList);
        return newList;
      });
      setSelectedMascot(data.mascot);
    });

    return () => {
      rpc.cleanup();
    };
  }, []);

  const loadMascots = () => {
    rpc.send('get-mascots');
  };

  const loadCredits = async () => {
    // Would call API to get credits
    // For now, mock
    setCredits(100);
  };

  const handleLogin = async () => {
    console.log('[Mascot] Sign In button clicked, showing token input');
    setShowTokenInput(true);
  };

  const handleGoogleLogin = async () => {
    console.log('[Mascot] Google Sign In button clicked');
    // Open Google OAuth URL in browser
    const apiBaseUrl = 'https://mascot-production.up.railway.app';
    const googleAuthUrl = `${apiBaseUrl}/api/v1/auth/google`;
    
    // Send message to plugin code to open browser
    rpc.send('open-google-auth', { url: googleAuthUrl });
    
    // Listen for OAuth success message from browser
    window.addEventListener('message', handleOAuthMessage, false);
  };

  const handleOAuthMessage = (event: MessageEvent) => {
    // Security: only accept messages from our domain
    if (event.data?.type === 'mascot-oauth-success' && event.data?.token) {
      console.log('[Mascot] Received OAuth token');
      const token = event.data.token;
      setToken(token);
      rpc.send('init', { token });
      setIsAuthenticated(true);
      window.removeEventListener('message', handleOAuthMessage);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Mascot] Token submitted');
    if (tokenInput && tokenInput.trim()) {
      console.log('[Mascot] Valid token, authenticating...');
      console.log('[Mascot] Token length:', tokenInput.trim().length);
      // Token will be stored in figma.clientStorage by the plugin code
      const trimmedToken = tokenInput.trim();
      setToken(trimmedToken);
      console.log('[Mascot] Sending init message with token');
      rpc.send('init', { token: trimmedToken });
      console.log('[Mascot] Init message sent, waiting for response...');
      // Wait for init-complete before showing authenticated state
      setTimeout(() => {
        console.log('[Mascot] Setting authenticated to true');
        setIsAuthenticated(true);
      }, 100);
    } else {
      console.log('[Mascot] Empty token');
      alert('Please enter a valid API token to generate real mascots.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="auth-screen">
          <h2>Mascot</h2>
          <p>AI mascot generation for Figma</p>
          
          {!showTokenInput ? (
            <>
              <button onClick={handleGoogleLogin} className="btn-primary" style={{ width: '100%', marginBottom: '8px', background: '#4285f4' }}>
                🔵 Sign in with Google
              </button>
              <button onClick={handleLogin} className="btn-secondary" style={{ width: '100%' }}>
                Sign In with API Token
              </button>
              <div className="auth-hint" style={{ marginTop: '16px', fontSize: '11px', color: '#666', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>🔐 Authentication Required</strong>
                  <br />
                  You need an API token to generate mascots, animations, and logos.
                </div>
                <div style={{ marginBottom: '12px', padding: '12px', background: '#f8f8f8', borderRadius: '6px', border: '1px solid #e5e5e5' }}>
                  <strong>Get your API token:</strong>
                  <br />
                  <a href="https://arthralgic-gruffy-bettina.ngrok-free.dev" target="_blank" style={{ color: '#18a0fb', textDecoration: 'none' }}>
                    → Open backend API
                  </a>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleTokenSubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>
                  API Token:
                </label>
                <textarea
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your API token here..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '8px' }}>
                Continue
              </button>
              <button 
                type="button" 
                onClick={() => setShowTokenInput(false)} 
                style={{ width: '100%', padding: '8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="tabs">
        <button
          className={activeTab === 'character' ? 'active' : ''}
          onClick={() => setActiveTab('character')}
        >
          Character
        </button>
        <button
          className={activeTab === 'animations' ? 'active' : ''}
          onClick={() => setActiveTab('animations')}
        >
          Animations
        </button>
        <button
          className={activeTab === 'logos' ? 'active' : ''}
          onClick={() => setActiveTab('logos')}
        >
          Logos
        </button>
        <button
          className={activeTab === 'account' ? 'active' : ''}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'character' && (
          <CharacterTab
            rpc={rpc}
            mascots={mascots}
            selectedMascot={selectedMascot}
            onSelectMascot={setSelectedMascot}
            onMascotGenerated={loadMascots}
          />
        )}
        {activeTab === 'animations' && (
          <AnimationsTab
            rpc={rpc}
            selectedMascot={selectedMascot}
            onSelectMascot={setSelectedMascot}
            mascots={mascots}
          />
        )}
        {activeTab === 'logos' && (
          <LogosTab
            rpc={rpc}
            selectedMascot={selectedMascot}
            onSelectMascot={setSelectedMascot}
            mascots={mascots}
          />
        )}
        {activeTab === 'account' && (
          <AccountTab rpc={rpc} credits={credits} />
        )}
      </div>
    </div>
  );
};
