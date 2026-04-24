import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiArrowLeftLine as _RiArrowLeftLine,
  RiDownloadLine as _RiDownloadLine,
  RiImageAddLine as _RiImageAddLine,
  RiInformationLine as _RiInformationLine,
  RiEqualizerLine as _RiEqualizerLine,
  RiFileList3Line as _RiFileList3Line
} from 'react-icons/ri';

import { toPng } from 'html-to-image';
import { supabase } from '../../lib/supabase';
import upshiftIcon from '../../assets/icons/icon.png';
import appStoreImg from '../../assets/appStore.png';
import './Creator.css';

const RiArrowLeftLine = _RiArrowLeftLine as any;
const RiDownloadLine = _RiDownloadLine as any;
const RiImageAddLine = _RiImageAddLine as any;
const RiInformationLine = _RiInformationLine as any;
const RiEqualizerLine = _RiEqualizerLine as any;
const RiFileList3Line = _RiFileList3Line as any;

type HabitStatus = {
  text: string;
  color: string;
  gradient: string;
  secondaryColor: string;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toString();
};

const getScreenTimeStatus = (minutes: number, isProductive: boolean): HabitStatus => {
  if (isProductive) {
    if (minutes >= 45) return {
      text: 'Chad',
      color: '#00f2ff',
      gradient: 'linear-gradient(90deg, #00f2ff, #0066ff)',
      secondaryColor: '#0066ff'
    };
    if (minutes >= 20) return {
      text: 'Locked in',
      color: '#39ff14',
      gradient: 'linear-gradient(90deg, #39ff14, #059669)',
      secondaryColor: '#059669'
    };
    return {
      text: 'Normie',
      color: '#ff9900',
      gradient: 'linear-gradient(90deg, #ff9900, #ff5500)',
      secondaryColor: '#ff5500'
    };
  } else {
    if (minutes <= 25) return {
      text: 'Locked in',
      color: '#39ff14',
      gradient: 'linear-gradient(90deg, #39ff14, #059669)',
      secondaryColor: '#059669'
    };
    if (minutes <= 45) return {
      text: 'Normie',
      color: '#ff9900',
      gradient: 'linear-gradient(90deg, #ff9900, #ff5500)',
      secondaryColor: '#ff5500'
    };
    return {
      text: 'Cooked',
      color: '#ff0033',
      gradient: 'linear-gradient(90deg, #ff0033, #be123c)',
      secondaryColor: '#be123c'
    };
  }
};

export const PRODUCTIVE_IDS = ['linkedin', 'whatsapp', 'telegram', 'signal', 'zoom', 'gmail', 'maps', 'chrome', 'safari', 'notion', 'chatgpt', 'claude', 'gemini', 'tradingview', 'trading212', 'chess', 'bible', 'myfitnesspal', 'strava', 'workout', 'duolingo', 'upshift', 'cashapp', 'paypal', 'uber'];

