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
  const [animations, setAnimations] = useState<any[]>([]);
  const [logos, setLogos] = useState<any[]>([]);
  const [poses, setPoses] = useState<any[]>([]);
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

  // Request animations/logos/poses only once per mascot per session (persists across tab switches)
  const requestedAnimationMascotIds = useRef<Set<string>>(new Set());
  const requestedLogoMascotIds = useRef<Set<string>>(new Set());
  const requestedPoseMascotIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (mascots.length === 0) return;
    const needAnimationsOrLogosOrPoses = activeTab === 'gallery';
    const needPoses = activeTab === 'gallery' || activeTab === 'poses';
    for (const mascot of mascots) {
      if (!mascot.id) continue;
      if (needAnimationsOrLogosOrPoses && !requestedAnimationMascotIds.current.has(mascot.id)) {
        requestedAnimationMascotIds.current.add(mascot.id);
        rpc.send('get-mascot-animations', { mascotId: mascot.id });
      }
      if (needAnimationsOrLogosOrPoses && !requestedLogoMascotIds.current.has(mascot.id)) {
        requestedLogoMascotIds.current.add(mascot.id);
        rpc.send('get-mascot-logos', { mascotId: mascot.id });
      }
      if (needPoses && !requestedPoseMascotIds.current.has(mascot.id)) {
        requestedPoseMascotIds.current.add(mascot.id);
        rpc.send('get-mascot-poses', { mascotId: mascot.id });
      }
    }
  }, [activeTab, mascots, rpc]);

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

    // Logo-pack events: register at App level so messages are handled even when LogosTab is not mounted (avoids "No handlers registered")
    rpc.on('logo-pack-generation-started', () => {});
    rpc.on('logo-pack-generated', () => {});
    rpc.on('logo-pack-completed', () => {});
    rpc.on('logo-pack-generation-failed', () => {});
    rpc.on('logo-pack-generation-timeout', () => {});
    rpc.on('logo-pack-status-update', () => {});

    // Pose events: refetch poses for mascot when a pose is generated so Gallery shows it
    rpc.on('pose-generated', (data: { pose: any }) => {
      if (data?.pose?.mascotId) {
        rpc.send('get-mascot-poses', { mascotId: data.pose.mascotId });
      }
    });
    rpc.on('pose-status-update', () => {});

    // Animation created: refetch animations for that mascot so Gallery shows the new item (and no "No handlers registered")
    rpc.on('animation-generated', (data: { animation: any }) => {
      if (data?.animation?.mascotId) {
        rpc.send('get-mascot-animations', { mascotId: data.animation.mascotId });
      }
    });

    // Animations/logos at App level so they persist when user is on Animations tab (GalleryTab unmounted)
    rpc.on('mascot-animations-loaded', (data: { mascotId: string; animations: any[] }) => {
      setAnimations((prev) => {
        const filtered = prev.filter((a) => a.mascotId !== data.mascotId);
        return [...filtered, ...(data.animations || [])];
      });
    });
    rpc.on('mascot-logos-loaded', (data: { mascotId: string; logos: any[] }) => {
      setLogos((prev) => {
        const filtered = prev.filter((l) => l.mascotId !== data.mascotId);
        return [...filtered, ...(data.logos || [])];
      });
    });
    rpc.on('animation-status-update', (data: { animationId: string; status: string; errorMessage?: string }) => {
      setAnimations((prev) =>
        prev.map((a) =>
          a.id === data.animationId
            ? { ...a, status: data.status, errorMessage: data.errorMessage }
            : a
        )
      );
    });
    rpc.on('animation-completed', (data: { animation: any }) => {
      const anim = data.animation;
      if (!anim?.id) return;
      setAnimations((prev) => {
        const idx = prev.findIndex((a) => a.id === anim.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...anim };
          return next;
        }
        return [...prev, anim];
      });
    });
    rpc.on('animation-deleted', (data: { animationId: string }) => {
      setAnimations((prev) => prev.filter((a) => a.id !== data.animationId));
    });
    rpc.on('logo-pack-deleted', (data: { id: string }) => {
      setLogos((prev) => prev.filter((l) => l.id !== data.id));
    });

    rpc.on('mascot-poses-loaded', (data: { mascotId: string; poses: any[] }) => {
      setPoses((prev) => {
        const filtered = prev.filter((p) => p.mascotId !== data.mascotId);
        return [...filtered, ...(data.poses || [])];
      });
    });
    rpc.on('pose-completed', (data: { pose: any }) => {
      const pose = data.pose;
      if (!pose?.id) return;
      setPoses((prev) => {
        const idx = prev.findIndex((p) => p.id === pose.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...pose };
          return next;
        }
        return [...prev, pose];
      });
      // Refetch poses from API so Gallery and list stay in sync (imageUrl, status)
      if (pose.mascotId) {
        rpc.send('get-mascot-poses', { mascotId: pose.mascotId });
      }
    });
    rpc.on('pose-deleted', (data: { id: string }) => {
      setPoses((prev) => prev.filter((p) => p.id !== data.id));
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
          (data.variations ?? []).forEach((variation) => {
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

      {/* Main Content Area - all tabs always mounted, hidden when inactive so state persists when switching tabs */}
      <div className="main-content-area">
        <div className="content-wrapper">
          <div style={{ display: activeTab === 'gallery' ? 'block' : 'none' }} className="tab-panel">
            <GalleryTab
              rpc={rpc}
              mascots={mascots}
              animations={animations}
              logos={logos}
              poses={poses}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
            />
          </div>
          <div style={{ display: activeTab === 'character' ? 'block' : 'none' }} className="tab-panel">
            <CharacterTab
              rpc={rpc}
              mascots={mascots}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
              onMascotGenerated={loadMascots}
              generatedVariations={generatedVariations}
              onVariationsChange={setGeneratedVariations}
            />
          </div>
          <div style={{ display: activeTab === 'animations' ? 'block' : 'none' }} className="tab-panel">
            <AnimationsTab
              rpc={rpc}
              selectedMascot={selectedMascot}
              onSelectMascot={(mascot) => {
                console.log('[App] Setting selected mascot in AnimationsTab:', mascot?.id || 'null');
                setSelectedMascot(mascot);
              }}
              mascots={mascots}
            />
          </div>
          <div style={{ display: activeTab === 'logos' ? 'block' : 'none' }} className="tab-panel">
            <LogosTab
              rpc={rpc}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
              mascots={mascots}
            />
          </div>
          <div style={{ display: activeTab === 'poses' ? 'block' : 'none' }} className="tab-panel">
            <PosesTab
              rpc={rpc}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
              mascots={mascots}
            />
          </div>
          <div style={{ display: activeTab === 'account' ? 'block' : 'none' }} className="tab-panel">
            <AccountTab rpc={rpc} credits={credits} />
          </div>
        </div>
      </div>
    </div>
  );
};
