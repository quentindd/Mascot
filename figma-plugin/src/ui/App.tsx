import React, { useState, useEffect, useRef } from 'react';
import { CharacterTab } from './tabs/CharacterTab';
import { AnimationsTab } from './tabs/AnimationsTab';
import { LogosTab } from './tabs/LogosTab';
import { AccountTab } from './tabs/AccountTab';
import { GalleryTab } from './tabs/GalleryTab';
import { PosesTab } from './tabs/PosesTab';
import { RPCClient } from './rpc/client';
import './App.css';

type Tab = 'gallery' | 'character' | 'animations' | 'logos' | 'poses' | 'account';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('character');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [selectedMascot, setSelectedMascot] = useState<any>(null);
  const [mascots, setMascots] = useState<any[]>([]);
  const [generatedVariations, setGeneratedVariations] = useState<any[]>([]);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  
  // Debug: log mascots state changes
  React.useEffect(() => {
    console.log('[App] Mascots state updated:', mascots.length, 'mascots');
    if (mascots.length > 0) {
      console.log('[App] Mascot IDs:', mascots.map(m => ({ id: m.id, name: m.name })));
    }
  }, [mascots]);

  // Use useRef to ensure RPCClient is only created once
  const rpcRef = useRef<RPCClient | null>(null);
  if (!rpcRef.current) {
    rpcRef.current = new RPCClient();
  }
  const rpc = rpcRef.current;

  useEffect(() => {
    console.log('[Mascot] App component mounted');
    
    // Load mascots when component mounts or when authenticated
    if (isAuthenticated) {
      loadMascots();
    }
    
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

    rpc.on('mascot-deleted', () => {
      // Reload mascots after deletion
      loadMascots();
    });

    rpc.on('mascots-loaded', (data: { mascots: any[] }) => {
      console.log('[App] ===== MASCOTS-LOADED EVENT RECEIVED =====');
      console.log('[App] Data received:', data);
      console.log('[App] Mascots array:', data.mascots);
      console.log('[App] Mascots length:', data.mascots ? data.mascots.length : 'null/undefined');
      console.log('[App] Is array?', Array.isArray(data.mascots));
      
      if (data && data.mascots && Array.isArray(data.mascots)) {
        console.log('[App] Setting mascots state with', data.mascots.length, 'mascots');
        if (data.mascots.length > 0) {
          console.log('[App] First mascot sample:', { id: data.mascots[0].id, name: data.mascots[0].name });
          console.log('[App] First 5 mascot IDs:', data.mascots.slice(0, 5).map(m => ({ id: m.id, name: m.name })));
        }
        // Replace all mascots with fresh data from API
        setMascots(data.mascots);
        console.log('[App] State updated, new mascots count:', data.mascots.length);
      } else {
        console.warn('[App] Invalid mascots data received:', data);
        console.warn('[App] Type of data:', typeof data);
        console.warn('[App] Type of data.mascots:', typeof data?.mascots);
        setMascots([]);
      }
      console.log('[App] ===== END MASCOTS-LOADED EVENT =====');
    });

    rpc.on('mascot-generated', (data: { mascot: any; variations?: any[] }) => {
      console.log('[App] Mascot generated:', data.mascot?.id);
      
      // Store variations in global state so they persist across tab changes
      if (data.variations && data.variations.length > 0) {
        console.log('[App] Storing', data.variations.length, 'variations in global state');
        setGeneratedVariations(data.variations);
        
        // Also add all variations to mascots list immediately
        setMascots((prev) => {
          const newMascots = [...prev];
          data.variations.forEach((variation) => {
            const exists = newMascots.some(m => m.id === variation.id);
            if (!exists) {
              newMascots.push(variation);
            } else {
              // Update existing mascot with latest data
              const index = newMascots.findIndex(m => m.id === variation.id);
              if (index >= 0) {
                newMascots[index] = { ...newMascots[index], ...variation };
              }
            }
          });
          console.log('[App] Added variations to mascots list. Total:', newMascots.length);
          return newMascots;
        });
      }
      
      if (data.mascot) {
        console.log('[App] Adding mascot to list:', data.mascot.id);
        setMascots((prev) => {
          // Check if mascot already exists to avoid duplicates
          const exists = prev.some(m => m.id === data.mascot.id);
          if (exists) {
            console.log('[App] Mascot already in list, updating instead');
            return prev.map(m => m.id === data.mascot.id ? data.mascot : m);
          }
          const newList = [data.mascot, ...prev];
          console.log('[App] Updated mascots list:', newList.length);
          return newList;
        });
        setSelectedMascot(data.mascot);
      }
      
      // Reload mascots from API after a delay to ensure backend has processed them
      setTimeout(() => {
        console.log('[App] Reloading mascots from API after generation...');
        loadMascots();
      }, 2000);
    });

    rpc.on('add-mascot-to-list', (data: { mascot: any }) => {
      console.log('[App] Received add-mascot-to-list:', data.mascot ? data.mascot.id : 'null');
      if (!data.mascot || !data.mascot.id) {
        console.error('[App] Invalid mascot data in add-mascot-to-list:', data);
        return;
      }
      setMascots((prev) => {
        // Check if mascot already exists to avoid duplicates
        const exists = prev.some(m => m.id === data.mascot.id);
        if (exists) {
          console.log('[App] Mascot already in list, updating instead');
          return prev.map(m => m.id === data.mascot.id ? { ...data.mascot, ...m } : m);
        }
        const newList = [data.mascot, ...prev];
        console.log('[App] Added mascot to list. Total:', newList.length, 'mascots');
        return newList;
      });
      setSelectedMascot(data.mascot);
      // Also reload from API to ensure we have the latest data (with a slight delay to allow backend to process)
      setTimeout(() => {
        console.log('[App] Reloading mascots from API after adding to list...');
        loadMascots();
      }, 1000);
    });
    

    return () => {
      rpc.cleanup();
    };
  }, []);

  const loadMascots = () => {
    console.log('[Mascot] Loading mascots from API...');
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
    if (event.origin !== 'https://mascot-production.up.railway.app') {
      return;
    }

    if (event.data.type === 'oauth-success' && event.data.token) {
      console.log('[Mascot] OAuth success, received token');
      setToken(event.data.token);
      setIsAuthenticated(true);
      rpc.send('init', { token: event.data.token });
      window.removeEventListener('message', handleOAuthMessage, false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      return;
    }

    console.log('[Mascot] Token submitted');
    setToken(tokenInput.trim());
    setIsAuthenticated(true);
    rpc.send('init', { token: tokenInput.trim() });
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome to Mascot</h2>
          <p>Sign in to start creating mascots</p>
          {!showTokenInput ? (
            <>
              <button className="btn-primary" onClick={handleGoogleLogin}>
                Sign in with Google
              </button>
              <button className="btn-secondary" onClick={handleLogin}>
                Use API Token
              </button>
            </>
          ) : (
            <form onSubmit={handleTokenSubmit} className="auth-form">
              <label>API Token</label>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your API token here..."
                className="token-input"
                autoFocus
              />
              <button type="submit" className="btn-primary">
                Continue
              </button>
              <button 
                type="button" 
                onClick={() => setShowTokenInput(false)} 
                className="btn-secondary"
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
    <div className="plugin-container">
      {/* Sidebar Navigation */}
      <div className="sidebar-nav">
        <div className="sidebar-header">
          {credits !== null && (
            <div className="credits-info">
              <span className="credits-label">Credits</span>
              <span className="credits-value">{credits}</span>
            </div>
          )}
        </div>
        
        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'character' ? 'active' : ''}`}
            onClick={() => {
              if (isAuthenticated) {
                loadMascots();
              }
              setActiveTab('character');
            }}
          >
            Create
          </button>
          <button
            className={`nav-item ${activeTab === 'animations' ? 'active' : ''}`}
            onClick={() => {
              if (isAuthenticated) {
                loadMascots();
              }
              setActiveTab('animations');
            }}
          >
            Animate
          </button>
          <button
            className={`nav-item ${activeTab === 'logos' ? 'active' : ''}`}
            onClick={() => {
              if (isAuthenticated) {
                loadMascots();
              }
              setActiveTab('logos');
            }}
          >
            Logos
          </button>
          <button
            className={`nav-item ${activeTab === 'poses' ? 'active' : ''}`}
            onClick={() => {
              if (isAuthenticated) {
                loadMascots();
              }
              setActiveTab('poses');
            }}
          >
            Poses
          </button>
          <button
            className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => {
              if (isAuthenticated) {
                loadMascots();
              }
              setActiveTab('gallery');
            }}
          >
            Gallery
          </button>
        </nav>
        
        {/* Separator and Account at bottom */}
        <div className="nav-menu-bottom">
          <div className="nav-separator"></div>
          <button
            className={`nav-item nav-item-account ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="main-content-area">
        <div className="content-wrapper">
          {activeTab === 'gallery' && (
            <GalleryTab
              rpc={rpc}
              mascots={mascots}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
            />
          )}
          {activeTab === 'character' && (
            <CharacterTab
              rpc={rpc}
              mascots={mascots}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
              onMascotGenerated={loadMascots}
              generatedVariations={generatedVariations}
              onVariationsChange={setGeneratedVariations}
            />
          )}
          {activeTab === 'animations' && (
            <AnimationsTab
              rpc={rpc}
              selectedMascot={selectedMascot}
              onSelectMascot={(mascot) => {
                console.log('[App] Setting selected mascot in AnimationsTab:', mascot?.id || 'null');
                setSelectedMascot(mascot);
              }}
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
          {activeTab === 'poses' && (
            <PosesTab
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
    </div>
  );
};
