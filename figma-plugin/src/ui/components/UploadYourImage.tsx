import React, { useState, useEffect, useRef } from 'react';
import { RPCClient } from '../rpc/client';

interface UploadYourImageProps {
  rpc: RPCClient;
}

export const UploadYourImage: React.FC<UploadYourImageProps> = ({ rpc }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onStarted = () => {
      setIsUploading(true);
      setUploadError(null);
    };
    const onComplete = () => {
      setIsUploading(false);
      setUploadError(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image (PNG, JPEG, WebP).');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      const base64 = result.indexOf('base64,') >= 0 ? result.split('base64,')[1] : result;
      rpc.send('upload-image-and-create-mascot', { base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="upload-your-image">
      <h2 className="upload-your-image-title">
        Already have a mascot? Upload it here 📤
      </h2>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
      <button
        type="button"
        className="btn-primary"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <span className="spinner" /> : 'Upload image'}
      </button>
      {uploadError && (
        <div className="upload-your-image-error" role="alert">
          {uploadError}
        </div>
      )}
      <div className="upload-your-image-or" aria-hidden="true">
        or
      </div>
    </div>
  );
};
