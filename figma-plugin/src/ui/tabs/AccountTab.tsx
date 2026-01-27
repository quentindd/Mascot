import React from 'react';
import { RPCClient } from '../rpc/client';

interface AccountTabProps {
  rpc: RPCClient;
  credits: number | null;
}

export const AccountTab: React.FC<AccountTabProps> = ({ credits }) => {
  const handleManageBilling = () => {
    // Open web dashboard in browser
    window.open('https://mascot-production.up.railway.app/dashboard', '_blank');
  };

  return (
    <div>
      <h3 className="section-title">Account Settings</h3>
      <p className="section-description">
        Manage your account, credits, and billing information.
      </p>

      {/* Credits Card */}
      <div className="account-card">
        <div className="account-card-header">
          <div className="account-card-label">Credits Remaining</div>
          <div className="account-card-value">{credits !== null ? credits : '---'}</div>
        </div>
        <div className="account-card-meta">
          Plan: Free - Resets monthly
        </div>
      </div>

      {/* Actions */}
      <div className="account-actions">
        <button
          className="btn-primary"
          onClick={handleManageBilling}
          style={{ width: '100%' }}
        >
          Manage Billing
        </button>
      </div>

      {/* Credit Costs Info */}
      <div className="account-info-section">
        <h4 className="account-info-title">Credit Costs</h4>
        <div className="account-info-list">
          <div className="account-info-item">
            <span className="account-info-label">Mascot Generation</span>
            <span className="account-info-value">1 credit</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Animation</span>
            <span className="account-info-value">25 credits</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Logo Pack</span>
            <span className="account-info-value">20 credits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
