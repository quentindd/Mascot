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
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('kawaii');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  rpc.on('mascot-generation-started', () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
  });

  rpc.on('mascot-generated', (data: { mascot: any }) => {
    setIsGenerating(false);
    setSuccess(`Mascot "${data.mascot.name}" generated successfully!`);
    setName('');
    setPrompt('');
    onMascotGenerated();
    console.log('[Mascot] Mascot generated:', data.mascot);
  });

  rpc.on('mascot-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  const handleGenerate = () => {
    if (!name.trim() || !prompt.trim()) {
      setError('Please fill in all fields');
      return;
    }

    rpc.send('generate-mascot', {
      name,
      prompt,
      style,
    });
  };

  return (
    <div>
      <h3 className="card-title">Generate New Mascot</h3>

      <label className="label">Name</label>
      <input
        className="input"
        type="text"
        placeholder="My Mascot"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isGenerating}
      />

      <label className="label">Prompt</label>
      <textarea
        className="input"
        rows={3}
        placeholder="A friendly robot with big eyes, wearing a blue hat..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isGenerating}
      />

      <label className="label">Style</label>
      <select
        className="select"
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        disabled={isGenerating}
      >
        <option value="kawaii">Kawaii</option>
        <option value="cartoon">Cartoon</option>
        <option value="flat">Flat</option>
        <option value="pixel">Pixel</option>
        <option value="3d">3D</option>
        <option value="match_brand">Match Brand</option>
      </select>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{ width: '100%', marginTop: '8px' }}
      >
        {isGenerating ? 'Generating...' : 'Generate Mascot (1 credit)'}
      </button>

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
