import React from 'react';
import { FaDiscord as _FaDiscord } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const FaDiscord = _FaDiscord as React.ElementType;

interface PortalAuthProps {
  onLogin: () => void;
}

const PortalAuth: React.FC<PortalAuthProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleDiscordLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/portal`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Discord:', error);
      alert('Failed to connect to Discord. Check console for details.');
    }
  };

  return (
    <div className="portal-auth-container">
      <div className="portal-auth-card">
        <h1 className="portal-auth-title">Welcome to the Creator Portal</h1>
        <p className="portal-auth-subtitle">Sign in to track your posts, views, and earnings</p>
        
        <button className="portal-btn portal-btn-discord" onClick={handleDiscordLogin}>
          <FaDiscord size={24} style={{ marginRight: '10px' }} />
          Connect with Discord
        </button>
      </div>
    </div>
  );
};

export default PortalAuth;
