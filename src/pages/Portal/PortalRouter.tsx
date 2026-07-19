import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from './PortalLayout';
import PortalDashboard from './PortalDashboard';
import PortalAuth from './PortalAuth';
import PortalLeaderboard from './PortalLeaderboard';
import PortalReferrals from './PortalReferrals';
import PortalSettings from './PortalSettings';
import PortalSubmitVideo from './PortalSubmitVideo';
import PortalMyVideos from './PortalMyVideos';
import PortalSubmitReddit from './PortalSubmitReddit';
import PortalMyRedditPosts from './PortalMyRedditPosts';
import { supabase } from '../../lib/supabase';
import { useCampaignSettings } from '../../hooks/useCampaignSettings';
import './Portal.css';

const PortalRouter = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { videoEnabled, redditEnabled } = useCampaignSettings();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } }: any = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="portal-loading">Loading...</div>;
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<PortalAuth onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/portal/login" replace />} />
        </>
      ) : (
        <Route element={<PortalLayout onLogout={() => setIsAuthenticated(false)} />}>
          <Route path="/" element={<PortalDashboard />} />
          {videoEnabled && (
            <>
              <Route path="/submit" element={<PortalSubmitVideo />} />
              <Route path="/videos" element={<PortalMyVideos />} />
            </>
          )}
          {redditEnabled && (
            <>
              <Route path="/submit-reddit" element={<PortalSubmitReddit />} />
              <Route path="/reddit-posts" element={<PortalMyRedditPosts />} />
            </>
          )}
          <Route path="/leaderboard" element={<PortalLeaderboard />} />
          <Route path="/referrals" element={<PortalReferrals />} />
          <Route path="/settings" element={<PortalSettings />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>
      )}
    </Routes>
  );
};

export default PortalRouter;
