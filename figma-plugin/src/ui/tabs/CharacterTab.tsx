import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';

interface CharacterTabProps {
  rpc: RPCClient;
  mascots: any[];
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  onMascotGenerated: () => void;
}

export const CharacterTab: React.FC<CharacterTabProps> = ({
  rpc,
  mascots,
  selectedMascot,
  onSelectMascot,
  onMascotGenerated,
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
  
  // Auto-fill
  const [autoFillUrl, setAutoFillUrl] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<any[]>([]);

  rpc.on('mascot-generation-started', () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setGeneratedVariations([]);
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
          setSuccess(`Generated ${data.variations.length} variations! Select one below.`);
        } else {
          setSuccess(`Generated ${data.variations.length} variations! Waiting for images...`);
          // Start polling immediately
          pollForVariationImages(batchId);
        }
      } else {
        if (hasImages) {
          setSuccess(`Generated ${data.variations.length} variations! Select one below.`);
        } else {
          setSuccess(`Generated ${data.variations.length} variations! Images are being generated...`);
        }
      }
    } else {
      setSuccess(`Mascot "${data.mascot.name}" generated successfully!`);
    }
    onMascotGenerated();
    console.log('[Mascot] Mascot generated:', data);
  });

  rpc.on('mascot-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  rpc.on('auto-fill-complete', (data: any) => {
    setIsAutoFilling(false);
    setName(data.name || '');
    setPrompt(data.suggestedPrompt || data.description || '');
    setType(data.suggestedType || 'auto');
    if (data.brandColors) {
      setPrimaryColor(data.brandColors.primary || '');
      setSecondaryColor(data.brandColors.secondary || '');
      setTertiaryColor(data.brandColors.tertiary || '');
    }
    setSuccess('Auto-filled from URL!');
  });

  rpc.on('auto-fill-failed', (data: { error: string }) => {
    setIsAutoFilling(false);
    setError(data.error);
  });

  // Poll for variation images
  const pollForVariationImages = (batchId: string) => {
    const maxAttempts = 30; // 2.5 minutes max
    let attempts = 0;

    console.log('[Mascot] Starting to poll for batch variations:', batchId);

    const poll = () => {
      if (attempts >= maxAttempts) {
        console.error('[Mascot] Polling timeout after', attempts, 'attempts');
        setError('Images are taking longer than expected. Please refresh and try again.');
        return;
      }

      console.log(`[Mascot] Polling attempt ${attempts + 1}/${maxAttempts} for batch:`, batchId);
      rpc.send('get-batch-variations', { batchId });
      attempts++;
      
      // Continue polling after 5 seconds
      setTimeout(poll, 5000);
    };

    // Start immediately, then poll every 5 seconds
    poll();
  };

  // Listen for batch variations updates
  rpc.on('batch-variations-loaded', (data: { variations: any[] }) => {
    console.log('[Mascot] Batch variations loaded:', data.variations);
    if (data.variations && data.variations.length > 0) {
      // Check if all variations have images
      const allHaveImages = data.variations.every(v => v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
      console.log('[Mascot] All variations have images:', allHaveImages);
      console.log('[Mascot] Image URLs:', data.variations.map(v => ({
        id: v.id,
        fullBody: v.fullBodyImageUrl,
        avatar: v.avatarImageUrl,
        image: v.imageUrl
      })));
      
      // Always update the variations (even if images aren't ready yet)
      setGeneratedVariations(data.variations);
      
      if (allHaveImages) {
        setSuccess(`Generated ${data.variations.length} variations! Select one below.`);
      } else {
        // Still waiting for images - continue polling
        setSuccess(`Generated ${data.variations.length} variations! Images are being generated...`);
      }
    }
  });

  const handleAutoFill = () => {
    if (!autoFillUrl.trim()) {
      setError('Please enter a URL');
      return;
    }
    setIsAutoFilling(true);
    setError(null);
    rpc.send('auto-fill', { url: autoFillUrl });
  };

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
      autoFillUrl: autoFillUrl || undefined,
    });
  };

  const handleSelectVariation = (variation: any) => {
    // Get the image URL (try fullBodyImageUrl first, then imageUrl, then avatarImageUrl)
    const imageUrl = variation.fullBodyImageUrl || variation.imageUrl || variation.avatarImageUrl;
    
    if (!imageUrl) {
      setError('No image URL found for this variation. The image may still be generating. Please wait a moment and try again.');
      return;
    }

    // Insert image into Figma
    rpc.send('insert-image', {
      url: imageUrl,
      name: variation.name || 'Mascot Variation'
    });
    
    // Clear the form and variations immediately (image insertion happens in background)
    onSelectMascot(variation);
    setGeneratedVariations([]);
    setName('');
    setPrompt('');
    setNegativePrompt('');
    setPrimaryColor('');
    setSecondaryColor('');
    setTertiaryColor('');
    setAutoFillUrl('');
    setSuccess('Inserting image into Figma...');
  };

  return (
    <div>
      <h3 className="card-title">Generate New Mascot</h3>

      {/* Auto-fill Section */}
      <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f8f8', borderRadius: '4px' }}>
        <label className="label" style={{ marginBottom: '4px' }}>🔗 Auto-fill from URL (Optional)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            type="text"
            placeholder="App Store, Play Store, or website URL"
            value={autoFillUrl}
            onChange={(e) => setAutoFillUrl(e.target.value)}
            disabled={isGenerating || isAutoFilling}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={handleAutoFill}
            disabled={isGenerating || isAutoFilling}
            style={{ padding: '0 16px' }}
          >
            {isAutoFilling ? '...' : 'Fill'}
          </button>
        </div>
      </div>

      {/* Basic Fields */}
      <label className="label">✏️ Name *</label>
      <input
        className="input"
        type="text"
        placeholder="My Mascot"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isGenerating}
      />

      <label className="label">📝 Prompt *</label>
      <textarea
        className="input"
        rows={3}
        placeholder="A friendly robot with big eyes, wearing a blue hat..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isGenerating}
      />

      {/* Style */}
          <label className="label">🎨 Art Style</label>
          <select
            className="select"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            disabled={isGenerating}
          >
            <option value="kawaii">🎀 Kawaii</option>
            <option value="minimal">⚪ Minimal</option>
            <option value="3d_pixar">🎬 3D Pixar</option>
            <option value="3d">🎮 3D</option>
            <option value="cartoon">🎨 Cartoon</option>
            <option value="flat">🟦 Flat</option>
            <option value="pixel">👾 Pixel</option>
            <option value="hand_drawn">✏️ Hand Drawn</option>
            <option value="match_brand">🎯 Match Brand</option>
          </select>

          {/* Type */}
          <label className="label">🐾 Mascot Type</label>
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isGenerating}
          >
            <option value="auto">✨ Auto-detect</option>
            <option value="animal">🐾 Animal</option>
            <option value="creature">👻 Creature</option>
            <option value="robot">🤖 Robot</option>
            <option value="food">🍕 Food</option>
            <option value="object">💎 Object</option>
            <option value="abstract">🌀 Abstract</option>
          </select>

          {/* Personality */}
          <label className="label">😊 Personality</label>
          <select
            className="select"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            disabled={isGenerating}
          >
            <option value="friendly">😊 Friendly</option>
            <option value="professional">💼 Professional</option>
            <option value="playful">🎉 Playful</option>
            <option value="cool">😎 Cool</option>
            <option value="energetic">⚡ Energetic</option>
            <option value="calm">😌 Calm</option>
          </select>

          {/* Negative Prompt */}
          <label className="label">🚫 Exclude (Optional)</label>
          <input
            className="input"
            type="text"
            placeholder="no text, no scary elements, no human faces..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            disabled={isGenerating}
          />

          {/* Brand Colors */}
          <label className="label" style={{ marginTop: '12px' }}>🎨 Brand Colors (Optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <input
                className="input"
                type="text"
                placeholder="#FF5733"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={isGenerating}
                style={{ fontSize: '10px' }}
              />
              <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>Primary</div>
            </div>
            <div>
              <input
                className="input"
                type="text"
                placeholder="#33C3FF"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={isGenerating}
                style={{ fontSize: '10px' }}
              />
              <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>Secondary</div>
            </div>
            <div>
              <input
                className="input"
                type="text"
                placeholder="#FFD700"
                value={tertiaryColor}
                onChange={(e) => setTertiaryColor(e.target.value)}
                disabled={isGenerating}
                style={{ fontSize: '10px' }}
              />
              <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>Tertiary</div>
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
        {isGenerating ? 'Generating...' : 'Generate (1 credit for 3 variations)'}
      </button>

      {/* Generated Variations */}
      {generatedVariations.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#e3f2fd', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600 }}>
            Select a Variation:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {generatedVariations.map((variation, index) => (
              <div
                key={variation.id}
                onClick={() => handleSelectVariation(variation)}
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  border: '2px solid #18a0fb',
                  textAlign: 'center'
                }}
              >
                {variation.fullBodyImageUrl || variation.avatarImageUrl || variation.imageUrl ? (
                  <img
                    src={variation.fullBodyImageUrl || variation.avatarImageUrl || variation.imageUrl}
                    alt={`Variation ${index + 1}`}
                    style={{ width: '100%', height: 'auto', borderRadius: '4px', minHeight: '120px', objectFit: 'contain' }}
                    onError={(e) => {
                      console.error('[Mascot] Failed to load image:', variation.fullBodyImageUrl || variation.avatarImageUrl || variation.imageUrl);
                      // Show placeholder instead of hiding
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        e.currentTarget.style.display = 'none';
                        const placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                {!variation.fullBodyImageUrl && !variation.avatarImageUrl && !variation.imageUrl ? (
                  <div className="image-placeholder" style={{
                    width: '100%',
                    height: '120px',
                    background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#999',
                    border: '2px dashed #ccc'
                  }}>
                    <div style={{ marginBottom: '6px', fontSize: '20px' }}>⏳</div>
                    <div style={{ fontWeight: 500 }}>Generating...</div>
                    <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.7 }}>Please wait</div>
                  </div>
                ) : null}
                <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3 className="card-title">Existing Mascots</h3>
        {mascots.length === 0 ? (
          <p className="loading">No mascots yet. Generate one above!</p>
        ) : (
          <div>
            {mascots.map((mascot) => (
              <div
                key={mascot.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor:
                    selectedMascot?.id === mascot.id ? '#18a0fb' : '#e5e5e5',
                }}
                onClick={() => onSelectMascot(mascot)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {(mascot.avatarImageUrl || mascot.imageUrl) ? (
                    <img
                      src={mascot.avatarImageUrl || mascot.imageUrl}
                      alt={mascot.name}
                      style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => {
                        console.error('[Mascot] Failed to load image:', mascot.avatarImageUrl || mascot.imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '4px', 
                      background: '#18a0fb', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {mascot.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>
                      {mascot.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      {mascot.style} • {mascot.status || 'completed'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
