import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';
import { UploadYourImage } from '../components/UploadYourImage';

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
  const [imageSource, setImageSource] = useState<'fullBody' | 'avatar' | 'squareIcon'>('avatar');
  const [background, setBackground] = useState<'transparent' | 'white' | 'brand'>('transparent');
  const [referenceLogoUrl, setReferenceLogoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    console.log('[LogosTab] Mascots available:', mascots.length);
    console.log('[LogosTab] Selected mascot:', selectedMascot?.id || 'none');
  }, [mascots, selectedMascot]);

  rpc.on('logo-pack-generation-started', () => {
    setIsGenerating(true);
    setError(null);
  });

  rpc.on('logo-pack-completed', () => {
    setIsGenerating(false);
  });

  rpc.on('logo-pack-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data?.error ?? 'Generation failed');
  });

  rpc.on('logo-pack-generation-timeout', () => {
    setIsGenerating(false);
    setError('Logo pack generation timed out. Check the Gallery tab later.');
  });

  const handleGenerate = () => {
    if (!selectedMascot) {
      setError('Please select a mascot first');
      return;
    }

    rpc.send('generate-logo-pack', {
      mascotId: selectedMascot.id,
      brandColors: brandColors.length > 0 ? brandColors : undefined,
      imageSource,
      background,
      referenceLogoUrl: referenceLogoUrl.trim() || undefined,
    });
  };

  return (
    <div>
      <UploadYourImage rpc={rpc} />

      {mascots.length === 0 && (
        <div className="empty-state-content">
          <div className="empty-state-icon">Logos</div>
          <h3 className="empty-state-title">No mascots yet</h3>
          <p className="empty-state-text">
            Use your image above or create a mascot in the Character tab to generate logo packs.
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
        <label className="label">Image source</label>
        <p className="field-hint">Which mascot image to use for the logo</p>
        <select
          className="input"
          value={imageSource}
          onChange={(e) => setImageSource(e.target.value as 'fullBody' | 'avatar' | 'squareIcon')}
          disabled={isGenerating}
          style={{ marginBottom: '12px' }}
        >
          <option value="fullBody">Full body</option>
          <option value="avatar">Avatar (portrait)</option>
          <option value="squareIcon">Square icon</option>
        </select>

        <label className="label">Reference logo (optional)</label>
        <p className="field-hint">
          Paste a direct image URL (PNG/JPEG/WebP). AI will adapt your mascot logo to match this style.
        </p>
        <input
          className="input"
          type="url"
          placeholder="https://… (logo image URL)"
          value={referenceLogoUrl}
          onChange={(e) => setReferenceLogoUrl(e.target.value)}
          disabled={isGenerating}
          style={{ marginBottom: '12px' }}
        />

        <label className="label">Background</label>
        <p className="field-hint">Transparent, white, or your brand color</p>
        <select
          className="input"
          value={background}
          onChange={(e) => setBackground(e.target.value as 'transparent' | 'white' | 'brand')}
          disabled={isGenerating}
          style={{ marginBottom: '12px' }}
        >
          <option value="transparent">Transparent</option>
          <option value="white">White</option>
          <option value="brand">Brand color (use first color below)</option>
        </select>

        <label className="label">Brand Colors (Optional)</label>
        <p className="field-hint">
          Enter hex colors separated by commas (e.g., #FF5733, #33FF57). Used for &quot;Brand color&quot; background.
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
          {isGenerating ? <span className="spinner" /> : 'Generate Logo Pack'}
        </button>
      </div>
        </>
      )}
    </div>
  );
};
