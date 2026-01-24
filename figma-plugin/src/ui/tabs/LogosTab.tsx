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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  rpc.on('logo-pack-generation-started', () => {
    setIsGenerating(true);
    setError(null);
  });

  rpc.on('logo-pack-completed', () => {
    setIsGenerating(false);
  });

  rpc.on('logo-pack-generation-failed', (data: { error: string }) => {
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
    });
  };

  if (!selectedMascot && mascots.length > 0) {
    return (
      <div>
        <p className="loading">Select a mascot to generate logo pack</p>
        <div style={{ marginTop: '12px' }}>
          {mascots.map((mascot) => (
            <div
              key={mascot.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectMascot(mascot)}
            >
              {mascot.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedMascot) {
    return <p className="loading">Generate a mascot first in the Character tab</p>;
  }

  return (
    <div>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          Selected: {selectedMascot.name}
        </div>
        <button
          className="btn-secondary"
          onClick={() => onSelectMascot(null)}
          style={{ fontSize: '11px', padding: '4px 8px' }}
        >
          Change
        </button>
      </div>

      <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        Generate a complete logo pack with 15+ sizes including favicons, iOS, and
        Android app icons.
      </p>

      {error && <div className="error">{error}</div>}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{ width: '100%' }}
      >
        {isGenerating ? 'Generating...' : 'Generate Logo Pack (20 credits)'}
      </button>

      {isGenerating && (
        <div className="loading" style={{ marginTop: '16px' }}>
          Generating logo pack... This may take a few minutes.
        </div>
      )}
    </div>
  );
};
