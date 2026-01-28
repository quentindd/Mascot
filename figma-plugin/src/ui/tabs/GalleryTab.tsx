import React, { useState, useEffect } from 'react';
import { RPCClient } from '../rpc/client';

interface GalleryTabProps {
  rpc: RPCClient;
  mascots: any[];
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
}

type GalleryFilter = 'all' | 'mascots' | 'animations' | 'logos';

export const GalleryTab: React.FC<GalleryTabProps> = ({
  rpc,
  mascots,
  selectedMascot,
  onSelectMascot,
}) => {
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [animations, setAnimations] = useState<any[]>([]);
  const [logos, setLogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debug: log mascots when component updates
  React.useEffect(() => {
    console.log('[GalleryTab] Mascots received:', mascots.length);
    if (mascots.length > 0) {
      console.log('[GalleryTab] First mascot:', { id: mascots[0].id, name: mascots[0].name });
    }
  }, [mascots]);

  useEffect(() => {
    loadAnimations();
    loadLogos();
  }, [mascots]);

  const loadAnimations = async () => {
    setLoading(true);
    try {
      const allAnimations: any[] = [];
      for (const mascot of mascots) {
        try {
          rpc.send('get-mascot-animations', { mascotId: mascot.id });
        } catch (error) {
          console.error(`[Gallery] Error loading animations for mascot ${mascot.id}:`, error);
        }
      }
      // Animations will be loaded via RPC callback
    } catch (error) {
      console.error('[Gallery] Error loading animations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogos = async () => {
    setLoading(true);
    try {
      for (const mascot of mascots) {
        try {
          rpc.send('get-mascot-logos', { mascotId: mascot.id });
        } catch (error) {
          console.error(`[Gallery] Error loading logos for mascot ${mascot.id}:`, error);
        }
      }
      // Logos will be loaded via RPC callback
    } catch (error) {
      console.error('[Gallery] Error loading logos:', error);
    } finally {
      setLoading(false);
    }
  };

  rpc.on('mascot-animations-loaded', (data: { mascotId: string; animations: any[] }) => {
    setAnimations((prev) => {
      const filtered = prev.filter(a => a.mascotId !== data.mascotId);
      return [...filtered, ...data.animations];
    });
  });

  rpc.on('mascot-logos-loaded', (data: { mascotId: string; logos: any[] }) => {
    setLogos((prev) => {
      const filtered = prev.filter(l => l.mascotId !== data.mascotId);
      return [...filtered, ...data.logos];
    });
  });

  const getMascotName = (id: string) => {
    const mascot = mascots.find(m => m.id === id);
    return mascot?.name || 'Unknown';
  };

  const handleDeleteMascot = (e: React.MouseEvent, mascotId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this mascot? This action cannot be undone.')) {
      rpc.send('delete-mascot', { id: mascotId });
    }
  };

  rpc.on('mascot-deleted', (data: { id: string }) => {
    // Mascots will be reloaded automatically by App.tsx
    console.log('[GalleryTab] Mascot deleted:', data.id);
  });

  const renderMascots = () => {
    if (mascots.length === 0) {
      return (
        <div className="empty-state-content">
          <div className="empty-state-icon">Gallery</div>
          <h3 className="empty-state-title">No mascots yet</h3>
          <p className="empty-state-text">
            Create your first mascot to get started!
          </p>
        </div>
      );
    }

    return (
      <div className="gallery-grid">
        {mascots.map((mascot) => (
          <div
            key={mascot.id}
            className={`gallery-item ${selectedMascot?.id === mascot.id ? 'selected' : ''}`}
            onClick={() => {
              console.log('[GalleryTab] Mascot clicked, inserting into Figma:', mascot.id, mascot.name);
              // Insert mascot image directly into Figma
              const imageUrl = mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl;
              if (imageUrl) {
                rpc.send('insert-image', {
                  url: imageUrl,
                  name: mascot.name || 'Mascot',
                });
              } else {
                console.warn('[GalleryTab] No image URL available for mascot:', mascot.id);
              }
            }}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <button
              className="delete-btn"
              onClick={(e) => handleDeleteMascot(e, mascot.id)}
              title="Delete mascot"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              ×
            </button>
            <div className="gallery-item-image">
              {(mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl) ? (
                <img
                  src={mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl}
                  alt={mascot.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="gallery-placeholder">
                  {mascot.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="gallery-item-info">
              <div className="gallery-item-title">{mascot.name}</div>
              <div className="gallery-item-meta">Mascot - {mascot.style || 'default'}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleDeleteAnimation = (e: React.MouseEvent, animationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this animation? This action cannot be undone.')) {
      rpc.send('delete-animation', { id: animationId });
    }
  };

  rpc.on('animation-deleted', (data: { id: string }) => {
    setAnimations((prev) => prev.filter(a => a.id !== data.id));
    console.log('[GalleryTab] Animation deleted:', data.id);
  });

  const renderAnimations = () => {
    if (animations.length === 0) {
      return (
        <div className="empty-state-content">
          <div className="empty-state-icon">Animate</div>
          <h3 className="empty-state-title">No animations yet</h3>
          <p className="empty-state-text">
            Create animations from the Animate tab.
          </p>
        </div>
      );
    }

    return (
      <div className="gallery-grid">
        {animations.map((animation) => (
          <div 
            key={animation.id} 
            className="gallery-item"
            onClick={() => {
              // Insert animation into Figma when clicked
              if (animation.status === 'completed') {
                rpc.send('insert-animation', { 
                  animationId: animation.id,
                  animation: animation 
                });
              } else {
                console.log('[Gallery] Animation not ready yet, status:', animation.status);
              }
            }}
            style={{ cursor: animation.status === 'completed' ? 'pointer' : 'default', position: 'relative' }}
          >
            <button
              className="delete-btn"
              onClick={(e) => handleDeleteAnimation(e, animation.id)}
              title="Delete animation"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              ×
            </button>
            <div className="gallery-item-image">
              {animation.webmVideoUrl ? (
                <video
                  src={animation.webmVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : animation.spriteSheetUrl ? (
                <img
                  src={animation.spriteSheetUrl}
                  alt={animation.action}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="gallery-placeholder">
                  {animation.status === 'completed' ? 'VID' : '...'}
                </div>
              )}
            </div>
            <div className="gallery-item-info">
              <div className="gallery-item-title">{animation.action || 'Animation'}</div>
              <div className="gallery-item-meta">
                {getMascotName(animation.mascotId)} - {animation.status || 'pending'}
                {animation.status === 'completed' && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Click to insert in Figma
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleDeleteLogoPack = (e: React.MouseEvent, logoPackId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this logo pack? This action cannot be undone.')) {
      rpc.send('delete-logo-pack', { id: logoPackId });
    }
  };

  rpc.on('logo-pack-deleted', (data: { id: string }) => {
    setLogos((prev) => prev.filter(l => l.id !== data.id));
    console.log('[GalleryTab] Logo pack deleted:', data.id);
  });

  const renderLogos = () => {
    if (logos.length === 0) {
      return (
        <div className="empty-state-content">
          <div className="empty-state-icon">Logos</div>
          <h3 className="empty-state-title">No logo packs yet</h3>
          <p className="empty-state-text">
            Create logo packs from the Logos tab.
          </p>
        </div>
      );
    }

    return (
      <div className="gallery-grid">
        {logos.map((logoPack) => (
          <div key={logoPack.id} className="gallery-item" style={{ position: 'relative' }}>
            <button
              className="delete-btn"
              onClick={(e) => handleDeleteLogoPack(e, logoPack.id)}
              title="Delete logo pack"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              ×
            </button>
            <div className="gallery-item-image">
              {logoPack.sizes && logoPack.sizes.length > 0 ? (
                <img
                  src={logoPack.sizes[0].url}
                  alt="Logo pack"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="gallery-placeholder">
                  {logoPack.status === 'completed' ? 'LOGO' : '...'}
                </div>
              )}
            </div>
            <div className="gallery-item-info">
              <div className="gallery-item-title">Logo Pack</div>
              <div className="gallery-item-meta">
                {getMascotName(logoPack.mascotId)} - {logoPack.sizes?.length || 0} sizes
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="gallery-tab">
      <div className="gallery-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'mascots' ? 'active' : ''}`}
          onClick={() => setFilter('mascots')}
        >
          Mascots ({mascots.length})
        </button>
        <button
          className={`filter-btn ${filter === 'animations' ? 'active' : ''}`}
          onClick={() => setFilter('animations')}
        >
          Animations ({animations.length})
        </button>
        <button
          className={`filter-btn ${filter === 'logos' ? 'active' : ''}`}
          onClick={() => setFilter('logos')}
        >
          Logos ({logos.length})
        </button>
      </div>

      <div className="gallery-content">
        {loading && (
          <div className="loading">Loading gallery...</div>
        )}
        {!loading && (
          <>
            {filter === 'all' && (
              <>
                {mascots.length > 0 && (
                  <div className="gallery-section">
                    <h3 className="gallery-section-title">Mascots</h3>
                    {renderMascots()}
                  </div>
                )}
                {animations.length > 0 && (
                  <div className="gallery-section">
                    <h3 className="gallery-section-title">Animations</h3>
                    {renderAnimations()}
                  </div>
                )}
                {logos.length > 0 && (
                  <div className="gallery-section">
                    <h3 className="gallery-section-title">Logo Packs</h3>
                    {renderLogos()}
                  </div>
                )}
                {mascots.length === 0 && animations.length === 0 && logos.length === 0 && (
                  <div className="empty-state-content">
                    <div className="empty-state-icon">Gallery</div>
                    <h3 className="empty-state-title">Your gallery is empty</h3>
                    <p className="empty-state-text">
                      Start by creating your first mascot!
                    </p>
                  </div>
                )}
              </>
            )}
            {filter === 'mascots' && renderMascots()}
            {filter === 'animations' && renderAnimations()}
            {filter === 'logos' && renderLogos()}
          </>
        )}
      </div>
    </div>
  );
};
