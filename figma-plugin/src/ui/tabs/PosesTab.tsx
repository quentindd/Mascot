import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';
import { UploadYourImage } from '../components/UploadYourImage';

/** Quick pose options: buttonLabel = text on button, label = prompt sent to API. */
const QUICK_POSES = [
  { emoji: '👋', label: 'Welcome, waving to greet', buttonLabel: 'Welcome' },
  { emoji: '😄', label: 'Happy', buttonLabel: 'Happy' },
  { emoji: '🤔', label: 'Thinking', buttonLabel: 'Thinking' },
  { emoji: '💤', label: 'Idle', buttonLabel: 'Idle' },
  { emoji: '🎉', label: 'Celebrate', buttonLabel: 'Celebrate' },
  { emoji: '❓', label: 'Ask for help', buttonLabel: 'Help' },
  { emoji: '👍', label: 'Thumbs Up', buttonLabel: 'Thumbs Up' },
] as const;

interface PosesTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

export const PosesTab: React.FC<PosesTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPose, setGeneratedPose] = useState<any>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);

  React.useEffect(() => {
    console.log('[PosesTab] Mascots available:', mascots.length);
    console.log('[PosesTab] Selected mascot:', selectedMascot?.id || 'none');
  }, [mascots, selectedMascot]);

  rpc.on('pose-generation-started', () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPose(null);
  });

  rpc.on('pose-generated', (data: { pose: any }) => {
    if (data.pose) {
      setGeneratedPose(data.pose);
    }
  });

  rpc.on('pose-completed', (data: { pose: any }) => {
    setIsGenerating(false);
    if (data.pose) {
      setGeneratedPose(data.pose);
    }
  });

  rpc.on('pose-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  rpc.on('pose-deleted', (data: { id: string }) => {
    if (generatedPose && generatedPose.id === data.id) {
      setGeneratedPose(null);
    }
    console.log('[PosesTab] Pose deleted:', data.id);
  });

  rpc.on('image-inserted', () => {
    setIsInserting(false);
    setInsertError(null);
  });

  rpc.on('error', (data: { message?: string; context?: string }) => {
    if (data.context === 'insert-image') {
      setIsInserting(false);
      setInsertError(data.message || 'Failed to insert in Figma');
    }
  });

  const handleDeletePose = (poseId: string) => {
    if (confirm('Are you sure you want to delete this pose? This action cannot be undone.')) {
      rpc.send('delete-pose', { id: poseId });
    }
  };

  const handleGenerate = () => {
    if (!selectedMascot) {
      setError('Please select a mascot first');
      return;
    }

    if (!customPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    rpc.send('generate-pose', {
      mascotId: selectedMascot.id,
      prompt: customPrompt.trim(),
    });
  };

  return (
    <div>
      {/* Upload only on selection page (no mascot chosen yet) */}
      {!selectedMascot && <UploadYourImage rpc={rpc} />}

      {mascots.length === 0 && (
        <div className="empty-state-content">
          <div className="empty-state-icon">Poses</div>
          <h3 className="empty-state-title">No mascots yet</h3>
          <p className="empty-state-text">
            Use your image above or create a mascot in the Character tab to generate poses.
          </p>
        </div>
      )}

      {mascots.length > 0 && !selectedMascot && (
        <div className="select-mascot-step">
          <h2 className="select-mascot-step-title">Pick a mascot below 👇</h2>
          <div className="mascots-selection-grid">
            {mascots.map((mascot) => (
              <div
                key={mascot.id}
                className="mascot-selection-card"
                onClick={() => onSelectMascot(mascot)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectMascot(mascot)}
                aria-label={`Select ${mascot.name}`}
              >
                <div className="mascot-selection-image">
                  {(mascot.avatarImageUrl || mascot.imageUrl || mascot.fullBodyImageUrl) ? (
                    <img
                      src={mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl}
                      alt={mascot.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="mascot-selection-placeholder">
                      {mascot.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="mascot-selection-info">
                  <div className="mascot-selection-name">{mascot.name}</div>
                  <div className="mascot-selection-meta">{mascot.style || 'mascot'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mascots.length > 0 && selectedMascot && (
        <>
      {/* Selected Mascot Preview */}
      <div className="selected-mascot-preview">
        <div className="selected-mascot-image">
          {(selectedMascot.avatarImageUrl || selectedMascot.imageUrl || selectedMascot.fullBodyImageUrl) ? (
            <img
              src={selectedMascot.fullBodyImageUrl || selectedMascot.avatarImageUrl || selectedMascot.imageUrl}
              alt={selectedMascot.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="selected-mascot-placeholder">
              {selectedMascot.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="selected-mascot-details">
          <div className="selected-mascot-name">{selectedMascot.name}</div>
          <div className="selected-mascot-meta">{selectedMascot.style || 'mascot'}</div>
          <button
            className="btn-link"
            onClick={() => onSelectMascot(null)}
          >
            Change Mascot
          </button>
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '16px' }}>
        <label className="label">Quick poses</label>
        <p style={{ fontSize: '10px', color: '#666', marginBottom: '10px' }}>
          Choose a pose or type your own below.
        </p>
        <div className="quick-poses-grid">
          {QUICK_POSES.map(({ emoji, label, buttonLabel }) => (
            <button
              key={label}
              type="button"
              className={`quick-pose-btn ${customPrompt.trim() === label ? 'active' : ''}`}
              onClick={() => setCustomPrompt(label)}
              disabled={isGenerating}
              title={label}
            >
              <span className="quick-pose-emoji">{emoji}</span>
              <span className="quick-pose-label">{buttonLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <label className="label">Custom Prompt</label>
        <p style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>
          Describe the pose or modification you want for your mascot (e.g., "waving", "change color to blue", "smiling happily")
        </p>
        
        <textarea
          className="textarea"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g., waving hand, change color to blue, smiling..."
          disabled={isGenerating}
          style={{ 
            width: '100%', 
            minHeight: '60px',
            marginBottom: '12px',
            fontSize: '11px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMascot}
          style={{ width: '100%' }}
        >
          {isGenerating ? <span className="spinner" /> : 'Generate Pose (1 credit)'}
        </button>
      </div>

      {generatedPose && selectedMascot && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Generated Pose</h3>
            <button
              onClick={() => handleDeletePose(generatedPose.id)}
              title="Delete pose"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: 'none',
                background: '#ff4444',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div className="gallery-item" style={{ position: 'relative' }}>
              <div className="gallery-item-image">
                {(generatedPose.imageDataUrl || generatedPose.imageUrl) ? (
                  <img
                    src={generatedPose.imageDataUrl || generatedPose.imageUrl}
                    alt={generatedPose.prompt || 'Pose'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="gallery-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {isGenerating ? <span className="spinner" /> : (generatedPose.prompt || 'Pose')}
                  </div>
                )}
              </div>
              <div className="gallery-item-info">
                <div className="gallery-item-title">{generatedPose.prompt || 'Pose'}</div>
                <div className="gallery-item-meta">Ready</div>
              </div>
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={isInserting || !(generatedPose?.imageDataUrl || generatedPose?.imageUrl)}
            onClick={async () => {
              const imageUrl = generatedPose?.imageDataUrl || generatedPose?.imageUrl;
              if (!imageUrl) return;
              setInsertError(null);
              setIsInserting(true);
              const name = `${selectedMascot.name} - ${generatedPose.prompt || 'Pose'}`;
              rpc.send('insert-image', { url: imageUrl, name });
            }}
            style={{ width: '100%' }}
          >
            {isInserting ? 'Inserting…' : 'Insert in Figma'}
          </button>
          {insertError && (
            <p className="section-description" style={{ color: 'var(--color-error, #c00)', marginTop: 8, fontSize: 12 }}>
              {insertError}
            </p>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};
