import React from 'react';
import { RPCClient } from '../rpc/client';

interface AccountTabProps {
  rpc: RPCClient;
  credits: number | null;
}

export const AccountTab: React.FC<AccountTabProps> = () => {
  const handleManageBilling = () => {
    // Open web dashboard in browser
    window.open('https://mascot.com/dashboard', '_blank');
  };

  return (
    <div>
      <h3 className="card-title">Account</h3>

      <div className="card">
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            Credits Remaining
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>100</div>
        </div>
        <div style={{ fontSize: '11px', color: '#999' }}>
          Plan: Creator • Resets monthly
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleManageBilling}
        style={{ width: '100%', marginTop: '16px' }}
      >
        Manage Billing
      </button>

      <div style={{ marginTop: '24px', fontSize: '11px', color: '#666' }}>
        <h4 style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
          Credit Costs
        </h4>
        <div style={{ lineHeight: '1.6' }}>
          <div>• Mascot: 1 credit</div>
          <div>• Animation: 25 credits</div>
          <div>• Logo Pack: 20 credits</div>
        </div>
      </div>
    </div>
  );
};
