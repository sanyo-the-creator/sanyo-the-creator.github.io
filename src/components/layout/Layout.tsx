import React from 'react';
import { Outlet } from 'react-router-dom';
import { SiteNav, SiteFooter, Starfield } from '../site/SiteChrome';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="site">
      <Starfield />
      <SiteNav />
      <main>
        {children || <Outlet />}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Layout;
