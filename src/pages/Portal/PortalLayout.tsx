import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  RiDashboardFill as _RiDashboardFill, 
  RiVideoUploadLine as _RiVideoUploadLine, 
  RiVideoLine as _RiVideoLine, 
  RiTrophyLine as _RiTrophyLine, 
  RiUserShared2Line as _RiUserShared2Line, 
  RiSettings4Line as _RiSettings4Line,
  RiLogoutBoxRLine as _RiLogoutBoxRLine
} from 'react-icons/ri';
const RiDashboardFill = _RiDashboardFill as React.ElementType;
const RiVideoUploadLine = _RiVideoUploadLine as React.ElementType;
const RiVideoLine = _RiVideoLine as React.ElementType;
const RiTrophyLine = _RiTrophyLine as React.ElementType;
const RiUserShared2Line = _RiUserShared2Line as React.ElementType;
const RiSettings4Line = _RiSettings4Line as React.ElementType;
const RiLogoutBoxRLine = _RiLogoutBoxRLine as React.ElementType;

interface PortalLayoutProps {
  onLogout: () => void;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      navigate('/portal/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userEmail = user?.email || 'Loading...';
  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Felix'}`;

  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <div className="portal-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
               <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="portal-brand">Creator Portal</span>
          <img 
            src={userAvatar} 
            alt="User Avatar" 
            className="portal-avatar" 
          />
        </div>

        <nav className="portal-nav">
          <NavLink to="/portal" end className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiDashboardFill className="portal-nav-icon" /> Dashboard
          </NavLink>
          <NavLink to="/portal/submit" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiVideoUploadLine className="portal-nav-icon" /> Submit Video
          </NavLink>
          <NavLink to="/portal/videos" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiVideoLine className="portal-nav-icon" /> My Videos
          </NavLink>
          <NavLink to="/portal/leaderboard" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiTrophyLine className="portal-nav-icon" /> Leaderboard
          </NavLink>
          <NavLink to="/portal/referrals" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiUserShared2Line className="portal-nav-icon" /> Referrals
          </NavLink>
          <NavLink to="/portal/settings" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiSettings4Line className="portal-nav-icon" /> Settings
          </NavLink>
        </nav>

        <div className="portal-sidebar-footer">
          <div className="portal-user-email" title={userEmail}>{userEmail}</div>
          <button className="portal-signout-btn" onClick={handleSignOut}>
            <RiLogoutBoxRLine className="portal-nav-icon" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="portal-content">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
