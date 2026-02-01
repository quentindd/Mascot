import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';
import { UploadYourImage } from '../components/UploadYourImage';

interface LogosTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

/** Style selection for logo source image. */
const STYLE_OPTIONS = [
  { label: 'Avatar', value: 'avatar', hint: 'Face/head only' },
  { label: 'Full Body', value: 'fullBody', hint: 'Complete character' },
  { label: 'Square Icon', value: 'squareIcon', hint: 'Icon format' },
] as const;

export const LogosTab: React.FC<LogosTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [imageSource, setImageSource] = useState<string>('avatar');
  const [referenceAppPrompt, setReferenceAppPrompt] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [tertiaryColor, setTertiaryColor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLogo, setGeneratedLogo] = useState<{ id: string; url: string } | null>(null);

  React.useEffect(() => {
    console.log('[LogosTab] Mascots available:', mascots.length);
    console.log('[LogosTab] Selected mascot:', selectedMascot?.id || 'none');
  }, [mascots, selectedMascot]);

  rpc.on('logo-pack-generation-started', () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedLogo(null);
  });

  rpc.on('logo-pack-completed', (data: { logoPack: any }) => {
    setIsGenerating(false);
    console.log('[LogosTab] logo-pack-completed:', data.logoPack);
    if (data.logoPack?.sizes?.length > 0) {
      // Get the largest size (1024x1024)
      const largestSize = data.logoPack.sizes.find((s: any) => s.width === 1024) || data.logoPack.sizes[0];
      console.log('[LogosTab] Setting generated logo:', largestSize.url);
      setGeneratedLogo({ id: data.logoPack.id, url: largestSize.url });
    }
  });

  rpc.on('logo-pack-generated', () => {
    // Logo pack job started, keep showing loading state
    console.log('[LogosTab] logo-pack-generated (job started, waiting for completion...)');
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
    setError('Logo generation timed out. Check the Gallery tab later.');
  });

  const handleInsertLogo = () => {
    if (generatedLogo?.url) {
      rpc.send('insert-image', { url: generatedLogo.url, name: 'Logo 1024x1024' });
    }
  };

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
      imageSource: imageSource || 'avatar',
      stylePrompt: referenceAppPrompt.trim() || undefined,
    });
  };

  return (
    <div>
      <h2 className="select-mascot-step-title">Create a logo 🎨</h2>
      <p className="section-description">
        Choose mascot style, enter an app name for inspiration, and optional brand colors. Output: 1024×1024 px (iOS App Store).
      </p>

      {/* Upload only on selection page (no mascot chosen yet) */}
      {!selectedMascot && <UploadYourImage rpc={rpc} />}

      {mascots.length === 0 && (
        <div className="empty-state-content">
          <div className="empty-state-icon">Logos</div>
          <h3 className="empty-state-title">No mascots yet</h3>
          <p className="empty-state-text">
            Use your image above or create a mascot in the Character tab to generate logos.
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
        <label className="label">Mascot style</label>
        <div className="logo-platform-buttons">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={imageSource === opt.value ? 'quick-pose-btn active' : 'quick-pose-btn'}
              onClick={() => setImageSource(opt.value)}
              disabled={isGenerating}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="field-hint logo-hint">
          {STYLE_OPTIONS.find((o) => o.value === imageSource)?.hint ?? 'Select a style'}
        </p>

        <div className="logo-block-spaced">
          <label className="label">App style inspiration (optional)</label>
          <p className="field-hint">Just the app name, nothing else (e.g. &quot;Royal Match&quot;, &quot;Candy Crush&quot;, &quot;Clash of Clans&quot;).</p>
          <input
            className="input"
            type="text"
            placeholder="Royal Match"
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
          {isGenerating ? <span className="spinner" /> : 'Generate Logo (10 credits)'}
        </button>
      </div>

      {/* Logo Preview Section - only show when logo is ready */}
      {generatedLogo && (
        <div className="card logo-preview-card" style={{ marginTop: '16px' }}>
          <label className="label">Generated Logo</label>
          <div className="logo-preview-result">
            <div
              className="logo-preview-image"
              onClick={handleInsertLogo}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleInsertLogo()}
              title="Click to insert in Figma"
              style={{ cursor: 'pointer' }}
            >
              <img
                src={generatedLogo.url}
                alt="Generated Logo"
                style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
            </div>
            <p className="field-hint" style={{ textAlign: 'center', marginTop: '8px' }}>
              Click to insert in Figma (1024×1024)
            </p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
