import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';
import { UploadYourImage } from '../components/UploadYourImage';

interface LogosTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

/** Quick app style options for logo — one line, no parentheses. */
const APP_STYLE_OPTIONS = [
  { label: 'App Store', value: 'App Store' },
  { label: 'Google Play', value: 'Google Play' },
  { label: 'Web', value: 'Web' },
] as const;

export const LogosTab: React.FC<LogosTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [imageSource, setImageSource] = useState<'fullBody' | 'avatar' | 'squareIcon'>('avatar');
  const [stylePrompt, setStylePrompt] = useState('');
  const [referenceLogoUrl, setReferenceLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [tertiaryColor, setTertiaryColor] = useState('');
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

  rpc.on('error', (data: { message?: string; context?: string }) => {
    if (data.context === 'generate-logo-pack') {
      setIsGenerating(false);
      setError(data.message ?? 'Generation failed');
    }
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

    const brandColors = [primaryColor, secondaryColor, tertiaryColor]
      .map((c) => c.trim())
      .filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c));

    rpc.send('generate-logo-pack', {
      mascotId: selectedMascot.id,
      brandColors: brandColors.length > 0 ? brandColors : undefined,
      imageSource,
      stylePrompt: stylePrompt.trim() || undefined,
      referenceLogoUrl: referenceLogoUrl.trim() || undefined,
    });
  };

  return (
    <div>
      {/* Upload only on selection page (no mascot chosen yet) */}
      {!selectedMascot && <UploadYourImage rpc={rpc} />}

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

        <label className="label">Copy the style of an existing app (optional)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {APP_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={stylePrompt.trim() === opt.value ? 'quick-pose-btn active' : 'quick-pose-btn'}
              style={{ fontSize: '11px', padding: '8px 12px' }}
              onClick={() => setStylePrompt(opt.value)}
              disabled={isGenerating}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          className="input"
          type="text"
          placeholder="Or type a style (e.g. minimal web app)"
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          disabled={isGenerating}
          style={{ marginBottom: '12px' }}
        />

        <label className="label">Or paste a logo image URL to copy its style</label>
        <input
          className="input"
          type="url"
          placeholder="https://…"
          value={referenceLogoUrl}
          onChange={(e) => setReferenceLogoUrl(e.target.value)}
          disabled={isGenerating}
          style={{ marginBottom: '12px' }}
        />

        <label className="label" style={{ marginTop: '12px' }}>Brand Colors (Optional)</label>
        <p className="field-hint">Same as mascot creation — Primary, Secondary, Tertiary.</p>
        <div className="color-picker-group">
          <div className="color-picker-item">
            <div className="color-picker-header">
              <span className="color-picker-label">Primary</span>
              {primaryColor && (
                <button
                  type="button"
                  className="color-picker-clear"
                  onClick={() => setPrimaryColor('')}
                  disabled={isGenerating}
                  title="Clear color"
                >
                  ×
                </button>
              )}
            </div>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={primaryColor || '#000000'}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={isGenerating}
                className="color-picker-input"
              />
              <input
                type="text"
                placeholder="#FF5733"
                value={primaryColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) setPrimaryColor(val);
                }}
                disabled={isGenerating}
                className="color-picker-text"
              />
            </div>
          </div>
          <div className="color-picker-item">
            <div className="color-picker-header">
              <span className="color-picker-label">Secondary</span>
              {secondaryColor && (
                <button
                  type="button"
                  className="color-picker-clear"
                  onClick={() => setSecondaryColor('')}
                  disabled={isGenerating}
                  title="Clear color"
                >
                  ×
                </button>
              )}
            </div>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={secondaryColor || '#000000'}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={isGenerating}
                className="color-picker-input"
              />
              <input
                type="text"
                placeholder="#33C3FF"
                value={secondaryColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) setSecondaryColor(val);
                }}
                disabled={isGenerating}
                className="color-picker-text"
              />
            </div>
          </div>
          <div className="color-picker-item">
            <div className="color-picker-header">
              <span className="color-picker-label">Tertiary</span>
              {tertiaryColor && (
                <button
                  type="button"
                  className="color-picker-clear"
                  onClick={() => setTertiaryColor('')}
                  disabled={isGenerating}
                  title="Clear color"
                >
                  ×
                </button>
              )}
            </div>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={tertiaryColor || '#000000'}
                onChange={(e) => setTertiaryColor(e.target.value)}
                disabled={isGenerating}
                className="color-picker-input"
              />
              <input
                type="text"
                placeholder="#FFD700"
                value={tertiaryColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) setTertiaryColor(val);
                }}
                disabled={isGenerating}
                className="color-picker-text"
              />
            </div>
          </div>
        </div>

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
