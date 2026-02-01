import React, { useState, useRef } from 'react';
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
  const [imageSource, setImageSource] = useState<'fullBody' | 'avatar' | 'squareIcon'>('avatar');
  const [platform, setPlatform] = useState<string>('');
  const [referenceLogoUrl, setReferenceLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [tertiaryColor, setTertiaryColor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const logoRefInputRef = useRef<HTMLInputElement>(null);

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

  rpc.on('logo-reference-url', (data: { url?: string }) => {
    if (data?.url) setReferenceLogoUrl(data.url);
    setIsUploadingRef(false);
  });
  rpc.on('logo-reference-error', (data: { message?: string }) => {
    setError(data?.message ?? 'Reference image upload failed.');
    setIsUploadingRef(false);
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
      platform: platform.trim() || undefined,
      referenceLogoUrl: referenceLogoUrl.trim() || undefined,
    });
  };

  return (
    <div>
      <h2 className="select-mascot-step-title">Create a logo 🎨</h2>
      <p className="section-description">
        Logos are created with the same model as your mascot. Paste an app/logo URL or upload a reference image for inspiration; the AI will use its style to create a unique logo. Pick a platform for dimensions, then generate your pack.
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
        <label className="label">Platform (logo dimensions)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={platform.trim() === opt.value ? 'quick-pose-btn active' : 'quick-pose-btn'}
              style={{ fontSize: '11px', padding: '8px 12px' }}
              onClick={() => setPlatform(opt.value)}
              disabled={isGenerating}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {platform.trim() && (
          <p className="field-hint" style={{ marginTop: '4px', marginBottom: '12px' }}>
            Output: {PLATFORM_OPTIONS.find((o) => o.value === platform.trim())?.hint ?? ''}
          </p>
        )}
        <label className="label">Inspiration for logo style (optional)</label>
        <p className="field-hint">Paste an app/logo URL or upload an image. The AI will use its style to create a unique logo.</p>
        <input
          className="input"
          type="url"
          placeholder="https://… (app or logo image URL)"
          value={referenceLogoUrl}
          onChange={(e) => setReferenceLogoUrl(e.target.value)}
          disabled={isGenerating}
          style={{ marginBottom: '8px' }}
        />
        <div className="logo-ref-upload-row">
          <span className="field-hint" style={{ margin: 0 }}>or</span>
          <input
            ref={logoRefInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !file.type.startsWith('image/')) return;
              setIsUploadingRef(true);
              setError(null);
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result;
                if (typeof result !== 'string') return;
                const base64 = result.indexOf('base64,') >= 0 ? result.split('base64,')[1] : result;
                rpc.send('upload-logo-reference-image', { base64 });
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn-secondary logo-ref-upload-btn"
            disabled={isGenerating || isUploadingRef}
            onClick={() => logoRefInputRef.current?.click()}
          >
            {isUploadingRef ? 'Uploading…' : 'Upload image'}
          </button>
        </div>

        <label className="label">Logo style</label>
        <p className="field-hint">Style of the logo, e.g. Avatar, Full body, Square icon</p>
        <select
          className="input"
          value={imageSource}
          onChange={(e) => setImageSource(e.target.value as 'fullBody' | 'avatar' | 'squareIcon')}
          disabled={isGenerating}
          style={{ marginBottom: '12px' }}
        >
          <option value="avatar">Avatar (portrait)</option>
          <option value="fullBody">Full body</option>
          <option value="squareIcon">Square icon</option>
        </select>

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
          className="btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMascot}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {isGenerating ? <span className="spinner" /> : 'Generate Logo Pack (10 credits)'}
        </button>
      </div>
        </>
      )}
    </div>
  );
};
