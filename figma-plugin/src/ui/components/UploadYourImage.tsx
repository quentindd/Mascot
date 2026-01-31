import React, { useState, useEffect } from 'react';
import { RPCClient } from '../rpc/client';

interface UploadYourImageProps {
  rpc: RPCClient;
}

export const UploadYourImage: React.FC<UploadYourImageProps> = ({ rpc }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');

  useEffect(() => {
    const onStarted = () => {
      setIsUploading(true);
      setUploadError(null);
    };
    const onComplete = () => {
      setIsUploading(false);
      setUploadError(null);
      setImageUrl('');
      setImageName('');
    };
    const onError = (data: { message?: string; context?: string }) => {
      if (data.context === 'create-from-image') {
        setIsUploading(false);
        setUploadError(data.message || 'Upload failed');
      }
    };

    rpc.on('create-from-image-started', onStarted);
    rpc.on('create-from-image-complete', onComplete);
    rpc.on('error', onError);

    return () => {
      rpc.off('create-from-image-started', onStarted);
      rpc.off('create-from-image-complete', onComplete);
      rpc.off('error', onError);
    };
  }, [rpc]);

  const handleSelectOnCanvas = () => {
    setUploadError(null);
    rpc.send('export-selection-and-upload', {});
  };

  const handleUseUrl = () => {
    const url = imageUrl.trim();
    if (!url) {
      setUploadError('Please enter an image URL');
      return;
    }
    setUploadError(null);
    rpc.send('create-mascot-from-image-url', {
      imageUrl: url,
      name: imageName.trim() || undefined,
    });
  };

  return (
    <div className="upload-your-image">
      <h3 className="upload-your-image-title">Use your own image</h3>
      <p className="upload-your-image-desc">
        Upload a mascot or logo you already have to animate it, make logos, or generate poses.
      </p>

      <div className="upload-your-image-actions">
        <button
          type="button"
          className="upload-your-image-btn upload-your-image-btn--canvas"
          onClick={handleSelectOnCanvas}
          disabled={isUploading}
          title="Select a frame or image on the Figma canvas"
        >
          {isUploading ? (
            <span className="spinner upload-your-image-spinner" />
          ) : (
            <>
              <span className="upload-your-image-icon">◇</span>
              Select on canvas
            </>
          )}
        </button>

        <div className="upload-your-image-url-row">
          <input
            type="url"
            className="input upload-your-image-input"
            placeholder="Paste image URL (PNG, JPEG, WebP)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isUploading}
          />
          <input
            type="text"
            className="input upload-your-image-name"
            placeholder="Name (optional)"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            disabled={isUploading}
          />
          <button
            type="button"
            className="upload-your-image-btn upload-your-image-btn--primary"
            onClick={handleUseUrl}
            disabled={isUploading || !imageUrl.trim()}
          >
            Use this image
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="upload-your-image-error" role="alert">
          {uploadError}
        </div>
      )}
    </div>
  );
};