export const AVAILABLE_APPS = [
  // Social
  { id: 'facebook', name: 'FACEBOOK', color: '#1877F2', imageUrl: 'https://icon.horse/icon/facebook.com' },
  { id: 'messenger', name: 'MESSENGER', color: '#00B2FF', imageUrl: 'https://icon.horse/icon/messenger.com' },
  { id: 'instagram', name: 'INSTAGRAM', color: '#E1306C', imageUrl: 'https://icon.horse/icon/instagram.com' },
  { id: 'tiktok', name: 'TIKTOK', color: '#ff0050', imageUrl: 'https://icon.horse/icon/tiktok.com' },
  { id: 'snapchat', name: 'SNAPCHAT', color: '#FFFC00', imageUrl: 'https://icon.horse/icon/snapchat.com' },
  { id: 'twitter', name: 'X', color: '#FFFFFF', imageUrl: 'https://icon.horse/icon/x.com' },
  { id: 'pinterest', name: 'PINTEREST', color: '#E60023', imageUrl: 'https://icon.horse/icon/pinterest.com' },
  { id: 'linkedin', name: 'LINKEDIN', color: '#0A66C2', imageUrl: 'https://icon.horse/icon/linkedin.com' },
  { id: 'reddit', name: 'REDDIT', color: '#FF4500', imageUrl: 'https://icon.horse/icon/reddit.com' },
  { id: 'threads', name: 'THREADS', color: '#FFFFFF', imageUrl: 'https://icon.horse/icon/threads.net' },
  
  // Entertainment
  { id: 'youtube', name: 'YOUTUBE', color: '#FF0000', imageUrl: 'https://icon.horse/icon/youtube.com' },
  { id: 'netflix', name: 'NETFLIX', color: '#E50914', imageUrl: 'https://icon.horse/icon/netflix.com' },
  { id: 'spotify', name: 'SPOTIFY', color: '#1DB954', imageUrl: 'https://icon.horse/icon/spotify.com' },
  { id: 'twitch', name: 'TWITCH', color: '#9146FF', imageUrl: 'https://icon.horse/icon/twitch.tv' },
  { id: 'disney', name: 'DISNEY+', color: '#113CCF', imageUrl: 'https://icon.horse/icon/disneyplus.com' },
  { id: 'hulu', name: 'HULU', color: '#1CE783', imageUrl: 'https://icon.horse/icon/hulu.com' },
  { id: 'capcut', name: 'CAPCUT', color: '#FFFFFF', imageUrl: 'https://icon.horse/icon/capcut.com' },

  // Comm / Utilities
  { id: 'whatsapp', name: 'WHATSAPP', color: '#25D366', imageUrl: 'https://icon.horse/icon/whatsapp.com' },
  { id: 'telegram', name: 'TELEGRAM', color: '#0088cc', imageUrl: 'https://icon.horse/icon/telegram.org' },
  { id: 'signal', name: 'SIGNAL', color: '#3A76F0', imageUrl: 'https://icon.horse/icon/signal.org' },
  { id: 'zoom', name: 'ZOOM', color: '#2D8CFF', imageUrl: 'https://icon.horse/icon/zoom.us' },
  { id: 'gmail', name: 'GMAIL', color: '#EA4335', imageUrl: 'https://icon.horse/icon/mail.google.com' },
  { id: 'maps', name: 'GOOGLE MAPS', color: '#34A853', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ed/4d/b0/ed4db0a7-9f7d-ced1-8b97-08155865629b/maps_2025-0-1x_U007epad-0-0-0-1-0-0-sRGB-0-0-85-220-0.png/100x100bb.jpg' },
  { id: 'chrome', name: 'CHROME', color: '#F4B400', imageUrl: 'https://icon.horse/icon/google.com' },
  { id: 'safari', name: 'SAFARI', color: '#007AFF', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/23/4c/cb/234ccbb4-e65a-bb94-f877-3d230743e9e3/safari-0-0-1x_U007epad-0-1-0-sRGB-85-220.png/100x100bb.jpg' },
  { id: 'notion', name: 'NOTION', color: '#FFFFFF', imageUrl: 'https://icon.horse/icon/notion.so' },
  { id: 'chatgpt', name: 'CHATGPT', color: '#10A37F', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1b/45/d6/1b45d659-d8bf-94b0-dfa6-0449fc565333/AppIcon-0-0-1x_U007epad-0-0-0-1-0-P3-85-220.png/100x100bb.jpg' },
  { id: 'claude', name: 'CLAUDE', color: '#D8CCA6', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5b/d9/0f/5bd90fa7-4b86-ac7d-35bd-4915484b39d1/AppIcon-0-0-1x_U007epad-0-1-85-220.png/100x100bb.jpg' },
  { id: 'gemini', name: 'GEMINI', color: '#1B6EF3', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/30/32/46/303246f5-684e-eac9-9617-4c37c9f8a9d6/AppIcon-0-0-1x_U007epad-0-0-0-1-0-0-sRGB-0-0-85-220.png/100x100bb.jpg' },

  // Productivity / Learning Wait wait, it's Utility. Let's make an explicitly new block.
  // Actually they can just be in Comm / Utilities.
  
  // Finance
  { id: 'tradingview', name: 'TRADINGVIEW', color: '#FFFFFF', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b4/a9/22/b4a9228b-7208-9f09-a468-676633943e18/AppIcon-0-0-1x_U007epad-0-11-0-0-0-0-85-220.png/100x100bb.jpg' },
  { id: 'trading212', name: 'TRADING 212', color: '#FF5C28', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3b/8f/6f/3b8f6f1f-0251-bc5a-2297-fd9fd16dba61/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/100x100bb.jpg' },

  // Lifestyle
  { id: 'myfitnesspal', name: 'MYFITNESSPAL', color: '#0066CC', imageUrl: 'https://icon.horse/icon/myfitnesspal.com' },
  { id: 'strava', name: 'STRAVA', color: '#FC4C02', imageUrl: 'https://icon.horse/icon/strava.com' },
  { id: 'workout', name: 'HOME WORKOUT', color: '#ff4444', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/19/c6/56/19c656d9-07b3-ec45-a660-78900bf488f3/AppIcon-0-0-1x_U007epad-0-6-0-sRGB-85-220.png/100x100bb.jpg' },
  { id: 'duolingo', name: 'DUOLINGO', color: '#58CC02', imageUrl: 'https://icon.horse/icon/duolingo.com' },
  { id: 'chess', name: 'CHESS', color: '#7FA650', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/41/01/c5/4101c58c-a5e6-d3de-0b0e-9f52ee7e3708/AppIcon-1x_U007epad-0-1-0-0-85-220-0.png/100x100bb.jpg' },
  { id: 'bible', name: 'BIBLE', color: '#835332', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/f6/7a/a5/f67aa591-e6f2-7946-6aef-a98651601a3b/AppIcon-0-0-1x_U007epad-0-1-0-sRGB-0-85-220.png/100x100bb.jpg' },
  { id: 'tinder', name: 'TINDER', color: '#FE3C72', imageUrl: 'https://icon.horse/icon/tinder.com' },
  { id: 'bumble', name: 'BUMBLE', color: '#FFC629', imageUrl: 'https://icon.horse/icon/bumble.com' },
  { id: 'pornhub', name: 'PORNHUB', color: '#ff9900', imageUrl: 'https://icon.horse/icon/pornhub.com' },
  { id: 'onlyfans', name: 'ONLYFANS', color: '#00AFF0', imageUrl: 'https://icon.horse/icon/onlyfans.com' },
  { id: 'upshift', name: 'UPSHIFT', color: '#75FFF1', imageUrl: upshiftIcon },

  // Commerce
  { id: 'cashapp', name: 'CASH APP', color: '#00D632', imageUrl: 'https://icon.horse/icon/cash.app' },
  { id: 'paypal', name: 'PAYPAL', color: '#003087', imageUrl: 'https://icon.horse/icon/paypal.com' },
  { id: 'uber', name: 'UBER', color: '#FFFFFF', imageUrl: 'https://icon.horse/icon/uber.com' },
  { id: 'ubereats', name: 'UBER EATS', color: '#06C167', imageUrl: 'https://icon.horse/icon/ubereats.com' },
  { id: 'grindr', name: 'GRINDR', color: '#F6A905', imageUrl: 'https://icon.horse/icon/grindr.com' },
  { id: 'goontracker', name: 'GOON TRACKER', color: '#8C52FF', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/da/b2/ef/dab2ef8a-9acd-32db-a7c1-3a389739e355/AppIcon-0-0-1x_U007epad-0-1-85-220.png/100x100bb.jpg' },
  { id: 'clashroyale', name: 'CLASH ROYALE', color: '#3A9DF3', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/1f/a2/1c/1fa21ca0-610d-b058-2cae-ea4a6d785c76/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/100x100bb.jpg' },
  { id: 'wildrift', name: 'WILD RIFT', color: '#D2964C', imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f7/85/94/f78594c0-6649-1909-28af-f33e198648d7/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/100x100bb.jpg' }
];

interface AppUsage {
  id: string;
  appId: string;
  minutes: number;
}

const ScreenTime: React.FC = () => {
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [image, setImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  const [apps, setApps] = useState<AppUsage[]>([
    { id: '1', appId: 'messenger', minutes: 30 },
    { id: '2', appId: 'waze', minutes: 19 },
    { id: '3', appId: 'discord', minutes: 16 },
    { id: '4', appId: 'gmail', minutes: 12 },
    { id: '5', appId: 'whatsapp', minutes: 11 },
    { id: '6', appId: 'workout', minutes: 9 },
  ]);

  // Image Adjustment States
  const [imageX, setImageX] = useState(0);
  const [imageY, setImageY] = useState(0);
  const [imageZoom, setImageZoom] = useState(50);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const updateApp = (id: string, updates: Partial<AppUsage>) => {
    setApps(prev => prev.map(app => app.id === id ? { ...app, ...updates } : app));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setImageX(0);
        setImageY(0);
        setImageZoom(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImageAdjustments = () => {
    setImageX(0);
    setImageY(0);
    setImageZoom(50);
  };

  const handleDownload = async () => {
    if (!mockupRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      const options = {
        cacheBust: true,
        backgroundColor: '#000',
        pixelRatio: 2,
        skipFonts: true,
        style: {
          transform: 'scale(1)',
          margin: '0',
        }
      };
      await toPng(mockupRef.current, options).catch(() => {});
      await toPng(mockupRef.current, options).catch(() => {});
      const dataUrl = await toPng(mockupRef.current, options);

      const link = document.createElement('a');
      link.download = `upshift-screentime-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${+(minutes / 60).toFixed(1)}h`;
  };

  const renderAppRow = (sliceStart: number, sliceEnd: number) => {
    return (
      <div className="cards-row">
        {apps.slice(sliceStart, sliceEnd).map((app) => {
          const isProductive = PRODUCTIVE_IDS.includes(app.appId);
          const status = getScreenTimeStatus(app.minutes, isProductive);
          const appDef = AVAILABLE_APPS.find(a => a.id === app.appId) || AVAILABLE_APPS[0];
          
          return (
            <div key={app.id} className="upshift-card">
              <div className="card-label">
                <img 
                  src={appDef.imageUrl} 
                  alt={appDef.name}
                  style={{ width: '28px', height: '28px', borderRadius: '22.5%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                />
                <span style={{ color: appDef.color }}>{appDef.name}</span>
              </div>
              <div className="card-value-line">
                <span className="value-num">{formatTime(app.minutes)}</span>
                <div className="habit-meta-stack">
                  <div className="status-badge">
                    <div
                      className="rating-dot"
                      style={{
                        backgroundColor: status.color,
                        boxShadow: `0 0 10px ${status.color}`
                      }}
                    />
                    <span className="rating-text" style={{ color: status.color }}>{status.text}</span>
                  </div>
                  <div className="goal-info">
                    <span className="goal-num" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'lowercase', marginTop: '-2px' }}>avg daily</span>
                  </div>
                </div>
              </div>
              <div className="card-progress-bg">
                <div
                  className="card-progress-fill"
                  style={{
                    width: `${Math.min(100, (app.minutes / 60) * 100)}%`,
                    background: status.gradient,
                    boxShadow: `0 0 10px ${status.color}`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`creator-editor-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Desktop/Default Header */}
      <header className="creator-header">
        <Link to={`/creator${fromPortal ? '?from=portal' : ''}`} className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <main className="creator-main">
        {/* LEFT: TEMPLATE PREVIEW */}
        <section className="preview-column">
          <h1>Screen Time Preview</h1>
          <div className="phone-mockup-wrapper">
            <div className="phone-mockup" ref={mockupRef}>
              {/* Header Matching Provided HTML */}
              <div className="upshift-logo-container">
                <img src={upshiftIcon} alt="upshift Logo" className="head-icon" />
                <h3 className="brand-text">Upshift</h3>
                <img src={appStoreImg} alt="Download on App Store" className="app-store-badge-mock" />
              </div>

              {/* Profile Image Matching Provided HTML */}
              <div
                className="circle-image-container"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Profile"
                    style={{
                      transform: `translate(${imageX}px, ${imageY}px) scale(${imageZoom / 100})`,
                      transition: 'none' // Important for smooth dragging feel
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-2">
                    <RiImageAddLine className="w-12 h-12 text-white/40" />
                    <span className="insert-label">Insert Image Here</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Cards Grid Matching Provided HTML structure */}
              <div className="cards-container-mock">
                <div className="cards-grid">
                  {renderAppRow(0, 2)}
                  {renderAppRow(2, 4)}
                  {renderAppRow(4, 6)}
                  <div className="weekly-summary-text">Weekly Summary</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE: CUSTOMIZE RATINGS */}
        <section className="controls-column">
          <h2>Customize Ratings</h2>

          <div className="gender-toggle">
            <button
              className={`toggle-opt ${gender === 'Male' ? 'active' : ''}`}
              onClick={() => setGender('Male')}
            >
              Male
            </button>
            <button
              className={`toggle-opt ${gender === 'Female' ? 'active' : ''}`}
              onClick={() => setGender('Female')}
            >
              Female
            </button>
          </div>

          <label className="upload-card-btn">
            <RiImageAddLine /> Change Image
            <input type="file" hidden onChange={handleImageUpload} />
          </label>

          <div className="adjust-box">
            <h3 className="adjust-title">Adjust Image Position & Size</h3>

            <div className="slider-item">
              <div className="slider-meta">
                <span className="slider-label">Horizontal Position</span>
                <span className="slider-value-box">{imageX}px</span>
              </div>
              <input
                type="range"
                className="upshift-slider"
                min="-500"
                max="500"
                value={imageX}
                onChange={(e) => setImageX(parseInt(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-meta">
                <span className="slider-label">Vertical Position</span>
                <span className="slider-value-box">{imageY}px</span>
              </div>
              <input
                type="range"
                className="upshift-slider"
                min="-500"
                max="500"
                value={imageY}
                onChange={(e) => setImageY(parseInt(e.target.value))}
              />
            </div>

            <div className="slider-item">
              <div className="slider-meta">
                <span className="slider-label">Zoom</span>
                <span className="slider-value-box">{imageZoom}%</span>
              </div>
              <input
                type="range"
                className="upshift-slider"
                min="5"
                max="300"
                value={imageZoom}
                onChange={(e) => setImageZoom(parseInt(e.target.value))}
              />
            </div>

            <button className="reset-btn" onClick={resetImageAdjustments}>
              Reset Position & Zoom
            </button>
          </div>

          <div className="edit-list">
            <h3 className="adjust-title">Customize Apps</h3>
            {apps.map((app, index) => (
              <div key={app.id} className="habit-edit-row">
                <div className="habit-edit-header">
                  <span className="habit-pill">App {index + 1}</span>
                </div>
                <div className="habit-inputs-grid">
                  <div className="input-row">
                    <div className="input-group">
                      <label>Productive</label>
                      <select
                        className="name-input"
                        style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', width: '100%' }}
                        value={PRODUCTIVE_IDS.includes(app.appId) ? app.appId : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateApp(app.id, { appId: e.target.value });
                          }
                        }}
                      >
                        <option value="">-- Select --</option>
                        {AVAILABLE_APPS.filter(a => PRODUCTIVE_IDS.includes(a.id)).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Not Productive</label>
                      <select
                        className="name-input"
                        style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', width: '100%' }}
                        value={!PRODUCTIVE_IDS.includes(app.appId) ? app.appId : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateApp(app.id, { appId: e.target.value });
                          }
                        }}
                      >
                        <option value="">-- Select --</option>
                        {AVAILABLE_APPS.filter(a => !PRODUCTIVE_IDS.includes(a.id)).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Minutes</label>
                      <input
                        type="number"
                        value={app.minutes}
                        onChange={(e) => {
                          let val = Math.max(0, parseFloat(e.target.value) || 0);
                          const otherAppsTotal = apps.filter(a => a.id !== app.id).reduce((sum, a) => sum + a.minutes, 0);
                          if (val + otherAppsTotal > 1440) {
                            val = 1440 - otherAppsTotal;
                          }
                          updateApp(app.id, { minutes: val });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="download-pill-btn"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Generating...' : 'Download Template (.png)'} <RiDownloadLine />
          </button>
        </section>

        {/* RIGHT: HOW TO USE */}
        <section className="info-column">
          <h2>How to Use</h2>
          <div className="instr-list">
            <div className="instr-step">
              <RiImageAddLine className="instr-icon" />
              <div className="instr-text">
                Upload an image and drag to reposition, scroll to zoom
              </div>
            </div>
            <div className="instr-step">
              <RiEqualizerLine className="instr-icon" />
              <div className="instr-text">
                Customize habit names and include emojis to personalize
              </div>
            </div>
            <div className="instr-step">
              <RiFileList3Line className="instr-icon" />
              <div className="instr-text">
                Update Achieved and Goal values to track your current progress
              </div>
            </div>
            <div className="instr-step">
              <RiInformationLine className="instr-icon" />
              <div className="instr-text">
                Download creates a 1080x1920 image perfect for social media
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ScreenTime;

