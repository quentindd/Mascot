import React, { useState } from 'react';
import { RPCClient } from '../rpc/client';

interface AnimationsTabProps {
  rpc: RPCClient;
  selectedMascot: any;
  onSelectMascot: (mascot: any) => void;
  mascots: any[];
}

const ANIMATION_ACTIONS = [
  { value: 'wave', label: 'Wave' },
  { value: 'celebrate', label: 'Celebrate' },
  { value: 'think', label: 'Think' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'sad', label: 'Sad' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'backflip', label: 'Backflip' },
  { value: 'dance', label: 'Dance' },
  { value: 'jump', label: 'Jump' },
  { value: 'idle', label: 'Idle' },
];

export const AnimationsTab: React.FC<AnimationsTabProps> = ({
  rpc,
  selectedMascot,
  onSelectMascot,
  mascots,
}) => {
  const [action, setAction] = useState('wave');
  const [resolution, setResolution] = useState(360);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  rpc.on('animation-generation-started', () => {
    setIsGenerating(true);
    setError(null);
  });

  rpc.on('animation-completed', () => {
    setIsGenerating(false);
  });

  rpc.on('animation-generation-failed', (data: { error: string }) => {
    setIsGenerating(false);
    setError(data.error);
  });

  const handleGenerate = () => {
    if (!selectedMascot) {
      setError('Please select a mascot first');
      return;
    }

    rpc.send('generate-animation', {
      mascotId: selectedMascot.id,
      action,
      resolution,
    });
  };

  if (!selectedMascot && mascots.length > 0) {
    return (
      <div>
        <p className="loading">Select a mascot to generate animations</p>
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

      <label className="label">Action</label>
      <select
        className="select"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        disabled={isGenerating}
      >
        {ANIMATION_ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      <label className="label">Resolution</label>
      <select
        className="select"
        value={resolution}
        onChange={(e) => setResolution(Number(e.target.value))}
        disabled={isGenerating}
      >
        <option value={128}>128px</option>
        <option value={240}>240px</option>
        <option value={360}>360px</option>
        <option value={480}>480px</option>
        <option value={720}>720px</option>
      </select>

      {error && <div className="error">{error}</div>}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{ width: '100%', marginTop: '8px' }}
      >
        {isGenerating ? 'Generating...' : 'Generate Animation (25 credits)'}
      </button>

      {isGenerating && (
        <div className="loading" style={{ marginTop: '16px' }}>
          Generating animation... This may take a few minutes.
        </div>
      )}
    </div>
  );
};
