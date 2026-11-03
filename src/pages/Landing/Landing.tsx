import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SEO, StructuredData } from '../../components/common/SEO';
import { StoreButtons } from '../../components/site/SiteChrome';
import { useLocale, rich } from '../../i18n';
import upshiftIcon from '../../assets/upshiftIcon.png';
import todayShot from '../../assets/landing/today.webp';
import questBlockShot from '../../assets/landing/questBlock.webp';
import goalsShot from '../../assets/landing/goals.webp';
import profileShot from '../../assets/landing/profile.webp';
import timeTrackerShot from '../../assets/landing/timeTracker.webp';
import appBlockerShot from '../../assets/landing/appBlocker.webp';
import heroPhones from '../../assets/landing/hero.webp';
import './Landing.css';

// Screenshots and glow colours; all copy for each feature row lives in the locale messages.
const FEATURE_MEDIA = [
  { image: todayShot, glow: 'rgba(30, 79, 216, 0.5)' },
  { image: questBlockShot, glow: 'rgba(61, 7, 60, 0.5)' },
  { image: appBlockerShot, glow: 'rgba(30, 79, 216, 0.5)' },
  { image: goalsShot, glow: 'rgba(49, 125, 31, 0.5)' },
  { image: timeTrackerShot, glow: 'rgba(30, 79, 216, 0.5)' },
  { image: profileShot, glow: 'rgba(61, 7, 60, 0.5)' },
];

const Landing: React.FC = () => {
  const location = useLocation();
  const { t, path } = useLocale();
  const L = t.landing;
  const previewFaq = t.faq.groups.flatMap((g) => g.items).slice(0, 6);
  const statementRef = useRef<HTMLHeadingElement>(null);
  const [lit, setLit] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const words = L.statement.split(' ');

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  useEffect(() => {
    const update = () => {
      const el = statementRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.4)));
      setLit(Math.round(progress * words.length));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [words.length]);

  return (
    <div className="landing">
      <SEO
        title={t.meta.home.title}
        description={t.meta.home.description}
        keywords={t.meta.home.keywords}
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData type="organization" description={t.meta.home.description} />
      <StructuredData type="website" description={t.meta.home.description} />
      <StructuredData type="software" description={t.meta.home.description} />

      <section id="download" className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <div className="landing-badge">
              <img src={upshiftIcon} alt="" />
              <span>{L.badge}</span>
            </div>
            <h1>{rich(L.h1)}</h1>
            <p>{L.heroText}</p>
            <StoreButtons />
          </div>
          <div className="landing-hero-phones">
            <img src={heroPhones} alt={L.heroAlt} fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="landing-statement">
        <h2 ref={statementRef}>
          {words.map((w, i) =>
            w === '|' ? <br key={i} /> : (
              <span key={i} className={i < lit ? 'on' : ''}>{w} </span>
            )
          )}
        </h2>
      </section>

      <section id="features" className="landing-features">
        <div className="landing-head">
          <span className="site-eyebrow">{L.featuresEyebrow}</span>
          <h2>{L.featuresTitle}</h2>
        </div>
        {L.features.map((f, i) => (
          <div key={f.chip} className={`landing-row ${i % 2 ? 'reverse' : ''}`}>
            <div className="landing-row-media">
              <div className="landing-row-glow" style={{ background: `radial-gradient(circle, ${FEATURE_MEDIA[i].glow} 0%, transparent 70%)` }} />
              <img src={FEATURE_MEDIA[i].image} alt={f.alt} loading="lazy" />
            </div>
            <div className="landing-row-text">
              <span className="site-chip">{f.chip}</span>
              <h3>
                <span className={i === 0 ? 'grad-blue' : ''}>{f.title[0]}</span>
                <br />
                {f.title[1]}
              </h3>
              <p>{f.text}</p>
              <a href="#download" className="site-cta landing-row-cta">{f.cta}</a>
            </div>
          </div>
        ))}
      </section>

      <section className="landing-faq">
        <div className="landing-head">
          <span className="site-eyebrow">{L.faqEyebrow}</span>
          <h2>{L.faqTitle}</h2>
        </div>
        <div className="landing-faq-list">
          {previewFaq.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.question} className={`landing-faq-item ${open ? 'open' : ''}`}>
                <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}>
                  {item.question}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {open && <p>{item.answer}</p>}
              </div>
            );
          })}
        </div>
        <div className="landing-faq-more">
          <Link to={path('/faq')}>{L.seeAll}</Link>
        </div>
      </section>

      <section className="landing-cta">
        <img src={upshiftIcon} alt={L.ctaAlt} />
        <h2>{rich(L.ctaTitle)}</h2>
        <StoreButtons className="center" />
      </section>
    </div>
  );
};

export default Landing;
