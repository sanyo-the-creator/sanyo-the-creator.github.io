import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SEO, StructuredData } from '../../components/common/SEO';
import { StoreButtons } from '../../components/site/SiteChrome';
import { faqItems } from '../../data/faqs';
import upshiftIcon from '../../assets/upshiftIcon.png';
import todayShot from '../../assets/landing/today.webp';
import questBlockShot from '../../assets/landing/questBlock.webp';
import goalsShot from '../../assets/landing/goals.webp';
import profileShot from '../../assets/landing/profile.webp';
import timeTrackerShot from '../../assets/landing/timeTracker.webp';
import appBlockerShot from '../../assets/landing/appBlocker.webp';
import heroPhones from '../../assets/landing/hero.webp';
import './Landing.css';

const STATEMENT =
  'You open your phone for one minute and lose an hour. | With Upshift the apps stay locked until your quests are done.';

const FEATURES = [
  {
    chip: '⚔️ Quests',
    title: ['Your Habits', 'Become Quests'],
    text: 'Turn daily habits into quests and sidequests. Earn XP in Money, Strength, Health and Knowledge, build streaks and level up your life.',
    image: todayShot,
    alt: 'Upshift today screen with daily quests',
    glow: 'rgba(30, 79, 216, 0.5)',
    cta: 'Start Leveling Up',
  },
  {
    chip: '🛡️ Quest Blocker',
    title: ['Earn Your', 'Screen Time'],
    text: 'Distracting apps stay blocked until you finish your daily quests. Add Block Now, time limits and work schedules when you need more.',
    image: questBlockShot,
    alt: 'Upshift quest blocker setup',
    glow: 'rgba(61, 7, 60, 0.5)',
    cta: 'Block My Apps',
  },
  {
    chip: '⏳ App Blocker',
    title: ['Know Where', 'Your Time Goes'],
    text: 'See your total usage per app, then set up work schedules, adult content and gambling blocks, time limits or Block Now with one tap. Turn on strict mode and there is no way to bypass the block until it ends.',
    image: appBlockerShot,
    alt: 'Upshift app blocker with total usage',
    glow: 'rgba(30, 79, 216, 0.5)',
    cta: 'Take Control',
  },
  {
    chip: '🎯 Goals',
    title: ['Goals With', 'a Real Plan'],
    text: 'Set long-term goals, break them into micro-goals and keep a journal with your plan and reflections.',
    image: goalsShot,
    alt: 'Upshift goals screen',
    glow: 'rgba(49, 125, 31, 0.5)',
    cta: 'Set My Goals',
  },
  {
    chip: '⏱️ Time Tracker',
    title: ['See Where', 'Your Day Goes'],
    text: 'Track your focus sessions and daily activity on a calendar, keep your day streak alive and look back at your history anytime.',
    image: timeTrackerShot,
    alt: 'Upshift time tracker with calendar and day streak',
    glow: 'rgba(30, 79, 216, 0.5)',
    cta: 'Track My Time',
  },
  {
    chip: '📈 Profile',
    title: ['Watch Yourself', 'Level Up'],
    text: 'Your profile shows your level, XP in every category, badges and streaks. Add friends, join groups and climb the leaderboards to stay accountable.',
    image: profileShot,
    alt: 'Upshift profile with XP progress',
    glow: 'rgba(61, 7, 60, 0.5)',
    cta: 'See My Stats',
  },
];

const PREVIEW_FAQ = faqItems.slice(0, 6);

const Landing: React.FC = () => {
  const location = useLocation();
  const statementRef = useRef<HTMLHeadingElement>(null);
  const [lit, setLit] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const words = STATEMENT.split(' ');

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
        title="Upshift - Level up your life | Habit Tracker & Quest Blocker"
        description="Turn habits into quests, earn XP and keep distracting apps blocked until your quests are done. Upshift for iPhone and Android."
        keywords="upshift, habit tracker, quest blocker, app blocker, screen time, productivity, gamification, goals"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData type="organization" />

      <section id="download" className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <div className="landing-badge">
              <img src={upshiftIcon} alt="" />
              <span>Your life, played like a game.</span>
            </div>
            <h1>
              Your phone is your <span className="grad-blue">tool</span>,
              <br />
              not your <span className="grad-orange">distraction</span>
            </h1>
            <p>
              Upshift turns your habits into quests. Finish them to earn XP and unlock the apps you blocked, and watch your
              streaks, goals and level grow every day.
            </p>
            <StoreButtons />
          </div>
          <div className="landing-hero-phones">
            <img src={heroPhones} alt="Upshift on iPhone: app blocker, daily quests and time tracker" fetchPriority="high" />
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
          <span className="site-eyebrow">How It Works</span>
          <h2>How Upshift Turns Habits Into Progress</h2>
        </div>
        {FEATURES.map((f, i) => (
          <div key={f.chip} className={`landing-row ${i % 2 ? 'reverse' : ''}`}>
            <div className="landing-row-media">
              <div className="landing-row-glow" style={{ background: `radial-gradient(circle, ${f.glow} 0%, transparent 70%)` }} />
              <img src={f.image} alt={f.alt} loading="lazy" />
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
          <span className="site-eyebrow">Need Help?</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="landing-faq-list">
          {PREVIEW_FAQ.map((item, i) => {
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
          <Link to="/faq">See all questions</Link>
        </div>
      </section>

      <section className="landing-cta">
        <img src={upshiftIcon} alt="Upshift" />
        <h2>
          Replace <span className="grad-orange">Doomscrolling</span>
          <br />
          with <span className="grad-blue">Leveling Up</span>
        </h2>
        <StoreButtons className="center" />
      </section>
    </div>
  );
};

export default Landing;
