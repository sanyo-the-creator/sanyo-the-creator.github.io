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
import upshiftIcon from '../../assets/upshiftIcon.png';
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
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toString();
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

interface Habit {
  id: string;
  emoji: string;
  name: string;
  achieved: number;
  goal: number;
  unit?: string;
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

const Quests: React.FC = () => {
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [image, setImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', emoji: '🦷', name: 'BRUSH TEETH', achieved: 7, goal: 7, unit: '\u200B' },
    { id: '2', emoji: '🏃', name: 'DAILY EXERCISE', achieved: 150, goal: 210, unit: 'min' },
    { id: '3', emoji: '🎓', name: 'UNI', achieved: 5, goal: 5, unit: 'h' },
    { id: '4', emoji: '💻', name: 'WORK', achieved: 6, goal: 7, unit: 'h' },
    { id: '5', emoji: '📚', name: 'DAILY READING', achieved: 7, goal: 70, unit: 'pages' },
    { id: '6', emoji: '💊', name: 'PILLS', achieved: 18, goal: 21, unit: '\u200B' },
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

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
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
      // Multiple passes to ensure cross-origin images load on mobile
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
      // Warm-up passes for mobile browsers
      await toPng(mockupRef.current, options).catch(() => {});
      await toPng(mockupRef.current, options).catch(() => {});
      const dataUrl = await toPng(mockupRef.current, options);

      const link = document.createElement('a');
      link.download = `upshift-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className={`creator-editor-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Desktop/Default Header */}
      <header className="creator-header">
        <Link to="/creator" className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <main className="creator-main">
        {/* LEFT: TEMPLATE PREVIEW */}
        <section className="preview-column">
          <h1>Quests Preview</h1>
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
                  {/* upshift and POTENTIAL Row */}
                  <div className="cards-row">
                    {habits.slice(0, 2).map((habit) => {
                      const status = getHabitStatus(habit.achieved, habit.goal, gender);
                      return (
                        <div key={habit.id} className="upshift-card">
                          <div className="card-label">
                            <img src={`https://emojicdn.elk.sh/${habit.emoji}?style=apple`} alt={habit.emoji} className="card-emoji" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            <span>{habit.name}</span>
                          </div>
                          <div className="card-value-line">
                            <span className="value-num">{formatNumber(habit.achieved)}</span>
                            <div className="habit-meta-stack">
                              <div className="status-badge">
                                <div
                                  className="rating-dot"
                                  style={{
                                    backgroundColor: status.color,
                                    boxShadow: `0 0 10px ${status.color}`
                                  }}
                                />
                                <span className="rating-text">{status.text}</span>
                              </div>
                              <div className="goal-info">
                                <span className="goal-slash">/</span>
                                <span className="goal-num">{formatNumber(habit.goal)}{habit.unit ? ` ${habit.unit}` : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="card-progress-bg">
                            <div
                              className="card-progress-fill"
                              style={{
                                width: `${Math.min(100, (habit.achieved / habit.goal) * 100)}%`,
                                background: status.gradient,
                                boxShadow: `0 0 10px ${status.color}`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* EYES and MIDFACE Row */}
                  <div className="cards-row">
                    {habits.slice(2, 4).map((habit) => {
                      const status = getHabitStatus(habit.achieved, habit.goal, gender);
                      return (
                        <div key={habit.id} className="upshift-card">
                          <div className="card-label">
                            <img src={`https://emojicdn.elk.sh/${habit.emoji}?style=apple`} alt={habit.emoji} className="card-emoji" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            <span>{habit.name}</span>
                          </div>
                          <div className="card-value-line">
                            <span className="value-num">{formatNumber(habit.achieved)}</span>
                            <div className="habit-meta-stack">
                              <div className="status-badge">
                                <div
                                  className="rating-dot"
                                  style={{
                                    backgroundColor: status.color,
                                    boxShadow: `0 0 10px ${status.color}`
                                  }}
                                />
                                <span className="rating-text">{status.text}</span>
                              </div>
                              <div className="goal-info">
                                <span className="goal-slash">/</span>
                                <span className="goal-num">{formatNumber(habit.goal)}{habit.unit ? ` ${habit.unit}` : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="card-progress-bg">
                            <div
                              className="card-progress-fill"
                              style={{
                                width: `${Math.min(100, (habit.achieved / habit.goal) * 100)}%`,
                                background: status.gradient,
                                boxShadow: `0 0 10px ${status.color}`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* LOWER and UPPER Row */}
                  <div className="cards-row">
                    {habits.slice(4, 6).map((habit) => {
                      const status = getHabitStatus(habit.achieved, habit.goal, gender);
                      return (
                        <div key={habit.id} className="upshift-card">
                          <div className="card-label">
                            <img src={`https://emojicdn.elk.sh/${habit.emoji}?style=apple`} alt={habit.emoji} className="card-emoji" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            <span>{habit.name}</span>
                          </div>
                          <div className="card-value-line">
                            <span className="value-num">{formatNumber(habit.achieved)}</span>
                            <div className="habit-meta-stack">
                              <div className="status-badge">
                                <div
                                  className="rating-dot"
                                  style={{
                                    backgroundColor: status.color,
                                    boxShadow: `0 0 10px ${status.color}`
                                  }}
                                />
                                <span className="rating-text">{status.text}</span>
                              </div>
                              <div className="goal-info">
                                <span className="goal-slash">/</span>
                                <span className="goal-num">{formatNumber(habit.goal)}{habit.unit ? ` ${habit.unit}` : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="card-progress-bg">
                            <div
                              className="card-progress-fill"
                              style={{
                                width: `${Math.min(100, (habit.achieved / habit.goal) * 100)}%`,
                                background: status.gradient,
                                boxShadow: `0 0 10px ${status.color}`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
            <h3 className="adjust-title">Customize Habits</h3>
            {habits.map((habit, index) => (
              <div key={habit.id} className="habit-edit-row">
                <div className="habit-edit-header">
                  <span className="habit-pill">Habit {index + 1}</span>
                </div>
                <div className="habit-inputs-grid">
                  <div className="input-group">
                    <label>Emoji & Name</label>
                    <div className="emoji-name-inputs">
                      <input
                        type="text"
                        className="emoji-input"
                        value={habit.emoji}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            updateHabit(habit.id, { emoji: '' });
                          } else {
                            const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
                            const segments = Array.from(segmenter.segment(val)) as any[];
                            updateHabit(habit.id, { emoji: segments[0].segment });
                          }
                        }}
                        placeholder="🦷"
                      />
                      <input
                        type="text"
                        className="name-input"
                        value={habit.name}
                        onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                        placeholder="BRUSH TEETH"
                      />
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Achieved</label>
                      <input
                        type="number"
                        value={habit.achieved}
                        onChange={(e) => updateHabit(habit.id, { achieved: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="input-group">
                      <label>Goal</label>
                      <input
                        type="number"
                        value={habit.goal}
                        onChange={(e) => updateHabit(habit.id, { goal: parseFloat(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="input-group">
                      <label>Unit</label>
                      <select
                        className="name-input"
                        style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', width: '100%' }}
                        value={habit.unit || ''}
                        onChange={(e) => updateHabit(habit.id, { unit: e.target.value })}
                      >
                        {UNITS.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
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

export default Quests;

