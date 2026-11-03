import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SiteNav, SiteFooter, Starfield } from '../site/SiteChrome';
import { LocaleProvider, localeFromPath, detectLocale, localizePath } from '../../i18n';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  // First visit to the English home page: send people to the language their browser asks for.
  useEffect(() => {
    if (pathname !== '/') return;
    const lang = detectLocale();
    if (lang) navigate(`${localizePath(lang, '/')}${search}${hash}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
