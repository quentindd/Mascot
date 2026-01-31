import React, { useState } from 'react';

/** Simple Figma-style "F" icon (multicolor dots). */
function FigmaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="6" r="4" fill="#F24E1E" />
      <circle cx="12" cy="18" r="4" fill="#0ACF83" />
      <circle cx="6" cy="12" r="4" fill="#A259FF" />
      <circle cx="18" cy="12" r="4" fill="#1ABCFE" />
      <circle cx="12" cy="12" r="4" fill="#FF7262" />
    </svg>
  );
}

type AuthView = 'main' | 'email' | 'register' | 'api-token' | 'google-code';

export interface AuthScreenProps {
  tokenInput: string;
  setTokenInput: (value: string) => void;
  onUseToken: () => void;
  onBack: () => void;
  onGoogleLogin: () => void;
  onGoogleCodeSubmit: (code: string) => void;
  onTokenSubmit: (e: React.FormEvent) => void;
  onEmailLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name?: string) => void;
  onOpenGetTokenUrl?: () => void;
  authError?: string;
  authLoading?: boolean;
  checkingStoredToken?: boolean;
}

/**
 * Page de connexion : Google et email pour les utilisateurs, token API en option secondaire.
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({
  tokenInput,
  setTokenInput,
  onUseToken,
  onBack,
  onGoogleLogin,
  onGoogleCodeSubmit,
  onTokenSubmit,
  onEmailLogin,
  onRegister,
  onOpenGetTokenUrl,
  authError = '',
  authLoading = false,
  checkingStoredToken = false,
}) => {
  const [view, setView] = useState<AuthView>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [googleCode, setGoogleCode] = useState('');

  const goMain = () => {
    setView('main');
    setEmail('');
    setPassword('');
    setName('');
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

  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    onEmailLogin(email.trim(), password);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 8) return;
    onRegister(email.trim(), password, name.trim() || undefined);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome to Mascot</h2>
        <p className="auth-subtitle">Sign in to start creating mascots</p>

        {checkingStoredToken ? (
          <div className="auth-checking">
            <span className="spinner" aria-hidden />
            <p>Signing you in...</p>
          </div>
        ) : view === 'main' ? (
          <div className="auth-split">
            <div className="auth-split-left">
              <h2 className="auth-title">Enter one-time code</h2>
              <form
                onSubmit={handleGoogleCodeSubmitForm}
                className="auth-form auth-form--code"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input auth-input auth-code-input auth-code-input--main"
                  value={googleCode}
                  onChange={(e) => setGoogleCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  disabled={authLoading}
                  aria-label="One-time code"
                />
                <p className="auth-code-hint">
                  Enter the 6-digit code shown in the browser after signing in with Figma
                </p>
                {authError && (
                  <p className="auth-error" role="alert">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn-primary btn-primary--full"
                  disabled={authLoading || googleCode.length < 6}
                >
                  {authLoading ? (
                    <>
                      <span className="spinner" aria-hidden />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>
              <p className="auth-legal">
                By authenticating and using Mascot you agree to our{' '}
                <button type="button" className="auth-link" onClick={() => {}}>
                  terms and conditions
                </button>
              </p>
            </div>
            <div className="auth-split-divider">Or</div>
            <div className="auth-split-right">
              <button
                type="button"
                className="btn-figma-continue"
                onClick={handleGoogleClick}
                disabled={authLoading}
              >
                <span className="btn-figma-continue-icon" aria-hidden>
                  <FigmaIcon />
                </span>
                Continue with Figma
              </button>
              <p className="auth-split-email-hint">
                Or{' '}
                <button
                  type="button"
                  className="auth-link auth-link--light"
                  onClick={() => setView('email')}
                >
                  sign in with email
                </button>
              </p>
              <p className="auth-footer-link auth-footer-link--right">
                <button
                  type="button"
                  className="auth-link auth-link--light"
                  onClick={() => {
                    setView('api-token');
                    onUseToken();
                  }}
                >
                  Using an API token?
                </button>
              </p>
            </div>
          </div>
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
        ) : view === 'email' ? (
          <form onSubmit={handleEmailLoginSubmit} className="auth-form">
            <label className="auth-form-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className="input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={authLoading}
              autoFocus
            />
            <label className="auth-form-label" htmlFor="auth-password-login">
              Password
            </label>
            <input
              id="auth-password-login"
              type="password"
              className="input auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={authLoading}
            />
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={authLoading || !email.trim() || !password}
            >
              {authLoading ? (
                <>
                  <span className="spinner" aria-hidden />
                  Signing in...
                </>
              ) : (
                'Sign in'
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
            <p className="auth-footer-link">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => setView('register')}
              >
                Create an account
              </button>
            </p>
          </form>
        ) : view === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <label className="auth-form-label" htmlFor="auth-register-email">
              Email
            </label>
            <input
              id="auth-register-email"
              type="email"
              className="input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={authLoading}
              autoFocus
            />
            <label className="auth-form-label" htmlFor="auth-register-password">
              Password (min. 8 characters)
            </label>
            <input
              id="auth-register-password"
              type="password"
              className="input auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={authLoading}
            />
            <label className="auth-form-label" htmlFor="auth-register-name">
              Name <span className="auth-optional">(optional)</span>
            </label>
            <input
              id="auth-register-name"
              type="text"
              className="input auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              disabled={authLoading}
            />
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={
                authLoading ||
                !email.trim() ||
                !password ||
                password.length < 8
              }
            >
              {authLoading ? (
                <>
                  <span className="spinner" aria-hidden />
                  Creating account...
                </>
              ) : (
                'Create account'
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
            <p className="auth-footer-link">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => setView('email')}
              >
                Sign in
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={onTokenSubmit} className="auth-form">
            <label className="auth-form-label" htmlFor="auth-token-input">
              API Token
            </label>
            <textarea
              id="auth-token-input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your API token here..."
              className="token-input"
              autoFocus
              disabled={authLoading}
              aria-invalid={!!authError}
              aria-describedby={authError ? 'auth-error-msg' : undefined}
            />
            {authError && (
              <p id="auth-error-msg" className="auth-error" role="alert">
                {authError}
              </p>
            )}
            {onOpenGetTokenUrl && (
              <p className="auth-help">
                <button
                  type="button"
                  className="auth-link"
                  onClick={onOpenGetTokenUrl}
                >
                  Get your API token
                </button>
              </p>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={authLoading || !tokenInput.trim()}
            >
              {authLoading ? (
                <>
                  <span className="spinner" aria-hidden />
                  Checking...
                </>
              ) : (
                'Continue'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('main');
                onBack();
              }}
              className="btn-secondary"
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
