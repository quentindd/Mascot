import React, { useState, useEffect, useMemo } from 'react';
import { RPCClient } from '../rpc/client';

function sortByCreatedAtDesc<T extends { createdAt?: string | Date | null; id?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta; // newest first
  });
}

interface GalleryTabProps {
  rpc: RPCClient;
  mascots: any[];
  animations: any[];
  logos: any[];
  poses: any[];
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
}

type GalleryFilter = 'all' | 'mascots' | 'animations' | 'logos' | 'poses';

const TrashIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const GalleryTab: React.FC<GalleryTabProps> = ({
  rpc,
  mascots,
  animations,
  logos,
  poses,
  selectedMascot,
  onSelectMascot,
}) => {
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const sortedMascots = useMemo(() => sortByCreatedAtDesc(mascots), [mascots]);
  const sortedAnimations = useMemo(() => sortByCreatedAtDesc(animations), [animations]);
  const sortedLogos = useMemo(() => sortByCreatedAtDesc(logos), [logos]);
  const sortedPoses = useMemo(() => sortByCreatedAtDesc(poses), [poses]);
  const [loading, setLoading] = useState(false);
  const [animationModal, setAnimationModal] = useState<any | null>(null);
  const [linksCopied, setLinksCopied] = useState<'mp4' | 'webm' | null>(null);
  const [insertError, setInsertError] = useState<string | null>(null);
  const [showGetLinks, setShowGetLinks] = useState(false);
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);
  const [integrationTab, setIntegrationTab] = useState<'web' | 'ios' | 'android' | 'flutter' | 'react-native'>('web');
  const [codeCopied, setCodeCopied] = useState<string | null>(null);

  // Animations/logos are stored in App and updated via RPC; only UI-only events here

  rpc.on('animation-inserted', () => {
    setInsertError(null);
    setAnimationModal(null);
  });

  rpc.on('animation-deleted', (data: { animationId?: string; id?: string }) => {
    setAnimationModal(null);
    setLinksCopied(null);
    setShowGetLinks(false);
    setShowIntegrationPanel(false);
    console.log('[GalleryTab] Animation deleted:', data.animationId ?? data.id);
  });

  rpc.on('error', (data: { message?: string; context?: string }) => {
    if (data.context === 'insert-animation' && data.message) {
      setInsertError(data.message);
    }
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

  const handleDeletePose = (e: React.MouseEvent, poseId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this pose? This action cannot be undone.')) {
      rpc.send('delete-pose', { id: poseId });
    }
  };

  const renderMascots = () => {
    if (sortedMascots.length === 0) {
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
        {sortedMascots.map((mascot) => (
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
              <TrashIcon size={14} />
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

  const renderAnimations = () => {
    if (sortedAnimations.length === 0) {
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
        {sortedAnimations.map((animation) => (
          <div 
            key={animation.id} 
            className="gallery-item"
            onClick={() => {
              if (animation.status === 'completed') {
                setInsertError(null);
                setLinksCopied(null);
                setShowGetLinks(false);
                setShowIntegrationPanel(false);
                setAnimationModal(animation);
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
              <TrashIcon size={14} />
            </button>
            <div className="gallery-item-image gallery-item-image--animation">
              {(() => {
                const mascot = mascots.find((m) => m.id === animation.mascotId);
                const mascotImageUrl = mascot?.fullBodyImageUrl || mascot?.avatarImageUrl || mascot?.imageUrl;
                return mascotImageUrl ? (
                  <img
                    src={mascotImageUrl}
                    alt={getMascotName(animation.mascotId)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : animation.spriteSheetUrl ? (
                  <img
                    src={animation.spriteSheetUrl}
                    alt={animation.action || 'Animation'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="gallery-placeholder">
                    {animation.status === 'completed' ? 'VID' : '...'}
                  </div>
                );
              })()}
            </div>
            <div className="gallery-item-info">
              <div className="gallery-item-title">{animation.action || 'Animation'}</div>
              <div className="gallery-item-meta">
                {getMascotName(animation.mascotId)} - {animation.status || 'pending'}
                {animation.status === 'completed' && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Click to preview video & insert
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
    console.log('[GalleryTab] Logo pack deleted:', data.id);
  });

  const renderLogos = () => {
    if (sortedLogos.length === 0) {
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
        {sortedLogos.map((logoPack) => (
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
              <TrashIcon size={14} />
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

  const renderPoses = () => {
    if (sortedPoses.length === 0) {
      return (
        <div className="empty-state-content">
          <div className="empty-state-icon">Poses</div>
          <h3 className="empty-state-title">No poses yet</h3>
          <p className="empty-state-text">
            Create poses from the Poses tab.
          </p>
        </div>
      );
    }

    return (
      <div className="gallery-grid">
        {sortedPoses.map((pose) => (
          <div
            key={pose.id}
            className="gallery-item"
            onClick={() => {
              if (pose.status === 'completed' && (pose.imageUrl || pose.imageDataUrl)) {
                const imageUrl = pose.imageUrl || pose.imageDataUrl;
                const mascotName = getMascotName(pose.mascotId);
                rpc.send('insert-image', {
                  url: imageUrl,
                  name: `${mascotName} - ${pose.prompt || 'Pose'}`,
                });
              }
            }}
            style={{
              cursor: pose.status === 'completed' && (pose.imageUrl || pose.imageDataUrl) ? 'pointer' : 'default',
              position: 'relative',
            }}
          >
            <button
              className="delete-btn"
              onClick={(e) => handleDeletePose(e, pose.id)}
              title="Delete pose"
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
              <TrashIcon size={14} />
            </button>
            <div className="gallery-item-image">
              {(pose.imageUrl || pose.imageDataUrl) ? (
                <img
                  src={pose.imageUrl || pose.imageDataUrl}
                  alt={pose.prompt || 'Pose'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="gallery-placeholder">
                  {pose.status === 'completed' ? 'POSE' : '...'}
                </div>
              )}
            </div>
            <div className="gallery-item-info">
              <div className="gallery-item-title">{pose.prompt || 'Pose'}</div>
              <div className="gallery-item-meta">
                {getMascotName(pose.mascotId)} - {pose.status || 'pending'}
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
        <button
          className={`filter-btn ${filter === 'poses' ? 'active' : ''}`}
          onClick={() => setFilter('poses')}
        >
          Poses ({poses.length})
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
                {poses.length > 0 && (
                  <div className="gallery-section">
                    <h3 className="gallery-section-title">Poses</h3>
                    {renderPoses()}
                  </div>
                )}
                {mascots.length === 0 && animations.length === 0 && logos.length === 0 && poses.length === 0 && (
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
            {filter === 'poses' && renderPoses()}
          </>
        )}
      </div>

      {animationModal && animationModal.status === 'completed' && (
        <div
          className="animation-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => { setAnimationModal(null); setLinksCopied(null); setInsertError(null); setShowGetLinks(false); setShowIntegrationPanel(false); }}
        >
          <div
            className="animation-modal"
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: title + close */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '16px 16px 12px',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                  {animationModal.action || 'Animation'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280' }}>
                  {getMascotName(animationModal.mascotId)} · Transparent video
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setAnimationModal(null); setLinksCopied(null); setInsertError(null); setShowGetLinks(false); setShowIntegrationPanel(false); }}
                style={{
                  border: 'none',
                  background: '#f3f4f6',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151',
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Video preview: tout en blanc (conteneur + zones autour de la vidéo) */}
            {(animationModal.webmVideoUrl || animationModal.movVideoUrl) && (
              <div
                style={{
                  background: '#ffffff',
                  margin: '0 16px 16px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  aspectRatio: '16/9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  src={animationModal.webmVideoUrl || animationModal.movVideoUrl}
                  poster={animationModal.spriteSheetUrl || undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                  }}
                  onLoadedData={(e) => e.currentTarget.play().catch(() => {})}
                />
              </div>
            )}

            {/* Content: light background, cards stacked like reference */}
            <div style={{ padding: '0 16px 16px', background: '#f9fafb' }}>
              {/* Available Formats */}
              <div style={{
                marginBottom: '12px',
                padding: '16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#111' }}>
                    <span style={{ opacity: 0.7 }}>⬇</span> Available Formats
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      onClick={() => {
                        const url = animationModal.movVideoUrl || animationModal.webmVideoUrl;
                        if (url) rpc.send('open-url', { url });
                      }}
                    >
                      Export
                    </button>
                    <button
                      type="button"
                      style={{
                        fontSize: '11px',
                        padding: '6px 10px',
                        background: '#ea580c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                      onClick={() => setShowGetLinks(!showGetLinks)}
                    >
                      Get Links
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {animationModal.movVideoUrl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#111' }}>Video</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Original MP4</div>
                      </div>
                      <a href={animationModal.movVideoUrl} target="_blank" rel="noopener noreferrer" download className="btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}>
                        Download
                      </a>
                    </div>
                  )}
                  {animationModal.webmVideoUrl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#111' }}>Transparent Video for Android/Chrome</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>WebM VP9</div>
                      </div>
                      <a href={animationModal.webmVideoUrl} target="_blank" rel="noopener noreferrer" download className="btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}>
                        Download
                      </a>
                    </div>
                  )}
                  {animationModal.movVideoUrl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#111' }}>Transparent Video for Safari/iOS</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>HEVC .mov transparent video</div>
                      </div>
                      <a href={animationModal.movVideoUrl} target="_blank" rel="noopener noreferrer" download className="btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}>
                        Download
                      </a>
                    </div>
                  )}
                </div>
                {showGetLinks && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {animationModal.movVideoUrl && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '8px 12px' }}
                        onClick={() => {
                          if (navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(animationModal.movVideoUrl);
                            setLinksCopied('mp4');
                            setTimeout(() => setLinksCopied(null), 2000);
                          }
                        }}
                      >
                        {linksCopied === 'mp4' ? '✓ MP4 link copied' : 'Copy MP4 link'}
                      </button>
                    )}
                    {animationModal.webmVideoUrl && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '8px 12px' }}
                        onClick={() => {
                          if (navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(animationModal.webmVideoUrl);
                            setLinksCopied('webm');
                            setTimeout(() => setLinksCopied(null), 2000);
                          }
                        }}
                      >
                        {linksCopied === 'webm' ? '✓ WebM link copied' : 'Copy WebM link'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Actions — third card, buttons in a row like reference */}
              <div style={{
                padding: '16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#111' }}>
                  Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '11px', padding: '10px 14px', flex: '1 1 auto', minWidth: 0 }}
                    onClick={() => {
                      const url = animationModal.movVideoUrl || animationModal.webmVideoUrl;
                      if (url) rpc.send('open-url', { url });
                    }}
                  >
                    <span>⬇</span> Download
                  </button>
                  {animationModal.metadata?.frameUrls?.length ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '11px', padding: '10px 14px', flex: '1 1 auto', minWidth: 0 }}
                      onClick={() => {
                        setInsertError(null);
                        rpc.send('insert-animation', { animationId: animationModal.id, animation: animationModal });
                      }}
                    >
                      <span>🖼</span> Insert in Figma
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '11px', padding: '10px 14px', flex: '1 1 auto', minWidth: 0 }}
                    onClick={() => setShowIntegrationPanel(!showIntegrationPanel)}
                  >
                    <span style={{ fontSize: '12px' }}>&lt; / &gt;</span> Integration
                  </button>
                  <button
                    type="button"
                    onClick={() => rpc.send('delete-animation', { animationId: animationModal.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                      fontSize: '11px',
                      padding: '10px 14px',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      color: '#dc2626',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      flex: '1 1 auto',
                      minWidth: 0,
                    }}
                  >
                    <span>🗑</span> Delete
                  </button>
                </div>
                {insertError && (
                  <p style={{ fontSize: '11px', color: '#dc2626', margin: '10px 0 0', padding: '6px 8px', background: '#fef2f2', borderRadius: '6px' }}>
                    {insertError}
                  </p>
                )}
              </div>
            </div>

            {/* Integration panel: tabs Web / iOS / Android / Flutter / React Native + code snippets */}
            {showIntegrationPanel && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {(['web', 'ios', 'android', 'flutter', 'react-native'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setIntegrationTab(tab); setCodeCopied(null); }}
                      style={{
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontWeight: 500,
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        background: integrationTab === tab ? '#111' : '#fff',
                        color: integrationTab === tab ? '#fff' : '#374151',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab === 'react-native' ? 'React Native' : tab === 'ios' ? 'iOS' : tab === 'android' ? 'Android' : tab === 'web' ? 'Web' : 'Flutter'}
                    </button>
                  ))}
                </div>
                {integrationTab === 'web' && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>React (TSX)</div>
                    <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '140px', margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {`export function TransparentVideo() {
  return (
    <video autoPlay loop muted playsInline>
      {/* Safari/iOS uses HEVC, others use WebM */}
      <source src="${animationModal.movVideoUrl || ''}" type="video/mp4" />
      <source src="${animationModal.webmVideoUrl || ''}" type="video/webm" />
    </video>
  );
}`}
                    </pre>
                    <button type="button" className="btn-secondary" style={{ fontSize: '10px', padding: '6px 10px', marginBottom: '12px' }} onClick={() => { if (navigator.clipboard?.writeText) { const code = `export function TransparentVideo() {\n  return (\n    <video autoPlay loop muted playsInline>\n      <source src="${animationModal.movVideoUrl || ''}" type="video/mp4" />\n      <source src="${animationModal.webmVideoUrl || ''}" type="video/webm" />\n    </video>\n  );\n}`; navigator.clipboard.writeText(code); setCodeCopied('web-react'); setTimeout(() => setCodeCopied(null), 2000); } }}>
                      {codeCopied === 'web-react' ? '✓ Copied' : 'Copy'}
                    </button>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Vanilla HTML</div>
                    <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '120px', margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {`<video autoplay loop muted playsinline>\n  <source src="${animationModal.movVideoUrl || ''}" type="video/mp4" />\n  <source src="${animationModal.webmVideoUrl || ''}" type="video/webm" />\n</video>`}
                    </pre>
                    <button type="button" className="btn-secondary" style={{ fontSize: '10px', padding: '6px 10px' }} onClick={() => { if (navigator.clipboard?.writeText) { const code = `<video autoplay loop muted playsinline>\n  <source src="${animationModal.movVideoUrl || ''}" type="video/mp4" />\n  <source src="${animationModal.webmVideoUrl || ''}" type="video/webm" />\n</video>`; navigator.clipboard.writeText(code); setCodeCopied('web-html'); setTimeout(() => setCodeCopied(null), 2000); } }}>
                      {codeCopied === 'web-html' ? '✓ Copied' : 'Copy'}
                    </button>
                  </>
                )}
                {integrationTab === 'ios' && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Swift (AVPlayer)</div>
                    <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '200px', margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {`import AVFoundation\nimport AVKit\n\nclass TransparentVideoView: UIView {\n  private var player: AVPlayer?\n  private var playerLayer: AVPlayerLayer?\n\n  func play(url: URL) {\n    // HEVC with alpha is natively supported on iOS\n    player = AVPlayer(url: url)\n    playerLayer = AVPlayerLayer(player: player)\n    playerLayer?.videoGravity = .resizeAspect\n    playerLayer?.frame = bounds\n    layer.addSublayer(playerLayer!)\n    player?.play()\n  }\n}\n\n// Usage: use MP4/HEVC URL for Safari/iOS\n// ${animationModal.movVideoUrl || 'YOUR_VIDEO_URL'}`}
                    </pre>
                    <button type="button" className="btn-secondary" style={{ fontSize: '10px', padding: '6px 10px' }} onClick={() => { if (navigator.clipboard?.writeText) { const code = `import AVFoundation\nimport AVKit\n\nclass TransparentVideoView: UIView {\n  private var player: AVPlayer?\n  private var playerLayer: AVPlayerLayer?\n\n  func play(url: URL) {\n    player = AVPlayer(url: url)\n    playerLayer = AVPlayerLayer(player: player)\n    playerLayer?.videoGravity = .resizeAspect\n    playerLayer?.frame = bounds\n    layer.addSublayer(playerLayer!)\n    player?.play()\n  }\n}\n// URL: ${animationModal.movVideoUrl || ''}`; navigator.clipboard.writeText(code); setCodeCopied('ios'); setTimeout(() => setCodeCopied(null), 2000); } }}>
                      {codeCopied === 'ios' ? '✓ Copied' : 'Copy'}
                    </button>
                  </>
                )}
                {integrationTab === 'android' && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Kotlin (ExoPlayer)</div>
                    <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '160px', margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {`// Use WebM VP9 for Android (transparent)\n// URL: ${animationModal.webmVideoUrl || 'YOUR_WEBM_URL'}\n\n// ExoPlayer with alpha support - use build.gradle:\n// implementation "com.google.android.exoplayer:exoplayer:2.x.x"\n// In your View: PlayerView + MediaItem.fromUri(videoUrl)`}
                    </pre>
                    <button type="button" className="btn-secondary" style={{ fontSize: '10px', padding: '6px 10px' }} onClick={() => { if (navigator.clipboard?.writeText) { const code = `// WebM VP9 URL for Android: ${animationModal.webmVideoUrl || ''}`; navigator.clipboard.writeText(code); setCodeCopied('android'); setTimeout(() => setCodeCopied(null), 2000); } }}>
                      {codeCopied === 'android' ? '✓ Copied' : 'Copy'}
                    </button>
                  </>
                )}
                {integrationTab === 'flutter' && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Dart (video_player)</div>
                    <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '160px', margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {`// MP4: ${animationModal.movVideoUrl || ''}\n// WebM: ${animationModal.webmVideoUrl || ''}\n\n// Use video_player or chewie. Platform: iOS -> MP4, Android -> WebM\nVideoPlayer(controller)\n  ..setLooping(true)\n  ..play();`}
                    </pre>
                    <button type="button" className="btn-secondary" style={{ fontSize: '10px', padding: '6px 10px' }} onClick={() => { if (navigator.clipboard?.writeText) { const code = `// MP4 (iOS): ${animationModal.movVideoUrl || ''}\n// WebM (Android): ${animationModal.webmVideoUrl || ''}`; navigator.clipboard.writeText(code); setCodeCopied('flutter'); setTimeout(() => setCodeCopied(null), 2000); } }}>
                      {codeCopied === 'flutter' ? '✓ Copied' : 'Copy'}
                    </button>
                  </>
                )}
                {integrationTab === 'react-native' && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Streaming from URL</div>
                    <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '10px', borderRadius: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '200px', margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {`import { Platform, StyleSheet, View } from 'react-native';\nimport Video from 'react-native-video';\n\nexport function TransparentVideo() {\n  const videoUrl = Platform.select({\n    ios: '${animationModal.movVideoUrl || ''}',\n    android: '${animationModal.webmVideoUrl || ''}',\n  });\n  return (\n    <View style={styles.container}>\n      <Video source={{ uri: videoUrl }} style={styles.video} repeat resizeMode="contain" />\n    </View>\n  );\n}`}
                    </pre>
                    <button type="button" className="btn-secondary" style={{ fontSize: '10px', padding: '6px 10px' }} onClick={() => { if (navigator.clipboard?.writeText) { const code = `import { Platform, StyleSheet, View } from 'react-native';\nimport Video from 'react-native-video';\n\nexport function TransparentVideo() {\n  const videoUrl = Platform.select({\n    ios: '${animationModal.movVideoUrl || ''}',\n    android: '${animationModal.webmVideoUrl || ''}',\n  });\n  return (\n    <View style={styles.container}>\n      <Video source={{ uri: videoUrl }} style={styles.video} repeat resizeMode="contain" />\n    </View>\n  );\n}`; navigator.clipboard.writeText(code); setCodeCopied('rn'); setTimeout(() => setCodeCopied(null), 2000); } }}>
                      {codeCopied === 'rn' ? '✓ Copied' : 'Copy'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Replicate link (optional) */}
            {animationModal.metadata?.replicatePredictionUrl && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f3f4f6' }}>
                <a
                  href={animationModal.metadata.replicatePredictionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}
                >
                  View run on Replicate →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
