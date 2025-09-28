import React from 'react';
import { href, Outlet } from 'react-router-dom';
import Header from '../common/Header/Header';
import { Footer } from '../common';
import UpshiftLogo from '../../assets/icons/upshift_icon_mini.svg';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const items = [
    {
      label: "Home",
      bgColor: "#0D0716",
      textColor: "#fff",
      text: 'General information about Upshift',
      links: [
        { label: "Home", ariaLabel: "Home", href: '/#/home' },
      ]
    },
    {
      label: "Features",
      bgColor: "#170D27",
      textColor: "#fff",
      text: 'Explore our in-app features',
      links: [
        { label: "Features", ariaLabel: "In-App features", href: '/#/features' },
      ]
    },
    {
      label: "About",
      bgColor: "#271E37",
      textColor: "#fff",
      text: 'About this project and our journey',
      links: [
        { label: "About", ariaLabel: "About us", href: '/#/about' },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        logo={UpshiftLogo}
        items={items}
        baseColor="#1c0e2d22"
        menuColor="#fff"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
