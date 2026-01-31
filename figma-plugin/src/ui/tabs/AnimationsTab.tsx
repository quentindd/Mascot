import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';
import { UploadYourImage } from '../components/UploadYourImage';

interface AnimationsTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

const ANIMATION_ACTIONS = [
  { value: 'wave', label: 'Wave', emoji: '👋' },
  { value: 'celebrate', label: 'Celebrate', emoji: '🎉' },
  { value: 'think', label: 'Think', emoji: '🤔' },
  { value: 'sleep', label: 'Sleep', emoji: '💤' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'exercise', label: 'Exercise', emoji: '💪' },
  { value: 'backflip', label: 'Backflip', emoji: '🤸' },
  { value: 'dance', label: 'Dance', emoji: '💃' },
  { value: 'jump', label: 'Jump', emoji: '⬆️' },
  { value: 'idle', label: 'Idle', emoji: '😌' },
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

  return (
    <div>
      {/* Upload only on selection page (no mascot chosen yet) */}
      {!selectedMascot && <UploadYourImage rpc={rpc} />}

      {/* Empty state if no mascots */}
      {mascots.length === 0 && (
        <div className="empty-state-content">
          <div className="empty-state-icon">Animate</div>
          <h3 className="empty-state-title">No mascots yet</h3>
          <p className="empty-state-text">
            Use your image above or create a mascot in the Character tab to generate animations.
          </p>
        </div>
      )}

      {/* Mascot selection if mascots exist but none selected */}
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
      )}

      {/* Animation generation form when mascot selected */}
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
        <label className="label">Action</label>
        <select
          className="select"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          disabled={isGenerating}
        >
          {ANIMATION_ACTIONS.map((act) => (
            <option key={act.value} value={act.value}>
              {act.emoji} {act.label}
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
        </>
      )}
    </div>
  );
};
