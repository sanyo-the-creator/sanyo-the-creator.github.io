import React from 'react';
import Header, { CardNavItem } from './Header/Header';
import UpshiftLogo from '../../assets/icons/upshift_icon_mini.svg';

// Standard site navigation ("upshift menu"). Single source of truth so the
// header stays identical across Layout pages and standalone pages that opt in.
export const UPSHIFT_NAV_ITEMS: CardNavItem[] = [
  {
    label: 'General Information',
    bgColor: '#140b20',
    textColor: '#fff',
    text: 'Explore our in-app features, faq and reviews',
    links: [{ label: 'Explore', ariaLabel: 'In-App features', href: '/features' }],
  },
  {
    label: 'Download',
    bgColor: '#1e1133',
    textColor: '#fff',
    text: 'Get Upshift from your preferred store',
    links: [{ label: 'Get Upshift', ariaLabel: 'Home', href: '/download' }],
  },
  {
    label: 'Articles',
    bgColor: '#271e37',
    textColor: '#fff',
    text: 'Read helpful articles about productivity',
    links: [{ label: 'Read articles', ariaLabel: 'Articles', href: '/articles' }],
  },
];

const UpshiftMenu: React.FC = () => (
  <Header
    logo={UpshiftLogo}
    items={UPSHIFT_NAV_ITEMS}
    baseColor="#1c0e2d22"
    menuColor="#fff"
    buttonBgColor="#111"
    buttonTextColor="#fff"
    ease="power3.out"
  />
);

export default UpshiftMenu;
