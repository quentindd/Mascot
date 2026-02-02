import React, { useState, useMemo } from 'react';
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
  poses: any[];
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
}

type GalleryFilter = 'all' | 'mascots' | 'poses';

const TrashIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const DownloadIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const openDownload = (url: string) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
};

export const GalleryTab: React.FC<GalleryTabProps> = ({
  rpc,
  mascots,
  poses,
  selectedMascot,
  onSelectMascot,
}) => {
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const sortedMascots = useMemo(() => sortByCreatedAtDesc(mascots), [mascots]);
  const sortedPoses = useMemo(() => sortByCreatedAtDesc(poses), [poses]);
  const [loading, setLoading] = useState(false);

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
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.delete-btn') || (e.target as HTMLElement).closest('.download-btn')) return;
              if (mascot.status !== 'completed') return;
              const imageUrl = mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl;
              if (imageUrl) {
                rpc.send('insert-image', { url: imageUrl, name: mascot.name || 'Mascot' });
              } else {
                console.warn('[GalleryTab] No image URL for mascot:', mascot.id);
              }
            }}
            style={{
              cursor: mascot.status === 'completed' && (mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl) ? 'pointer' : 'default',
              position: 'relative',
            }}
          >
            <button
              type="button"
              className="download-btn gallery-download-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (mascot.status !== 'completed') return;
                const url = mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl;
                if (url) openDownload(url);
              }}
              title={mascot.status === 'completed' ? 'Download mascot' : 'Generating…'}
              style={{
                position: 'absolute',
                top: '4px',
                right: '28px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <DownloadIcon size={14} />
            </button>
            <button
              type="button"
              className="delete-btn gallery-delete-btn"
              onPointerDown={(e) => e.stopPropagation()}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <TrashIcon size={14} />
            </button>
            <div className="gallery-item-image">
              {mascot.status === 'completed' && (mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl) ? (
                <img
                  src={mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl}
                  alt={mascot.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="gallery-placeholder gallery-placeholder-loading">
                  <span className="spinner" style={{ marginBottom: '4px' }} />
                  <span className="gallery-placeholder-text">Generating…</span>
                  {mascot.name && mascot.name.trim() && (
                    <span className="gallery-placeholder-name">{mascot.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              )}
            </div>
            <div className="gallery-item-info">
              <div className="gallery-item-title">{mascot.name || 'Mascot'}</div>
              <div className="gallery-item-meta">
                {mascot.status === 'completed' && (mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl)
                  ? `Mascot - ${mascot.style || 'default'}`
                  : `Variation ${mascot.variationIndex ?? ''} - generating`}
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
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.delete-btn') || (e.target as HTMLElement).closest('.download-btn')) return;
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
              type="button"
              className="download-btn gallery-download-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const url = pose.imageUrl || pose.imageDataUrl;
                if (url) openDownload(url);
              }}
              title="Download pose"
              style={{
                position: 'absolute',
                top: '4px',
                right: '28px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <DownloadIcon size={14} />
            </button>
            <button
              type="button"
              className="delete-btn gallery-delete-btn"
              onPointerDown={(e) => e.stopPropagation()}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <TrashIcon size={14} />
            </button>
            <div className="gallery-item-image">
              {pose.status === 'completed' && (pose.imageUrl || pose.imageDataUrl) ? (
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
      <h2 className="select-mascot-step-title">Gallery 🗂️</h2>
      <p className="section-description">
        All your mascots and poses in one place. Click to insert into Figma or download.
      </p>

      <div className="gallery-tab-body">
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
          className={`filter-btn ${filter === 'poses' ? 'active' : ''}`}
          onClick={() => setFilter('poses')}
        >
          Custom ({poses.length})
        </button>
      </div>

      <div className="gallery-content">
        {loading && (
          <div className="loading">
            <div className="spinner spinner--lg" />
          </div>
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
                {poses.length > 0 && (
                  <div className="gallery-section">
                    <h3 className="gallery-section-title">Custom</h3>
                    {renderPoses()}
                  </div>
                )}
                {mascots.length === 0 && poses.length === 0 && (
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
            {filter === 'poses' && renderPoses()}
          </>
        )}
      </div>
      </div>
    </div>
  );
};
