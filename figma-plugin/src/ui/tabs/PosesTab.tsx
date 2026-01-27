import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';

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

  React.useEffect(() => {
    console.log('[PosesTab] Mascots available:', mascots.length);
    console.log('[PosesTab] Selected mascot:', selectedMascot?.id || 'none');
  }, [mascots, selectedMascot]);

  rpc.on('pose-generation-started', () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPose(null);
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

  // Show empty state if no mascots
  if (mascots.length === 0) {
    return (
      <div className="empty-state-content">
        <div className="empty-state-icon">Poses</div>
        <h3 className="empty-state-title">No mascots available</h3>
        <p className="empty-state-text">
          Create a mascot first to generate poses.
        </p>
      </div>
    );
  }

  // Show mascot selection if none selected
  if (!selectedMascot) {
    return (
      <div>
        <h3 className="section-title">Select a Mascot</h3>
        <p className="section-description">
          Choose a mascot to create poses:
        </p>
        <div className="mascots-selection-grid">
          {mascots.map((mascot) => (
            <div
              key={mascot.id}
              className="mascot-selection-card"
              onClick={() => onSelectMascot(mascot)}
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
    );
  }

  // Show poses generation form
  return (
    <div>
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
          {isGenerating 
            ? 'Generating...' 
            : 'Generate Pose (1 credit)'}
        </button>
      </div>

      {generatedPose && (
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '12px' }}>Generated Pose</h3>
          <div style={{ marginBottom: '12px' }}>
            <div className="gallery-item">
              <div className="gallery-item-image">
                {generatedPose.imageUrl ? (
                  <img
                    src={generatedPose.imageUrl}
                    alt={generatedPose.prompt || 'Pose'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="gallery-placeholder">
                    {generatedPose.prompt || 'Pose'}
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
            onClick={() => {
              if (generatedPose.imageUrl) {
                rpc.send('insert-image', {
                  url: generatedPose.imageUrl,
                  name: `${selectedMascot.name} - ${generatedPose.prompt || 'Pose'}`,
                });
              }
            }}
            style={{ width: '100%' }}
          >
            Insert in Figma
          </button>
        </div>
      )}
    </div>
  );
};
