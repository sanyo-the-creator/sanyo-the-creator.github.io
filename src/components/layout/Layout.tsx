import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteNav, SiteFooter, Starfield } from '../site/SiteChrome';
import { LocaleProvider, localeFromPath } from '../../i18n';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <LocaleProvider lang={localeFromPath(pathname)}>
      <div className="site">
        <Starfield />
        <SiteNav />
        <main>
          {children || <Outlet />}
        </main>
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
};

export default Layout;
