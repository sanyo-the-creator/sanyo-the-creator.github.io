import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  RiDashboardLine as _RiDashboardLine, 
  RiAddCircleLine as _RiAddCircleLine, 
  RiVideoLine as _RiVideoLine, 
  RiTrophyLine as _RiTrophyLine, 
  RiGroupLine as _RiGroupLine, 
  RiSettings4Line as _RiSettings4Line,
  RiLogoutBoxRLine as _RiLogoutBoxRLine,
  RiMenu3Line as _RiMenu3Line,
  RiCloseLine as _RiCloseLine,
  RiFocus3Line as _RiFocus3Line,
  RiMagicLine as _RiMagicLine
} from 'react-icons/ri';

const RiDashboardLine = _RiDashboardLine as React.ElementType;
const RiAddCircleLine = _RiAddCircleLine as React.ElementType;
const RiVideoLine = _RiVideoLine as React.ElementType;
const RiTrophyLine = _RiTrophyLine as React.ElementType;
const RiGroupLine = _RiGroupLine as React.ElementType;
const RiSettings4Line = _RiSettings4Line as React.ElementType;
const RiLogoutBoxRLine = _RiLogoutBoxRLine as React.ElementType;
const RiMenu3Line = _RiMenu3Line as React.ElementType;
const RiCloseLine = _RiCloseLine as React.ElementType;
const RiFocus3Line = _RiFocus3Line as React.ElementType;
const RiMagicLine = _RiMagicLine as React.ElementType;

interface PortalLayoutProps {
  onLogout: () => void;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      navigate('/portal/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const userEmail = user?.email || 'Loading...';
  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Felix'}`;

  return (
    <div className={`portal-layout ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Mobile Header */}
      <header className="portal-mobile-header">
        <div className="portal-mobile-left">
          <div className="portal-logo-icon">
            <RiFocus3Line />
          </div>
          <span className="portal-brand">Creator Portal</span>
          <img 
            src={userAvatar} 
            alt="User Avatar" 
            className="portal-avatar" 
          />
        </div>
        <button className="portal-mobile-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
          {isMobileMenuOpen ? <RiCloseLine /> : <RiMenu3Line />}
        </button>
      </header>

      {/* Backdrop */}
      {isMobileMenuOpen && <div className="portal-mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`portal-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="portal-sidebar-header">
          <div className="portal-logo-icon">
            <RiFocus3Line />
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
            <RiDashboardLine className="portal-nav-icon" /> Dashboard
          </NavLink>
          <NavLink to="/portal/submit" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiAddCircleLine className="portal-nav-icon" /> Submit Video
          </NavLink>
          <NavLink to="/portal/videos" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiVideoLine className="portal-nav-icon" /> My Videos
          </NavLink>
          <NavLink to="/creator?from=portal" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiMagicLine className="portal-nav-icon" /> Creator Tools
          </NavLink>
          <NavLink to="/portal/referrals" className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
            <RiGroupLine className="portal-nav-icon" /> Referrals
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

