import React from 'react';
import { Outlet } from 'react-router-dom';
import UpshiftMenu from '../common/UpshiftMenu';
import { Footer } from '../common';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <UpshiftMenu />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
