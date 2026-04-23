import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

import { AVAILABLE_APPS, PRODUCTIVE_IDS } from './ScreenTime';

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
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toString();
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${+(minutes / 60).toFixed(1)}h`;
};

const getHabitStatus = (achieved: number, goal: number, gender: 'Male' | 'Female'): HabitStatus => {
  const percent = (achieved / goal) * 100;
  if (percent >= 100) return {
    text: gender === 'Male' ? 'Chad' : 'Queen',
    color: '#00f2ff',
    gradient: 'linear-gradient(90deg, #00f2ff, #0066ff)',
    secondaryColor: '#0066ff'
  };
  if (percent >= 66) return {
    text: 'Locked in',
    color: '#a855f7',
    gradient: 'linear-gradient(90deg, #a855f7, #6366f1)',
    secondaryColor: '#6366f1'
  };
  if (percent >= 33) return {
    text: 'Normie',
    color: '#39ff14',
    gradient: 'linear-gradient(90deg, #39ff14, #059669)',
    secondaryColor: '#059669'
  };
  return {
    text: gender === 'Male' ? 'Cooked' : 'Falling off',
    color: '#ff0033',
    gradient: 'linear-gradient(90deg, #ff0033, #be123c)',
    secondaryColor: '#be123c'
  };
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

type CardMode = 'quest' | 'screentime';

interface MixCard {
  id: string;
  mode: CardMode;

  // Quest Data
  emoji: string;
  name: string;
  achieved: number;
  goal: number;
  unit: string;

  // Screentime Data
  appId: string;
  minutes: number;
}

const UNITS = [
  { label: 'None', value: '' },
  { label: 'Minutes (min)', value: 'min' },
  { label: 'Hours (h)', value: 'h' },
  { label: 'Seconds (s)', value: 's' },
  { label: 'Grams (g)', value: 'g' },
  { label: 'Kilograms (kg)', value: 'kg' },
  { label: 'Kilometers (km)', value: 'km' },
  { label: 'Miles (mi)', value: 'mi' },
  { label: 'Pages (pages)', value: 'pages' },
  { label: 'Times', value: '\u200B' },
  { label: 'Dollars ($)', value: '$' },
  { label: 'Millions (mil)', value: 'mil' },
  { label: 'Calories (kcal)', value: 'kcal' },
  { label: 'Liters (L)', value: 'L' },
  { label: 'Milliliters (ml)', value: 'ml' },
  { label: 'Percent (%)', value: '%' },
];

const Mix: React.FC = () => {
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [image, setImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cards, setCards] = useState<MixCard[]>([
    { id: '1', mode: 'quest', emoji: '🦷', name: 'BRUSH TEETH', achieved: 7, goal: 7, unit: '\u200B', appId: 'messenger', minutes: 30 },
    { id: '2', mode: 'quest', emoji: '🏃', name: 'DAILY EXERCISE', achieved: 150, goal: 210, unit: 'min', appId: 'youtube', minutes: 120 },
    { id: '3', mode: 'screentime', emoji: '🎓', name: 'UNI', achieved: 5, goal: 5, unit: 'h', appId: 'instagram', minutes: 45 },
    { id: '4', mode: 'screentime', emoji: '💻', name: 'WORK', achieved: 6, goal: 7, unit: 'h', appId: 'tiktok', minutes: 180 },
    { id: '5', mode: 'quest', emoji: '📚', name: 'DAILY READING', achieved: 7, goal: 70, unit: 'pages', appId: 'whatsapp', minutes: 15 },
    { id: '6', mode: 'quest', emoji: '💊', name: 'PILLS', achieved: 18, goal: 21, unit: '\u200B', appId: 'spotify', minutes: 60 },
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

  const updateCard = (id: string, updates: Partial<MixCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
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
        style: { transform: 'scale(1)', margin: '0' }
      };
      await toPng(mockupRef.current, options).catch(() => {});
      await toPng(mockupRef.current, options).catch(() => {});
      const dataUrl = await toPng(mockupRef.current, options);
      const link = document.createElement('a');
      link.download = `upshift-mix-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderCardVisual = (card: MixCard) => {
    if (card.mode === 'quest') {
      const status = getHabitStatus(card.achieved, card.goal, gender);
      return (
        <div key={card.id} className="upshift-card">
          <div className="card-label">
            <img src={`https://emojicdn.elk.sh/${card.emoji}?style=apple`} alt={card.emoji} className="card-emoji" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span>{card.name}</span>
          </div>
          <div className="card-value-line">
            <span className="value-num">{formatNumber(card.achieved)}</span>
            <div className="habit-meta-stack">
              <div className="status-badge">
                <div
                  className="rating-dot"
                  style={{ backgroundColor: status.color, boxShadow: `0 0 10px ${status.color}` }}
                />
                <span className="rating-text">{status.text}</span>
              </div>
              <div className="goal-info">
                <span className="goal-slash">/</span>
                <span className="goal-num">{formatNumber(card.goal)}{card.unit ? ` ${card.unit}` : ''}</span>
              </div>
            </div>
          </div>
          <div className="card-progress-bg">
            <div
              className="card-progress-fill"
              style={{
                width: `${Math.min(100, (card.achieved / card.goal) * 100)}%`,
                background: status.gradient,
                boxShadow: `0 0 10px ${status.color}`
              }}
            />
          </div>
        </div>
      );
    } else {
      const isProductive = PRODUCTIVE_IDS.includes(card.appId);
      const status = getScreenTimeStatus(card.minutes, isProductive);
      const appDef = AVAILABLE_APPS.find(a => a.id === card.appId) || AVAILABLE_APPS[0];
      return (
        <div key={card.id} className="upshift-card">
          <div className="card-label">
            <img 
              src={appDef.imageUrl} 
              alt={appDef.name}
              style={{ width: '28px', height: '28px', borderRadius: '22.5%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            />
            <span style={{ color: appDef.color }}>{appDef.name}</span>
          </div>
          <div className="card-value-line">
            <span className="value-num">{formatTime(card.minutes)}</span>
            <div className="habit-meta-stack">
              <div className="status-badge">
                <div
                  className="rating-dot"
                  style={{ backgroundColor: status.color, boxShadow: `0 0 10px ${status.color}` }}
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
                width: `${Math.min(100, (card.minutes / 60) * 100)}%`,
                background: status.gradient,
                boxShadow: `0 0 10px ${status.color}`
              }}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`creator-editor-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <header className="creator-header">
        <Link to="/creator" className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <main className="creator-main">
        {/* LEFT: TEMPLATE PREVIEW */}
        <section className="preview-column">
          <h1>Mix Preview</h1>

          <div className="phone-mockup-wrapper">
            <div className="phone-mockup" ref={mockupRef}>
              <div className="mockup-content">
                <div className="upshift-logo-container">
                  <img src={upshiftIcon} alt="upshift Logo" className="head-icon" />
                  <h3 className="brand-text">Upshift</h3>
                  <img src={appStoreImg} alt="Download on App Store" className="app-store-badge-mock" />
                </div>

                <div className="circle-image-container" onClick={() => fileInputRef.current?.click()}>
                  {image ? (
                    <img
                      src={image}
                      alt="Profile"
                      style={{
                        transform: `translate(${imageX}px, ${imageY}px) scale(${imageZoom / 100})`,
                        transition: 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-2">
                      <RiImageAddLine className="w-12 h-12 text-white/40" />
                      <span className="insert-label">Insert Image Here</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="cards-container-mock">
                  <div className="cards-grid">
                    <div className="cards-row">
                      {cards.slice(0, 2).map(renderCardVisual)}
                    </div>
                    <div className="cards-row">
                      {cards.slice(2, 4).map(renderCardVisual)}
                    </div>
                    <div className="cards-row">
                      {cards.slice(4, 6).map(renderCardVisual)}
                    </div>
                    <div className="weekly-summary-text">Weekly Summary</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE: CUSTOMIZE RATINGS */}
        <section className="controls-column">
          <h2>Customize Ratings</h2>

          <div className="gender-toggle">
            <button className={`toggle-opt ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}>Male</button>
            <button className={`toggle-opt ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}>Female</button>
          </div>

          <label className="upload-card-btn">
            <RiImageAddLine /> Change Image
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
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
            <h3 className="adjust-title">Customize Grid</h3>
            {cards.map((card, index) => (
              <div key={card.id} className="habit-edit-row">
                <div className="habit-edit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="habit-pill">Slot {index + 1}</span>
                  <div className="mode-toggle" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{ padding: '4px 12px', borderRadius: '12px', border: '1px solid #333', background: card.mode === 'quest' ? '#6366f1' : '#111', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      onClick={() => updateCard(card.id, { mode: 'quest' })}
                    >
                      Quest
                    </button>
                    <button 
                      style={{ padding: '4px 12px', borderRadius: '12px', border: '1px solid #333', background: card.mode === 'screentime' ? '#a855f7' : '#111', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                      onClick={() => updateCard(card.id, { mode: 'screentime' })}
                    >
                      App Usage
                    </button>
                  </div>
                </div>
                
                <div className="habit-inputs-grid">
                  {card.mode === 'quest' ? (
                    <>
                      <div className="input-group">
                        <label>Emoji & Name</label>
                        <div className="emoji-name-inputs">
                          <input
                            type="text"
                            className="emoji-input"
                            value={card.emoji}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                updateCard(card.id, { emoji: '' });
                              } else {
                                const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
                                const segments = Array.from(segmenter.segment(val)) as any[];
                                updateCard(card.id, { emoji: segments[0].segment });
                              }
                            }}
                            placeholder="🦷"
                          />
                          <input
                            type="text"
                            className="name-input"
                            value={card.name}
                            onChange={(e) => updateCard(card.id, { name: e.target.value })}
                            placeholder="BRUSH TEETH"
                          />
                        </div>
                      </div>
                      <div className="input-row">
                        <div className="input-group">
                          <label>Achieved</label>
                          <input
                            type="number"
                            value={card.achieved}
                            onChange={(e) => updateCard(card.id, { achieved: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="input-group">
                          <label>Goal</label>
                          <input
                            type="number"
                            value={card.goal}
                            onChange={(e) => updateCard(card.id, { goal: parseFloat(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="input-group">
                          <label>Unit</label>
                          <select
                            className="name-input"
                            style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', width: '100%' }}
                            value={card.unit || ''}
                            onChange={(e) => updateCard(card.id, { unit: e.target.value })}
                          >
                            {UNITS.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="input-row">
                        <div className="input-group">
                          <label>Productive</label>
                          <select
                            className="name-input"
                            style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', width: '100%' }}
                            value={PRODUCTIVE_IDS.includes(card.appId) ? card.appId : ''}
                            onChange={(e) => {
                              if (e.target.value) updateCard(card.id, { appId: e.target.value });
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
                            value={!PRODUCTIVE_IDS.includes(card.appId) ? card.appId : ''}
                            onChange={(e) => {
                              if (e.target.value) updateCard(card.id, { appId: e.target.value });
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
                            value={card.minutes}
                            onChange={(e) => {
                              let val = Math.max(0, parseFloat(e.target.value) || 0);
                              const otherAppsTotal = cards.filter(a => a.id !== card.id && a.mode === 'screentime').reduce((sum, a) => sum + a.minutes, 0);
                              if (val + otherAppsTotal > 1440) {
                                val = 1440 - otherAppsTotal;
                              }
                              updateCard(card.id, { minutes: val });
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
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

        {/* RIGHT: IMAGE SETTINGS */}
        <section className="info-column">
          <div className="info-card gradient-border details-info">
            <h3><RiFileList3Line /> Mix & Match Guide</h3>
            <p><strong>Quest Mode:</strong></p>
            <ul>
              <li>Emoji formatting and habit progression visualization.</li>
              <li>Toggle between Units spanning minutes, kilos, etc.</li>
            </ul>
            <p><strong>App Usage Mode:</strong></p>
            <ul>
              <li>High-fidelity dynamic squircle masking pulling App Store icons directly.</li>
              <li>Categorized between Productive (No Cooked) and Non-Productive (No Chad).</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Mix;
