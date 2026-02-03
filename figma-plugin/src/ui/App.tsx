import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterTab } from './tabs/CharacterTab';
import { AccountTab } from './tabs/AccountTab';
import { GalleryTab } from './tabs/GalleryTab';
import { PosesTab } from './tabs/PosesTab';
import { AuthScreen } from './AuthScreen';
import { RPCClient } from './rpc/client';
import { API_ORIGIN } from '../config';
import './App.css';

type Tab = 'gallery' | 'character' | 'poses' | 'account';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('character');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null); // 'basic' | 'pro' | 'max' when subscribed
  const [selectedMascot, setSelectedMascot] = useState<any>(null);
  const [mascots, setMascots] = useState<any[]>([]);
  const [poses, setPoses] = useState<any[]>([]);
  const [generatedVariations, setGeneratedVariations] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingStoredToken, setCheckingStoredToken] = useState(false);

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

  // Request poses only once per mascot per session (persists across tab switches)
  const requestedPoseMascotIds = useRef<Set<string>>(new Set());
  const assetLoadQueueRef = useRef<Array<{ type: string; mascotId: string }>>([]);
  const assetLoadingRef = useRef<boolean>(false);

  const processAssetLoadQueue = useCallback(() => {
    if (assetLoadingRef.current || assetLoadQueueRef.current.length === 0) return;
    assetLoadingRef.current = true;
    const batch = assetLoadQueueRef.current.splice(0, 3);
    for (const item of batch) {
      if (item.type === 'poses') rpc.send('get-mascot-poses', { mascotId: item.mascotId });
    }
    setTimeout(() => {
      assetLoadingRef.current = false;
      processAssetLoadQueue();
    }, 300);
  }, [rpc]);

  useEffect(() => {
    if (mascots.length === 0) return;
    const needPoses = activeTab === 'gallery' || activeTab === 'poses';
    const queue = assetLoadQueueRef.current;
    for (const mascot of mascots) {
      if (!mascot.id) continue;
      if (needPoses && !requestedPoseMascotIds.current.has(mascot.id)) {
        requestedPoseMascotIds.current.add(mascot.id);
        queue.push({ type: 'poses', mascotId: mascot.id });
      }
    }
    processAssetLoadQueue();
  }, [activeTab, mascots, rpc, processAssetLoadQueue]);

  useEffect(() => {
    console.log('[Mascoty] App component mounted');
    
    // Register all RPC handlers first so we never miss messages (fixes "No handlers" after OAuth)
    rpc.on('token-loaded', (data: { token: string }) => {
      console.log('[Mascoty] Token loaded from storage');
      setToken(data.token);
      setAuthError('');
      setCheckingStoredToken(true);
      rpc.send('init', { token: data.token });
    });

    rpc.on('stored-token', (data: { token: string | null }) => {
      if (data.token && data.token.trim()) {
        console.log('[Mascoty] Token retrieved from storage');
        setToken(data.token);
        setAuthError('');
        setCheckingStoredToken(true);
        rpc.send('init', { token: data.token });
      } else {
        console.log('[Mascoty] No token stored, showing auth screen');
      }
    });

    rpc.on('init-complete', () => {
      setAuthError('');
      setAuthLoading(false);
      setCheckingStoredToken(false);
      setIsAuthenticated(true);
      loadMascots();
      loadCredits();
    });

    rpc.on('init-failed', (data: { message?: string }) => {
      const msg = data?.message || 'Invalid or expired token. Please check your API token.';
      setAuthError(msg);
      setAuthLoading(false);
      setCheckingStoredToken(false);
      setIsAuthenticated(false);
      setToken(null);
    });

    rpc.on('credits-balance', (data: { balance: number | null; subscriptionPlanId?: string | null }) => {
      setCredits(data.balance ?? null);
      setCurrentPlanId(data.subscriptionPlanId ?? null);
    });

    // Refresh credits when user returns to the plugin (e.g. after Stripe checkout in another tab)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCredits();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    rpc.on('logout-complete', () => {
      setToken(null);
      setIsAuthenticated(false);
    });

    rpc.on('mascot-deleted', () => {
      // Reload mascots after deletion
      loadMascots();
    });

    rpc.on('delete-failed', (_data: { id?: string; type?: string; message?: string }) => {
      // Error already shown via figma.notify in code.ts; handler avoids "No handlers registered"
    });

    // Pose events: refetch poses for mascot when a pose is generated so Gallery shows it
    rpc.on('pose-generated', (data: { pose: any }) => {
      loadCredits();
      if (data?.pose?.mascotId) {
        rpc.send('get-mascot-poses', { mascotId: data.pose.mascotId });
      }
    });
    rpc.on('pose-status-update', () => {});

    rpc.on('mascot-poses-loaded', (data: { mascotId: string; poses: any[] }) => {
      const incoming = data.poses || [];
      setPoses((prev) => {
        const filtered = prev.filter((p) => p.mascotId !== data.mascotId);
        // Use server data only: never reuse old imageUrl/imageDataUrl (avoids showing pre-rembg image)
        return [...filtered, ...incoming];
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
      // Refetch after a short delay so backend has time to persist imageUrl
      if (pose.mascotId) {
        setTimeout(() => {
          rpc.send('get-mascot-poses', { mascotId: pose.mascotId });
        }, 1500);
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
      console.log('[App] Mascot generated:', data.mascot?.id, 'variations:', data.variations?.length ?? 0);

      // Single state update: store variations and add all of them to mascots list (avoid race / overwrite)
      if (data.variations && data.variations.length > 0) {
        console.log('[App] Storing', data.variations.length, 'variations in global state and mascots list');
        setGeneratedVariations(data.variations);
        setMascots((prev) => {
          const variationIds = new Set((data.variations ?? []).map(v => v.id));
          const others = prev.filter(m => !variationIds.has(m.id));
          const newMascots = [...(data.variations ?? []), ...others];
          console.log('[App] Mascots list after generation:', newMascots.length, '(3 variations at top)');
          return newMascots;
        });
        setSelectedMascot(data.variations[0] ?? data.mascot);
      } else if (data.mascot) {
        setGeneratedVariations([data.mascot]);
        setMascots((prev) => {
          const exists = prev.some(m => m.id === data.mascot.id);
          if (exists) return prev.map(m => m.id === data.mascot.id ? data.mascot : m);
          return [data.mascot, ...prev];
        });
        setSelectedMascot(data.mascot);
      }

      loadCredits();
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

    // Request stored token only after all handlers are registered (avoids "No handlers" after OAuth)
    rpc.send('ui-ready', {});
    rpc.send('get-stored-token');

    if (isAuthenticated) {
      loadMascots();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      rpc.cleanup();
    };
  }, []);

  const loadMascots = () => {
    console.log('[Mascoty] Loading mascots from API...');
    rpc.send('get-mascots');
  };

  const loadCredits = () => {
    rpc.send('get-credits');
  };

  const handleGoogleLogin = () => {
    rpc.send('open-google-auth', { url: `${API_ORIGIN}/api/v1/auth/google` });
  };

  const handleGoogleCodeSubmit = (code: string) => {
    setAuthError('');
    setAuthLoading(true);
    rpc.send('auth-exchange-code', { code });
  };

  const handleLogout = () => {
    rpc.send('logout');
  };

  const legalBase = `${API_ORIGIN}/api/v1/legal`;
  const openTerms = () => rpc.send('open-url', { url: `${legalBase}/terms` });
  const openPrivacy = () => rpc.send('open-url', { url: `${legalBase}/privacy` });

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onGoogleLogin={handleGoogleLogin}
        onGoogleCodeSubmit={handleGoogleCodeSubmit}
        onOpenTerms={openTerms}
        onOpenPrivacy={openPrivacy}
        authError={authError}
        authLoading={authLoading}
        checkingStoredToken={checkingStoredToken}
      />
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
            ✨ Mascot
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
            🙂 Custom
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
            🗂️ Gallery
          </button>
        </nav>
        
        {/* Separator and Account at bottom */}
        <div className="nav-menu-bottom">
          <div className="nav-separator"></div>
          <button
            className={`nav-item nav-item-account ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('account');
              loadCredits(); // refresh balance when opening Account (e.g. after returning from Stripe)
            }}
          >
            👤 Account
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
          <div style={{ display: activeTab === 'poses' ? 'block' : 'none' }} className="tab-panel">
            <PosesTab
              rpc={rpc}
              selectedMascot={selectedMascot}
              onSelectMascot={setSelectedMascot}
              mascots={mascots}
            />
          </div>
          <div style={{ display: activeTab === 'account' ? 'block' : 'none' }} className="tab-panel">
            <AccountTab rpc={rpc} credits={credits} currentPlanId={currentPlanId} onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
};
