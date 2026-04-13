import React from 'react';
import { FiUser as _FiUser, FiCreditCard as _FiCreditCard, FiAlertCircle as _FiAlertCircle, FiBookOpen as _FiBookOpen } from 'react-icons/fi';
import { SiTiktok as _SiTiktok, SiInstagram as _SiInstagram, SiDiscord as _SiDiscord, SiStripe as _SiStripe } from 'react-icons/si';

const FiUser = _FiUser as React.ElementType;
const FiCreditCard = _FiCreditCard as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiBookOpen = _FiBookOpen as React.ElementType;
const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const SiDiscord = _SiDiscord as React.ElementType;
const SiStripe = _SiStripe as React.ElementType;

const PortalSettings = () => {
  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Settings</h1>
          <p className="portal-page-subtitle">Manage your account and preferences</p>
        </div>
      </header>

      {/* Profile Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><FiUser /></div>
          <h3>Profile</h3>
        </div>
        
        <div className="settings-block-content profile-block">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Pulandooo" alt="avatar" className="settings-avatar" />
          <div className="profile-info">
            <div className="profile-name">Pulandooo</div>
            <div className="profile-handle text-accent">@pulandooo</div>
            <div className="profile-email">sanyopoole13@gmail.com</div>
          </div>
          <div className="profile-discord-badge">
            <SiDiscord />
          </div>
        </div>
      </div>

      {/* TikTok Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><SiTiktok /></div>
          <h3>TikTok Accounts</h3>
        </div>
        
        <div className="settings-block-content center-content">
          <button className="settings-connect-btn">+ Connect Account</button>
          <p className="settings-help-text">Connect your account to submit videos and track your earnings.</p>
        </div>
      </div>

      {/* Instagram Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><SiInstagram /></div>
          <h3>Instagram Accounts</h3>
        </div>
        
        <div className="settings-block-content center-content">
          <button className="settings-connect-btn">+ Connect Account</button>
          <p className="settings-help-text">Connect your Instagram account to submit Reels and track your earnings.</p>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><FiCreditCard /></div>
          <h3>Payment Methods</h3>
        </div>
        <p className="settings-section-description">
          Add your payment info below. You only need one to get paid, but adding multiple gives us backup options if there's an issue.
        </p>

        {/* Stripe */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon stripe-icon">🏛️</span> <strong>Bank</strong> (Stripe) <span className="badge-main text-accent">Main</span>
          </div>
          <p className="payment-help">Connect your bank account to receive payouts directly.</p>
          <button className="settings-btn-stripe">
            <SiStripe style={{ marginRight: '6px' }} /> Connect with Stripe
          </button>
        </div>

        {/* Crypto */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon crypto-icon">🟣</span> <strong>Crypto</strong> (USDC on the Solana Network) <span className="badge-main text-accent">Main</span>
          </div>
          <p className="payment-help">Connect your Phantom wallet or enter your address manually to receive USDC payouts.</p>
          
          <div className="payment-actions-row">
            <button className="settings-btn-wallet">
              <span className="phantom-logo">👻</span> Connect Wallet
            </button>
            <button className="settings-btn-manual">
              <span className="edit-icon">✏️</span> Enter Manually
            </button>
          </div>
          
          <div className="warning-box">
             <FiAlertCircle className="warning-icon" />
             <div className="warning-text">
               <strong>Connect Wallet</strong> will request your public wallet address from Phantom — no transactions will be made, and we never access your funds.<br />
               <span className="text-warning-orange">Phantom not detected. <a href="#">Install Phantom</a> or use "Enter Manually" below.</span>
             </div>
          </div>
          <div className="wallet-help-link">
             <FiBookOpen /> How to get a wallet
          </div>
        </div>

        {/* PayPal */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon paypal-icon">P</span> <strong>PayPal</strong> <span className="info-circle-tiny">i</span>
          </div>
          
          <div className="form-group">
            <label>PAYPAL EMAIL OR USERNAME</label>
            <input type="text" placeholder="yourname@example.com or @username" className="settings-input" />
          </div>
          <div className="form-group">
            <label>CONFIRM</label>
            <input type="text" placeholder="Enter again to confirm" className="settings-input" />
          </div>
          <button className="settings-save-btn">Save</button>
        </div>

        {/* Cash App */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon cashapp-icon">$</span> <strong>Cash App</strong> <span className="info-circle-tiny">i</span>
          </div>
          
          <div className="form-group">
            <label>$CASHTAG</label>
            <input type="text" placeholder="$YourCashTag" className="settings-input" />
          </div>
          <div className="form-group">
            <label>CONFIRM $CASHTAG</label>
            <input type="text" placeholder="Enter again to confirm" className="settings-input" />
          </div>
          <button className="settings-save-btn">Save</button>
        </div>

      </div>
    </div>
  );
};

export default PortalSettings;
