import React, { useState } from 'react';

import figmaLogo from './assets/figma-logo.png';

type AuthView = 'main' | 'google-code';

export interface AuthScreenProps {
  onGoogleLogin: () => void;
  onGoogleCodeSubmit: (code: string) => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  authError?: string;
  authLoading?: boolean;
  checkingStoredToken?: boolean;
}

/**
 * Page de connexion : Continue with Figma (Google OAuth).
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({
  onGoogleLogin,
  onGoogleCodeSubmit,
  onOpenTerms,
  onOpenPrivacy,
  authError = '',
  authLoading = false,
  checkingStoredToken = false,
}) => {
  const [view, setView] = useState<AuthView>('main');
  const [googleCode, setGoogleCode] = useState('');

  const goMain = () => {
    setView('main');
    setGoogleCode('');
  };

  const handleGoogleClick = () => {
    onGoogleLogin();
    setView('google-code');
  };

  const handleGoogleCodeSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleCode.trim()) return;
    onGoogleCodeSubmit(googleCode.trim());
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome to Mascoty</h2>
        <p className="auth-subtitle">Sign in to start creating mascots</p>

        {checkingStoredToken ? (
          <div className="auth-checking">
            <span className="spinner" aria-hidden />
            <p>Signing you in...</p>
          </div>
        ) : view === 'main' ? (
          <>
            <div className="auth-buttons">
              <button
                type="button"
                className="btn-primary btn-figma-continue btn-figma-continue--standalone"
                onClick={handleGoogleClick}
                disabled={authLoading}
              >
                <span className="btn-figma-continue-icon" aria-hidden>
                  <img src={figmaLogo} alt="" width={20} height={20} />
                </span>
                Continue with Figma
              </button>
            </div>
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <p className="auth-legal">
              By authenticating and using Mascoty you agree to our{' '}
              <button type="button" className="auth-link" onClick={onOpenTerms}>
                Terms of Service
              </button>
              {' and '}
              <button type="button" className="auth-link" onClick={onOpenPrivacy}>
                Privacy Policy
              </button>
            </p>
          </>
        ) : view === 'google-code' ? (
          <form onSubmit={handleGoogleCodeSubmitForm} className="auth-form">
            <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: 12 }}>
              A browser window opened. Sign in with Google there, then enter the 6-digit code shown on the success page.
            </p>
            <label className="auth-form-label" htmlFor="auth-google-code">
              Code
            </label>
            <input
              id="auth-google-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input auth-input auth-code-input"
              value={googleCode}
              onChange={(e) => setGoogleCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoComplete="one-time-code"
              disabled={authLoading}
              autoFocus
            />
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={authLoading || googleCode.length < 6}
            >
              {authLoading ? (
                <>
                  <span className="spinner" aria-hidden />
                  Signing in...
                </>
              ) : (
                'Continue'
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={goMain}
              disabled={authLoading}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
