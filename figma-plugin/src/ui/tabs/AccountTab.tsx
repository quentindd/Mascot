import React, { useState, useEffect } from 'react';
import { RPCClient } from '../rpc/client';

/** Credit cost per action (single source of truth for display). */
export const CREDIT_COSTS = {
  mascot: 1,
  pose: 4,
} as const;

/** Subscription plans: Basic $4.99/30 cr, Pro $7.99/65 cr, Max $9.99/100 cr. Plan IDs: "basic" | "pro" | "max". */
export const SUBSCRIPTION_PLANS = [
  { id: 'basic' as const, credits: 30, price: '4.99', pricePerCredit: '$0.17', label: 'Basic', plan: 'basic' },
  { id: 'pro' as const, credits: 65, price: '7.99', pricePerCredit: '$0.12', label: 'Pro', popular: true, plan: 'pro' },
  { id: 'max' as const, credits: 100, price: '9.99', pricePerCredit: '$0.10', label: 'Max', save: 'Best value', plan: 'max' },
];

export interface AccountTabProps {
  rpc: RPCClient;
  credits: number | null;
  currentPlanId: string | null; // 'basic' | 'pro' | 'max' when subscribed
  onLogout: () => void;
}

function planIdToLabel(planId: string | null): string {
  if (!planId) return 'None';
  const plan = SUBSCRIPTION_PLANS.find((p) => p.plan === planId);
  return plan ? plan.label : planId;
}

export const AccountTab: React.FC<AccountTabProps> = ({ credits, currentPlanId, onLogout, rpc }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    const onUrl = (data: { url?: string }) => {
      if (data?.url) {
        window.open(data.url, '_blank');
        rpc.send('get-credits');
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

  useEffect(() => {
    const onPortalUrl = (data: { url?: string }) => {
      if (data?.url) {
        window.open(data.url, '_blank');
        rpc.send('get-credits');
      }
      setPortalLoading(false);
      setPortalError(null);
    };
    const onPortalErr = (data: { message?: string }) => {
      setPortalError(data?.message ?? 'Could not open billing page.');
      setPortalLoading(false);
    };
    rpc.on('portal-url', onPortalUrl);
    rpc.on('portal-error', onPortalErr);
    return () => {
      rpc.off('portal-url', onPortalUrl);
      rpc.off('portal-error', onPortalErr);
    };
  }, [rpc]);

  const handleSubscribe = () => {
    setBuyError(null);
    setBuyLoading(true);
    rpc.send('create-checkout', { plan: selectedPlan });
  };

  return (
    <div className="account-page">
      <h3 className="account-page-title">Account</h3>
      <p className="account-page-desc">
        Your balance, usage, and billing.
      </p>

      {/* Current plan */}
      <div className="account-card account-card-plan">
        <div className="account-card-label">Current plan</div>
        <div className="account-card-value account-card-plan-value">{planIdToLabel(currentPlanId)}</div>
        <div className="account-card-meta">
          {currentPlanId ? `${SUBSCRIPTION_PLANS.find((p) => p.plan === currentPlanId)?.credits ?? 0} credits per month` : 'Subscribe to get credits each month.'}
        </div>
      </div>

      {/* Balance */}
      <div className="account-card account-card-balance">
        <div className="account-card-label">Your balance</div>
        <div className="account-card-value">{credits !== null ? credits : '—'}</div>
        <div className="account-card-unit">credits</div>
        <div className="account-card-meta">New users get 5 credits. Subscribe for more each month.</div>
      </div>

      {/* Usage */}
      <div className="account-card">
        <div className="account-card-label">Usage</div>
        <div className="account-usage-list">
          <div className="account-usage-row">
            <span>Mascot (3 variations)</span>
            <span className="account-usage-value">{CREDIT_COSTS.mascot} credit</span>
          </div>
          <div className="account-usage-row">
            <span>Pose</span>
            <span className="account-usage-value">{CREDIT_COSTS.pose} credits</span>
          </div>
        </div>
      </div>

      {/* Subscription plans */}
      <div className="account-card">
        <div className="account-card-label">Subscription (credits per month)</div>
        <div className="credit-packs">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.plan}
              role="button"
              tabIndex={0}
              className={`credit-pack ${plan.popular ? 'credit-pack-popular' : ''} ${selectedPlan === plan.plan ? 'credit-pack-selected' : ''}`}
              onClick={() => setSelectedPlan(plan.plan)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPlan(plan.plan);
                }
              }}
              aria-pressed={selectedPlan === plan.plan}
              aria-label={`Select ${plan.label}: ${plan.credits} credits for $${plan.price}/month`}
            >
              {plan.save && <span className="credit-pack-badge">{plan.save}</span>}
              {plan.popular && <span className="credit-pack-popular-badge">⭐ Popular</span>}
              <div className="credit-pack-credits">{plan.credits} credits</div>
              <div className="credit-pack-price">${plan.price}<span className="credit-pack-period">/mo</span></div>
              <div className="credit-pack-per-credit">{plan.pricePerCredit}/cr</div>
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
          onClick={handleSubscribe}
          disabled={buyLoading}
        >
          {buyLoading ? 'Opening checkout…' : 'Subscribe'}
        </button>
        {portalError && (
          <p className="account-error" role="alert" style={{ marginTop: '8px', marginBottom: '0' }}>
            {portalError}
          </p>
        )}
        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%', marginTop: '10px' }}
          onClick={() => {
            setPortalError(null);
            setPortalLoading(true);
            rpc.send('create-portal');
          }}
          disabled={portalLoading}
        >
          {portalLoading ? 'Opening…' : 'Manage subscription'}
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
