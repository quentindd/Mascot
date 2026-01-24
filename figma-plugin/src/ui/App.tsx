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
    // In production, this would open a web auth flow
    // For now, prompt for token
    const token = prompt('Enter your API token:\n\nYou can get your API token from:\nhttps://mascot.com/dashboard/api-keys');
    if (token && token.trim()) {
      // Token will be stored in figma.clientStorage by the plugin code
      setToken(token.trim());
      setIsAuthenticated(true);
      rpc.send('init', { token: token.trim() });
    } else if (token !== null) {
      // User cancelled or entered empty token
      alert('Please enter a valid API token to generate real mascots.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="auth-screen">
          <h2>Mascot</h2>
          <p>AI mascot generation for Figma</p>
          <button onClick={handleLogin} className="btn-primary" style={{ width: '100%' }}>
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
              <a href="https://mascot.com/dashboard/api-keys" target="_blank" style={{ color: '#18a0fb', textDecoration: 'none' }}>
                → mascot.com/dashboard/api-keys
              </a>
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <a href="https://mascot.com/signup" target="_blank" style={{ color: '#18a0fb', fontSize: '11px' }}>
                Don't have an account? Sign up →
              </a>
            </div>
          </div>
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
