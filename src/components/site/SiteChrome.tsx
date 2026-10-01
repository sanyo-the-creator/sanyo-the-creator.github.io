import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import upshiftIcon from '../../assets/upshiftIcon.png';
import './Site.css';

export const APP_STORE_URL = 'https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.upshift.app';
export const SUPPORT_EMAIL = 'support@joinupshift.com';

export const StoreButtons: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`site-stores ${className || ''}`}>
    <a className="site-store" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
      <span><small>Download on the</small><strong>App Store</strong></span>
    </a>
    <a className="site-store" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8c-.3.3-.4.7-.4 1.2v18c0 .5.1.9.4 1.2l10-10.2-10-10.2zm11.1 11.3l2.8 2.8-11.9 6.8 9.1-9.6zm0-2.2L5.6 1.3l11.9 6.8-2.8 2.8zm3.9-2.2l3 1.7c.9.5.9 1.8 0 2.3l-3 1.7-3-3.1 3-2.6z" /></svg>
      <span><small>Get it on</small><strong>Google Play</strong></span>
    </a>
  </div>
);

const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/faq', label: 'FAQ' },
];

export const SiteNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const links = (
    <>
      {NAV_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive && l.to === '/faq' ? 'active' : '')}>
          {l.label}
        </NavLink>
      ))}
      <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
      <Link to="/#download" className="site-cta">Download</Link>
    </>
  );

  return (
    <header className="site-nav" ref={navRef}>
      <Link to="/" className="site-logo" aria-label="Upshift home">
        <img src={upshiftIcon} alt="" />
        Upshift
      </Link>
      <nav className="site-nav-links" aria-label="Main navigation">{links}</nav>
      <button
        className="site-nav-toggle"
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span></span><span></span><span></span>
      </button>
      {open && <div className="site-nav-menu">{links}</div>}
    </header>
  );
};

export const SiteFooter: React.FC = () => {
  // The home page already ends with its own store buttons.
  const isHome = useLocation().pathname === '/';
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {!isHome && <StoreButtons />}
        <div className="site-footer-cols">
          <div>
            <h3>Product</h3>
            <Link to="/#features">Features</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/download">Download</Link>
          </div>
          <div>
            <h3>Resources</h3>
            <Link to="/articles">Blog</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
          </div>
          <div>
            <h3>Legal</h3>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <a href="https://support.apple.com/en-gb/118223" target="_blank" rel="noopener noreferrer">Request a refund</a>
          </div>
        </div>
        <p className="site-footer-copy">&copy; {new Date().getFullYear()} Upshift. All rights reserved.</p>
      </div>
    </footer>
  );
};

// Drifting, twinkling starfield behind every public page.
export const Starfield: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let seed = 20260916;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const stars = Array.from({ length: 80 }, () => ({
      x: rand(),
      y: rand(),
      r: 0.6 + rand() * 1.4,
      base: 0.12 + rand() * 0.45,
      period: 2.2 + rand() * 4.5,
      phase: rand(),
      drift: 0.004 + rand() * 0.01,
    }));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (ms: number) => {
      const t = reduced ? 0 : ms / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        const y = (((s.y - t * s.drift) % 1) + 1) % 1;
        const tw = 0.5 + 0.5 * Math.sin((t / s.period + s.phase) * Math.PI * 2);
        ctx.globalAlpha = Math.min(1, s.base * (0.35 + 0.9 * tw) * 1.6);
        ctx.beginPath();
        ctx.arc(s.x * w, y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="site-stars" aria-hidden="true" />;
};
