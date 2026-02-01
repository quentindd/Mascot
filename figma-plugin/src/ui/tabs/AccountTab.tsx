import React from 'react';
import { RPCClient } from '../rpc/client';

/** Credit cost per action (single source of truth for display). */
export const CREDIT_COSTS = {
  mascot: 1,
  pose: 4,
  animation: 20,
  logo: 10,
} as const;

/** Buy Credits packs: credits → price (EUR). */
export const CREDIT_PACKS = [
  { credits: 25, price: '4,99', pricePerCredit: '0,20 €', label: 'Starter' },
  { credits: 75, price: '11,99', pricePerCredit: '0,16 €', label: 'Popular', popular: true },
  { credits: 200, price: '24,99', pricePerCredit: '0,12 €', label: 'Pro', save: '37%' },
] as const;

interface AccountTabProps {
  rpc: RPCClient;
  credits: number | null;
  onLogout: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ credits, onLogout }) => {
  const handleBuyCredits = () => {
    window.open('https://mascot-production.up.railway.app/dashboard', '_blank');
  };

  const handleManageBilling = () => {
    window.open('https://mascot-production.up.railway.app/dashboard', '_blank');
  };

  return (
    <div>
      <h3 className="section-title">Account Settings</h3>
      <p className="section-description">
        Manage your account, credits, and billing.
      </p>

      {/* Credits Card */}
      <div className="account-card">
        <div className="account-card-header">
          <div className="account-card-label">Credits</div>
          <div className="account-card-value">{credits !== null ? credits : '---'}</div>
        </div>
        <div className="account-card-meta">
          New users get 15 credits to start.
        </div>
      </div>

      {/* Credit Costs Info */}
      <div className="account-info-section">
        <h4 className="account-info-title">Credit costs</h4>
        <div className="account-info-list">
          <div className="account-info-item">
            <span className="account-info-label">Mascot (3 variations)</span>
            <span className="account-info-value">{CREDIT_COSTS.mascot} credit</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Pose (style)</span>
            <span className="account-info-value">{CREDIT_COSTS.pose} credits</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Animation</span>
            <span className="account-info-value">{CREDIT_COSTS.animation} credits</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Logo pack</span>
            <span className="account-info-value">{CREDIT_COSTS.logo} credits</span>
          </div>
        </div>
      </div>

      {/* Buy Credits Packs */}
      <div className="account-info-section">
        <h4 className="account-info-title">Buy credits</h4>
        <div className="credit-packs">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.credits}
              className={`credit-pack ${pack.popular ? 'credit-pack-popular' : ''}`}
            >
              {pack.save && <span className="credit-pack-badge">Save {pack.save}</span>}
              {pack.popular && <span className="credit-pack-popular-badge">Popular</span>}
              <div className="credit-pack-credits">{pack.credits} credits</div>
              <div className="credit-pack-price">{pack.price} €</div>
              <div className="credit-pack-per-credit">{pack.pricePerCredit} / credit</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleBuyCredits}
          style={{ width: '100%', marginTop: 8 }}
        >
          Buy credits
        </button>
      </div>

      {/* Actions */}
      <div className="account-actions">
        <button
          className="btn-secondary"
          onClick={handleManageBilling}
          style={{ width: '100%' }}
        >
          Manage billing
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onLogout}
          style={{ width: '100%', marginTop: 8 }}
        >
          Log out
        </button>
      </div>
    </div>
  );
};
