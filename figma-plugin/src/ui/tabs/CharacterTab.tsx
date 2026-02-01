import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RPCClient } from '../rpc/client';

/** Art style options with emoji (value = backend enum). */
const ART_STYLES = [
  { value: 'kawaii', emoji: '🌸', label: 'Kawaii' },
  { value: 'minimal', emoji: '◻️', label: 'Minimal' },
  { value: '3d_pixar', emoji: '🎬', label: '3D Pixar' },
  { value: '3d', emoji: '💎', label: '3D' },
  { value: 'cartoon', emoji: '🎨', label: 'Cartoon' },
  { value: 'flat', emoji: '🟦', label: 'Flat' },
  { value: 'pixel', emoji: '👾', label: 'Pixel' },
  { value: 'hand_drawn', emoji: '✏️', label: 'Hand Drawn' },
] as const;

/** Personality options with emoji (value = backend enum). */
const PERSONALITY_OPTIONS = [
  { value: 'friendly', emoji: '😊', label: 'Friendly' },
  { value: 'professional', emoji: '💼', label: 'Professional' },
  { value: 'playful', emoji: '😜', label: 'Playful' },
  { value: 'cool', emoji: '😎', label: 'Cool' },
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
] as const;

/** Mascot type options with emoji (value = backend enum). */
const MASCOT_TYPES = [
  { value: 'auto', emoji: '✨', label: 'Auto-detect' },
  { value: 'animal', emoji: '🐾', label: 'Animal' },
  { value: 'creature', emoji: '🐲', label: 'Creature' },
  { value: 'robot', emoji: '🤖', label: 'Robot' },
  { value: 'food', emoji: '🍕', label: 'Food' },
  { value: 'object', emoji: '📦', label: 'Object' },
  { value: 'abstract', emoji: '💫', label: 'Abstract' },
] as const;

interface CharacterTabProps {
  rpc: RPCClient;
  mascots: any[];
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  onMascotGenerated: () => void;
  generatedVariations?: any[];
  onVariationsChange?: (variations: any[]) => void;
}

