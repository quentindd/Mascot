import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';
import { UploadYourImage } from '../components/UploadYourImage';

interface LogosTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

/** Platform selection for logo dimensions (App Store / Google Play / Web). */
const PLATFORM_OPTIONS = [
  { label: 'App Store', value: 'App Store', hint: '1024×1024 px' },
  { label: 'Google Play', value: 'Google Play', hint: '512×512 px' },
  { label: 'Web', value: 'Web', hint: '512×512, 192×192 px' },
] as const;

export const LogosTab: React.FC<LogosTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [platform, setPlatform] = useState<string>('');
  const [referenceAppPrompt, setReferenceAppPrompt] = useState('');
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
      imageSource: 'avatar',
      platform: platform.trim() || undefined,
      stylePrompt: referenceAppPrompt.trim() || undefined,
    });
  };

  return (
    <div>
      <h2 className="select-mascot-step-title">Create a logo 🎨</h2>
      <p className="section-description">
        Pick a platform for dimensions, add an app style inspiration (e.g. &quot;like Royal Match app&quot;) and optional brand colors. The AI will create the best logo from your mascot.
      </p>

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
                  {mascot.status === 'completed' && (mascot.avatarImageUrl || mascot.imageUrl || mascot.fullBodyImageUrl) ? (
                    <img
                      src={mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.imageUrl}
                      alt={mascot.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="mascot-selection-placeholder">
                      {mascot.status === 'completed' ? mascot.name.charAt(0).toUpperCase() : '…'}
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
      <div className="selected-mascot-preview logo-selected-preview">
        <div className="selected-mascot-image">
          {selectedMascot.status === 'completed' && (selectedMascot.avatarImageUrl || selectedMascot.imageUrl || selectedMascot.fullBodyImageUrl) ? (
            <img
              src={selectedMascot.fullBodyImageUrl || selectedMascot.avatarImageUrl || selectedMascot.imageUrl}
              alt={selectedMascot.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="selected-mascot-placeholder">
              {selectedMascot.status === 'completed' && selectedMascot.name?.charAt(0) ? selectedMascot.name.charAt(0).toUpperCase() : '…'}
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
        <div className="error logo-error-spacing">
          {error}
        </div>
      )}

      <div className="card logo-section-card">
        <label className="label">Platform (logo dimensions)</label>
        <div className="logo-platform-buttons">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={platform.trim() === opt.value ? 'quick-pose-btn active' : 'quick-pose-btn'}
              onClick={() => setPlatform(opt.value)}
              disabled={isGenerating}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {platform.trim() && (
          <p className="field-hint logo-hint">
            Output: {PLATFORM_OPTIONS.find((o) => o.value === platform.trim())?.hint ?? ''}
          </p>
        )}

        <div className="logo-block-spaced">
          <label className="label">Inspiration (optional)</label>
          <p className="field-hint">Example of an app style, e.g. &quot;like Royal Match app&quot;. The AI will create a logo in that style with your mascot.</p>
          <input
            className="input"
            type="text"
            placeholder="e.g. like Royal Match app"
            value={referenceAppPrompt}
            onChange={(e) => setReferenceAppPrompt(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <label className="label logo-label-spaced">Brand colors (optional)</label>
        <p className="field-hint">Primary, secondary, tertiary. Applied to the logo when possible.</p>
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
                value={primaryColor || '#888888'}
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
                value={secondaryColor || '#888888'}
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
                value={tertiaryColor || '#888888'}
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
          className="btn-primary logo-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMascot}
        >
          {isGenerating ? <span className="spinner" /> : 'Generate Logo Pack (10 credits)'}
        </button>
      </div>
        </>
      )}
    </div>
  );
};
