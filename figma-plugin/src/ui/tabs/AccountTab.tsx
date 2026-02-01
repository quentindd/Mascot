import React, { useState, useEffect } from 'react';
import { RPCClient } from '../rpc/client';

/** Credit cost per action (single source of truth for display). */
export const CREDIT_COSTS = {
  mascot: 1,
  pose: 4,
  animation: 20,
  logo: 10,
} as const;

/** Buy Credits packs: credits → price (USD). */
export const CREDIT_PACKS = [
  { credits: 25, price: '5.99', pricePerCredit: '$0.24', label: 'Starter' },
  { credits: 75, price: '12.99', pricePerCredit: '$0.17', label: 'Popular', popular: true },
  { credits: 200, price: '25.99', pricePerCredit: '$0.13', label: 'Pro', save: '37%' },
] as const;

interface AccountTabProps {
  rpc: RPCClient;
  credits: number | null;
  onLogout: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ credits, onLogout, rpc }) => {
  const [selectedPack, setSelectedPack] = useState<number | null>(75);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    const onUrl = (data: { url?: string }) => {
      if (data?.url) {
        window.open(data.url, '_blank');
        rpc.send('get-credits'); // Refresh balance when returning to plugin
      }
      setBuyLoading(false);
    };
    const onErr = (data: { message?: string }) => {
      setBuyError(data?.message ?? 'Checkout failed.');
      setBuyLoading(false);
    };
    rpc.on('checkout-url', onUrl);
    rpc.on('checkout-error', onErr);
    return () => {
      rpc.off('checkout-url', onUrl);
      rpc.off('checkout-error', onErr);
    };
  }, [rpc]);

  const handleBuyCredits = () => {
    const plan = selectedPack != null ? String(selectedPack) : '75';
    setBuyError(null);
    setBuyLoading(true);
    rpc.send('create-checkout', { plan });
  };

  return (
    <div className="account-page">
      <h3 className="account-page-title">Account</h3>
      <p className="account-page-desc">
        Your balance, usage, and billing.
      </p>

      {/* Balance */}
      <div className="account-card account-card-balance">
        <div className="account-card-label">Your balance</div>
        <div className="account-card-value">{credits !== null ? credits : '—'}</div>
        <div className="account-card-unit">credits</div>
        <div className="account-card-meta">New users start with 15.</div>
      </div>

      {/* Usage: what each action costs */}
      <div className="account-card">
        <div className="account-card-label">Usage</div>
        <div className="account-usage-list">
          <div className="account-usage-row">
            <span>Mascot (3 variations)</span>
            <span className="account-usage-value">{CREDIT_COSTS.mascot} cr</span>
          </div>
          <div className="account-usage-row">
            <span>Pose</span>
            <span className="account-usage-value">{CREDIT_COSTS.pose} cr</span>
          </div>
          <div className="account-usage-row">
            <span>Animation</span>
            <span className="account-usage-value">{CREDIT_COSTS.animation} cr</span>
          </div>
          <div className="account-usage-row">
            <span>Logo</span>
            <span className="account-usage-value">{CREDIT_COSTS.logo} cr</span>
          </div>
        </div>
      </div>

      {/* Packs */}
      <div className="account-card">
        <div className="account-card-label">Credit packs</div>
        <div className="credit-packs">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.credits}
              role="button"
              tabIndex={0}
              className={`credit-pack ${pack.popular ? 'credit-pack-popular' : ''} ${selectedPack === pack.credits ? 'credit-pack-selected' : ''}`}
              onClick={() => setSelectedPack(pack.credits)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPack(pack.credits);
                }
              }}
              aria-pressed={selectedPack === pack.credits}
              aria-label={`Select ${pack.credits} credits for $${pack.price}`}
            >
              {pack.save && <span className="credit-pack-badge">−{pack.save}</span>}
              {pack.popular && <span className="credit-pack-popular-badge">⭐ Popular</span>}
              <div className="credit-pack-credits">{pack.credits} credits</div>
              <div className="credit-pack-price">${pack.price}</div>
              <div className="credit-pack-per-credit">{pack.pricePerCredit}/cr</div>
            </div>
          ))}
        </div>
        {buyError && (
          <p className="account-error" role="alert">
            {buyError}
          </p>
        )}
        <button
          type="button"
          className="btn-primary account-cta"
          onClick={handleBuyCredits}
          disabled={buyLoading}
        >
          {buyLoading ? 'Opening checkout…' : 'Buy more credits'}
        </button>
      </div>

      {/* Actions */}
      <div className="account-actions">
        <button type="button" className="btn-secondary account-logout" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  );
};