export const CharacterTab: React.FC<CharacterTabProps> = ({
  rpc,
  mascots,
  selectedMascot,
  onSelectMascot,
  onMascotGenerated,
  generatedVariations: propGeneratedVariations = [],
  onVariationsChange,
}) => {
  // Basic fields
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('kawaii');
  
  // New fields
  const [type, setType] = useState('auto');
  const [personality, setPersonality] = useState('friendly');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [tertiaryColor, setTertiaryColor] = useState('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Use prop variations if provided, otherwise use local state
  const [localVariations, setLocalVariations] = useState<any[]>([]);
  const generatedVariations = propGeneratedVariations.length > 0 ? propGeneratedVariations : localVariations;
  
  const setGeneratedVariations = (variations: any[]) => {
    if (onVariationsChange) {
      onVariationsChange(variations);
    } else {
      setLocalVariations(variations);
    }
  };
  
  // Debug: log mascots when component updates
  useEffect(() => {
    console.log('[CharacterTab] Mascots prop updated:', mascots.length, 'mascots');
    if (mascots.length > 0) {
      console.log('[CharacterTab] First 3 mascot IDs:', mascots.slice(0, 3).map(m => ({ id: m.id, name: m.name })));
    }
  }, [mascots]);

  // Sync variations with mascots list: when Gallery (or any refetch) has loaded mascots with images,
  // use those URLs so the Mascot tab shows images instead of spinners.
  const displayVariations = useMemo(() => {
    return generatedVariations.map((v) => {
      const fromList = mascots.find((m) => m.id === v.id);
      if (fromList && (fromList.fullBodyImageUrl || fromList.avatarImageUrl || fromList.squareIconUrl)) {
        return {
          ...v,
          fullBodyImageUrl: fromList.fullBodyImageUrl ?? v.fullBodyImageUrl,
          avatarImageUrl: fromList.avatarImageUrl ?? v.avatarImageUrl,
          squareIconUrl: fromList.squareIconUrl ?? v.squareIconUrl,
        };
      }
      return v;
    });
  }, [generatedVariations, mascots]);

  // When mascots list brings in images for our variations, update success/error
  useEffect(() => {
    if (displayVariations.length === 0) return;
    const allHaveImages = displayVariations.every(
      (v) => v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl
    );
    if (allHaveImages && (success?.includes('generating') || success?.includes('Waiting for images'))) {
      setSuccess(`Created ${displayVariations.length} variations! Select one below.`);
      setError(null);
    }
  }, [displayVariations, success]);

  rpc.on('mascot-generation-started', () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    // Only clear if we're managing local state
    if (!onVariationsChange) {
      setLocalVariations([]);
    } else {
      onVariationsChange([]);
    }
  });

  rpc.on('mascot-generated', async (data: { mascot: any; variations?: any[] }) => {
    setIsGenerating(false);
    if (data.variations && data.variations.length > 0) {
      console.log('[Mascot] Received variations:', data.variations);
      console.log('[Mascot] Checking for images in variations...');
      
      // Check if images are already available
      const hasImages = data.variations.some(v => v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
      console.log('[Mascot] Has images:', hasImages);
      
      setGeneratedVariations(data.variations);
      
      // Poll for images if they're not ready yet
      const batchId = data.variations[0]?.batchId;
      console.log('[Mascot] BatchId:', batchId);
      
      if (batchId) {
        if (hasImages) {
          setSuccess(`Created ${data.variations.length} variations! Select one below.`);
        } else {
          setSuccess(`Created ${data.variations.length} variations! Waiting for images...`);
          // Start polling immediately
          pollForVariationImages(batchId);
        }
      } else {
        if (hasImages) {
          setSuccess(`Created ${data.variations.length} variations! Select one below.`);
        } else {
          setSuccess(`Created ${data.variations.length} variations! Images are being generated...`);
        }
      }
    } else {
      setSuccess(`Mascot "${data.mascot.name}" created successfully!`);
    }
    onMascotGenerated();
    console.log('[Mascot] Mascot generated:', data);
  });

  rpc.on('mascot-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  // Use ref to track polling timeout so we can clear it
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const currentBatchIdRef = useRef<string | null>(null);

  // Poll for variation images
  const pollForVariationImages = (batchId: string) => {
    const maxAttempts = 180; // 15 minutes max (increased significantly for 3 variations that may take longer)
    pollingAttemptsRef.current = 0;
    currentBatchIdRef.current = batchId;

    console.log('[Mascot] Starting to poll for batch variations:', batchId);
    console.log('[Mascot] Will poll for up to', maxAttempts, 'attempts (15 minutes)');

    const poll = () => {
      // Check if we've moved to a new batch
      if (currentBatchIdRef.current !== batchId) {
        console.log('[Mascot] Batch changed, stopping old polling');
        return;
      }

      if (pollingAttemptsRef.current >= maxAttempts) {
        console.error('[Mascot] Polling timeout after', pollingAttemptsRef.current, 'attempts');
        setError('Images are taking longer than expected. Some variations may still be generating. Please check back later.');
        // Don't stop polling completely - continue in background
        return;
      }

      console.log(`[Mascot] Polling attempt ${pollingAttemptsRef.current + 1}/${maxAttempts} for batch:`, batchId);
      rpc.send('get-batch-variations', { batchId });
      pollingAttemptsRef.current++;
      
      // Continue polling after 5 seconds
      pollingTimeoutRef.current = setTimeout(poll, 5000);
    };

    // Start immediately, then poll every 5 seconds
    poll();
  };

  // Stop polling when component unmounts or when all variations have images
  const stopPolling = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    currentBatchIdRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Listen for batch variations updates
  rpc.on('batch-variations-loaded', (data: { variations: any[] }) => {
    console.log('[Mascot] Batch variations loaded:', data.variations ? data.variations.length : 0);
    if (data.variations && data.variations.length > 0) {
      // Check if all variations have images
      const allHaveImages = data.variations.every(v => {
        const hasImage = !!(v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
        return hasImage;
      });
      const someHaveImages = data.variations.some(v => {
        const hasImage = !!(v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
        return hasImage;
      });
      const readyCount = data.variations.filter(v => v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl).length;
      
      console.log('[Mascot] All variations have images:', allHaveImages);
      console.log('[Mascot] Some variations have images:', someHaveImages);
      console.log('[Mascot] Ready variations:', readyCount, '/', data.variations.length);
      
      // Log each variation's image status
      data.variations.forEach((v, idx) => {
        const hasImage = !!(v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
        console.log(`[Mascot] Variation ${idx + 1} (${v.id}): hasImage=${hasImage}, fullBody=${!!v.fullBodyImageUrl}, avatar=${!!v.avatarImageUrl}, image=${!!v.imageUrl}`);
      });
      
      // Always update the variations (even if images aren't ready yet)
      setGeneratedVariations(data.variations);
      
      // Variations are now stored in global state, no need to update local mascots here
      
      if (allHaveImages) {
        // All variations are ready - stop polling
        stopPolling();
        setSuccess(`Created ${data.variations.length} variations! Select one below.`);
      } else if (someHaveImages) {
        // Some have images - allow selection but continue polling for the rest
        // Don't stop polling - keep checking for remaining variations
        setSuccess(`Created ${data.variations.length} variations! ${readyCount}/${data.variations.length} ready. Select one below or wait for others...`);
        // Continue polling - don't stop even if some have images
      } else {
        // Still waiting for images - continue polling
        setSuccess(`Created ${data.variations.length} variations! Images are being generated...`);
      }
    }
  });

  const handleGenerate = () => {
    if (!name.trim() || !prompt.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const brandColors: any = {};
    if (primaryColor) brandColors.primary = primaryColor;
    if (secondaryColor) brandColors.secondary = secondaryColor;
    if (tertiaryColor) brandColors.tertiary = tertiaryColor;

    rpc.send('generate-mascot', {
      name,
      prompt,
      style,
      type,
      personality,
      negativePrompt: negativePrompt || undefined,
      brandColors: Object.keys(brandColors).length > 0 ? brandColors : undefined,
    });
  };

  const handleSelectVariation = (variation: any) => {
    console.log('[CharacterTab] Variation selected:', variation.id, variation.name);
    
    // Get the image URL (try fullBodyImageUrl first, then imageUrl, then avatarImageUrl)
    const imageUrl = variation.fullBodyImageUrl || variation.imageUrl || variation.avatarImageUrl;
    
    if (imageUrl) {
      // Insert image into Figma if we have an image
      rpc.send('insert-image', {
        url: imageUrl,
        name: variation.name || 'Mascot Variation'
      });
    } else {
      console.warn('[CharacterTab] Variation selected but no image URL yet:', variation.id);
    }
    
    // Select the variation
    onSelectMascot(variation);
    
    // Notify App.tsx to add this mascot to the list
    // This ensures it appears in "Existing Mascots" and can be used in Animations/Logos tabs
    console.log('[CharacterTab] Sending add-mascot-to-list for variation:', variation.id);
    rpc.send('add-mascot-to-list', { mascot: variation });
    
    // Add to mascots list immediately
    if (onMascotGenerated) {
      // The parent will handle adding to mascots list
    }
    
    // Also reload mascots from API to ensure consistency (this will update the list automatically)
    setTimeout(() => {
      rpc.send('get-mascots');
    }, 500);
    
    // DON'T clear the variations - let the user see all variations and continue polling
    // Keep variations in global state so they persist across tab changes
    setName('');
    setPrompt('');
    setNegativePrompt('');
    setPrimaryColor('');
    setSecondaryColor('');
    setTertiaryColor('');
    setSuccess(imageUrl ? 'Mascot selected and added to Existing Mascots! You can now use it in Animations or Logos tabs. Other variations are still generating...' : 'Mascot selected and added to Existing Mascots! Image is still generating, but you can use it in Animations or Logos tabs. Other variations are still generating...');
  };

  return (
    <div>
      <h2 className="select-mascot-step-title">Create new mascot ✨</h2>
      <p className="section-description">
        Create a new mascot with AI. Fill in the details below to generate 3 variations.
      </p>

      {/* Basic Fields */}
      <label className="label">Name *</label>
      <input
        className="input"
        type="text"
        placeholder="My Mascot"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isGenerating}
      />

      <label className="label">Character Details *</label>
      <textarea
        className="input"
        rows={3}
        placeholder="A friendly robot with big eyes, wearing a blue hat..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isGenerating}
      />

      {/* Art Style */}
          <label className="label">Art Style</label>
          <select
            className="select select-with-emoji"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            disabled={isGenerating}
          >
            {ART_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>

          {/* Mascot Type */}
          <label className="label">Mascot Type</label>
          <select
            className="select select-with-emoji"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isGenerating}
          >
            {MASCOT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>

          {/* Personality */}
          <label className="label">Personality</label>
          <select
            className="select select-with-emoji"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            disabled={isGenerating}
          >
            {PERSONALITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.emoji} {p.label}
              </option>
            ))}
          </select>

          {/* Negative Prompt */}
          <label className="label">Exclude (Optional)</label>
          <input
            className="input"
            type="text"
            placeholder="no text, no scary elements, no human faces..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            disabled={isGenerating}
          />

          {/* Brand Colors */}
          <label className="label" style={{ marginTop: '12px' }}>Brand Colors (Optional)</label>
          <div className="color-picker-group">
            <div className="color-picker-item">
              <div className="color-picker-header">
                <span className="color-picker-label">Primary</span>
                {primaryColor && (
                  <button
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
                    if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setPrimaryColor(val);
                    }
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
                    if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setSecondaryColor(val);
                    }
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
                    if (val === '' || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setTertiaryColor(val);
                    }
                  }}
                  disabled={isGenerating}
                  className="color-picker-text"
                />
              </div>
            </div>
          </div>

      {error && <div className="error" style={{ marginTop: '12px' }}>{error}</div>}
      {success && <div className="success" style={{ marginTop: '12px' }}>{success}</div>}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{ width: '100%', marginTop: '12px' }}
      >
        {isGenerating ? <span className="spinner" /> : 'Create (1 credit · 3 variations)'}
      </button>

      {/* Created Variations */}
      {generatedVariations.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 className="section-title">Select a Variation</h3>
          <p className="section-description">
            The {generatedVariations.length} variations are in your Gallery. Select one to insert into your design or use in Animations, Logos or Poses.
          </p>
          <div className="variations-grid">
            {displayVariations.map((variation, index) => (
              <div
                key={variation.id || index}
                className={`variation-card ${selectedMascot?.id === variation.id ? 'selected' : ''}`}
                onClick={() => handleSelectVariation(variation)}
              >
                <div className="variation-image">
                  {(variation.fullBodyImageUrl || variation.avatarImageUrl || variation.imageUrl) ? (
                    <img
                      src={variation.fullBodyImageUrl || variation.avatarImageUrl || variation.imageUrl}
                      alt={variation.name || `Variation ${index + 1}`}
                      onError={(e) => {
                        console.error('[Mascot] Failed to load image for variation', index + 1, ':', variation.id);
                        console.error('[Mascot] Image URLs:', {
                          fullBody: variation.fullBodyImageUrl,
                          avatar: variation.avatarImageUrl,
                          image: variation.imageUrl
                        });
                        const placeholder = e.currentTarget.parentElement?.querySelector('.variation-placeholder') as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('[Mascot] Successfully loaded image for variation', index + 1, ':', variation.id);
                      }}
                    />
                  ) : (
                    <div className="variation-placeholder variation-loading-wrap">
                      <div className="spinner" />
                      <div className="variation-loading-subtext">Variation {index + 1}</div>
                    </div>
                  )}
                </div>
                <div className="variation-number">Variation {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
