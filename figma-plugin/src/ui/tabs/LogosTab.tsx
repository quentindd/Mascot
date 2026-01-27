import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';

interface LogosTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

export const LogosTab: React.FC<LogosTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    console.log('[LogosTab] Mascots available:', mascots.length);
    console.log('[LogosTab] Selected mascot:', selectedMascot?.id || 'none');
  }, [mascots, selectedMascot]);

  rpc.on('logo-generation-started', () => {
    setIsGenerating(true);
    setError(null);
  });

  rpc.on('logo-completed', () => {
    setIsGenerating(false);
  });

  rpc.on('logo-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  const handleGenerate = () => {
    if (!selectedMascot) {
      setError('Please select a mascot first');
      return;
    }

    rpc.send('generate-logo-pack', {
      mascotId: selectedMascot.id,
      brandColors: brandColors.length > 0 ? brandColors : undefined,
    });
  };

  // Show empty state if no mascots
  if (mascots.length === 0) {
    return (
      <div className="empty-state-content">
        <div className="empty-state-icon">Logos</div>
        <h3 className="empty-state-title">No mascots available</h3>
        <p className="empty-state-text">
          Create a mascot first to generate logo packs.
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
          Choose a mascot to create logo packs:
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

  // Show logo generation form
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
        <label className="label">Brand Colors (Optional)</label>
        <p className="field-hint">
          Enter hex colors separated by commas (e.g., #FF5733, #33FF57)
        </p>
        <input
          className="input"
          type="text"
          placeholder="#FF5733, #33FF57"
          value={brandColors.join(', ')}
          onChange={(e) => {
            const colors = e.target.value
              .split(',')
              .map(c => c.trim())
              .filter(c => c.startsWith('#'));
            setBrandColors(colors);
          }}
          disabled={isGenerating}
        />

        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMascot}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {isGenerating ? 'Generating...' : 'Generate Logo Pack'}
        </button>
      </div>
    </div>
  );
};
