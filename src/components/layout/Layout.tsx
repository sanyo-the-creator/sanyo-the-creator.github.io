import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../common/Header/Header';
import { Footer } from '../common';
import UpshiftLogo from '../../assets/icons/upshift_icon_mini.svg';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const items = [
     {
      label: "General Information",
      bgColor: "#0d0716",
      textColor: "#fff",
      text: 'Explore our in-app features, faq and reviews',
      links: [
        { label: "Explore", ariaLabel: "In-App features", href: '/#/features' },
      ]
    },
    {
      label: "Download",
      bgColor: "#170d27",
      textColor: "#fff",
      text: 'Get Upshift from your preferred store',
      links: [
        { label: "Get Upshift", ariaLabel: "Home", href: '/#/download' },
      ]
    },
   
    {
      label: "Articles",
      bgColor: "#271e37",
      textColor: "#fff",
      text: 'Read helpful articles about productivity',
      links: [
        { label: "Read articles", ariaLabel: "Articles", href: '/#/articles' },
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
