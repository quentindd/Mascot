import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';

interface AnimationsTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

const ANIMATION_ACTIONS = [
  { value: 'wave', label: 'Wave' },
  { value: 'celebrate', label: 'Celebrate' },
  { value: 'think', label: 'Think' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'sad', label: 'Sad' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'backflip', label: 'Backflip' },
  { value: 'dance', label: 'Dance' },
  { value: 'jump', label: 'Jump' },
  { value: 'idle', label: 'Idle' },
];

export const AnimationsTab: React.FC<AnimationsTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [action, setAction] = useState('wave');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug: log mascots when component updates
  React.useEffect(() => {
    console.log('[AnimationsTab] Mascots available:', mascots.length);
    console.log('[AnimationsTab] Selected mascot:', selectedMascot?.id || 'none');
  }, [mascots, selectedMascot]);

  rpc.on('animation-generation-started', () => {
    setIsGenerating(true);
    setError(null);
  });

  rpc.on('animation-completed', () => {
    setIsGenerating(false);
  });

  rpc.on('animation-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  const handleGenerate = () => {
    if (!selectedMascot) {
      setError('Please select a mascot first');
      return;
    }

    rpc.send('generate-animation', {
      mascotId: selectedMascot.id,
      action,
    });
  };

  // Show empty state if no mascots
  if (mascots.length === 0) {
    return (
      <div className="empty-state-content">
        <div className="empty-state-icon">Animate</div>
        <h3 className="empty-state-title">No mascots available</h3>
        <p className="empty-state-text">
          Create a mascot first to generate animations.
        </p>
      </div>
    );
  }

  // Show mascot selection if none selected
  if (!selectedMascot) {
    return (
      <div className="select-mascot-step">
        <div className="select-mascot-step-badge">1</div>
        <h2 className="select-mascot-step-title">Choose a mascot to animate</h2>
        <p className="select-mascot-step-desc">
          Pick one mascot below. You’ll then choose an action (wave, celebrate, etc.) and generate an animation.
        </p>
        <p className="select-mascot-step-hint">Click a mascot to select it</p>
        <div className="mascots-selection-grid">
          {mascots.map((mascot) => (
            <div
              key={mascot.id}
              className="mascot-selection-card"
              onClick={() => onSelectMascot(mascot)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectMascot(mascot)}
              aria-label={`Select ${mascot.name ?? 'Unnamed'}`}
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
                    {(mascot.name && mascot.name.charAt(0)) ? mascot.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
              <div className="mascot-selection-info">
                <div className="mascot-selection-name">{mascot.name ?? 'Unnamed'}</div>
                <div className="mascot-selection-meta">{mascot.style || 'mascot'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show animation generation form
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
        <label className="label">Action</label>
        <select
          className="select"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          disabled={isGenerating}
        >
          {ANIMATION_ACTIONS.map((act) => (
            <option key={act.value} value={act.value}>
              {act.label}
            </option>
          ))}
        </select>

        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMascot}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {isGenerating ? <span className="spinner" /> : 'Generate Animation'}
        </button>
      </div>
    </div>
  );
};
