import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiArrowLeftLine as _RiArrowLeftLine,
  RiDownloadLine as _RiDownloadLine,
  RiImageAddLine as _RiImageAddLine,
  RiInformationLine as _RiInformationLine,
  RiEqualizerLine as _RiEqualizerLine,
  RiFileList3Line as _RiFileList3Line,
  RiVideoLine as _RiVideoLine
} from 'react-icons/ri';
import { toPng, toCanvas } from 'html-to-image';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import RecordRTC from 'recordrtc';
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
const RiVideoLine = _RiVideoLine as any;

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
  const [isRecording, setIsRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(1);
  const [recordingStep, setRecordingStep] = useState(0);
  const [videoDuration, setVideoDuration] = useState(1.5);
  const mockupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

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
      await toPng(mockupRef.current, options).catch(() => { });
      await toPng(mockupRef.current, options).catch(() => { });
      const dataUrl = await toPng(mockupRef.current, options);
      const link = document.createElement('a');
      link.download = `upshift-mix-image.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!mockupRef.current || isDownloading || isRecording) return;

    setIsRecording(true);
    setRecordingStep(0);

    // Stable colorSpace that mp4-muxer's videoSampleDescription always needs
    const SAFE_COLOR_SPACE = {
      fullRange: false,
      matrix: 'bt709' as VideoMatrixCoefficients,
      primaries: 'bt709' as VideoColorPrimaries,
      transfer: 'bt709' as VideoTransferCharacteristics,
    };

    try {
      const fps = 30;
      const durationSeconds = videoDuration;
      const numFrames = Math.floor(fps * durationSeconds);

      // Use offsetWidth/offsetHeight — these are layout dimensions unaffected
      // by scroll position or viewport clipping, matching what toPng captures.
      const el = mockupRef.current!;
      const devicePixelRatio = window.devicePixelRatio || 2;
      const width = Math.round(el.offsetWidth * devicePixelRatio);
      const height = Math.round(el.offsetHeight * devicePixelRatio);

      // AVC requires dimensions divisible by 2
      const safeWidth = width % 2 === 0 ? width : width - 1;
      const safeHeight = height % 2 === 0 ? height : height - 1;

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: safeWidth,
          height: safeHeight,
        },
        fastStart: 'in-memory',
      });

      // Keep the last valid decoderConfig so chunks after the first keyframe
      // still have a config to pass to addVideoChunk.
      let lastDecoderConfig: any = null;

      const videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => {
          // Build a safe config: prefer what the browser reports, but always
          // inject a concrete colorSpace so mp4-muxer never receives null.
          const rawConfig = metadata?.decoderConfig ?? lastDecoderConfig;
          if (!rawConfig) {
            // No config yet – this chunk can't be muxed; skip it.
            return;
          }

          const safeConfig = {
            ...rawConfig,
            colorSpace: rawConfig.colorSpace
              ? { ...rawConfig.colorSpace, ...SAFE_COLOR_SPACE }
              : SAFE_COLOR_SPACE,
          };
          lastDecoderConfig = safeConfig;

          muxer.addVideoChunk(chunk, {
            ...metadata,
            decoderConfig: safeConfig,
          });
        },
        error: (e) => console.error('VideoEncoder error:', e),
      });

      videoEncoder.configure({
        codec: 'avc1.4D0029',
        width: safeWidth,
        height: safeHeight,
        bitrate: 6_000_000,
        framerate: fps,
        // Software encoding avoids GPU colorSpace quirks that produce null configs
        hardwareAcceleration: 'prefer-software',
      });

      // Off-screen canvas for compositing frames
      const buffer = document.createElement('canvas');
      buffer.width = safeWidth;
      buffer.height = safeHeight;
      const ctx = buffer.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Failed to get 2D context');

      // Capture at 10fps, repeat each frame 3x → 30fps output.
      // 3x fewer toPng calls = 3x faster encoding.
      const captureFps = 10;
      const repeatCount = Math.round(fps / captureFps);
      const captureFrames = Math.ceil(durationSeconds * captureFps);
      let encodedCount = 0;

      for (let ci = 0; ci < captureFrames; ci++) {
        const progress = ci < Math.ceil(captureFrames / 3)
          ? ci / Math.max(Math.ceil(captureFrames / 3) - 1, 1)
          : 1;
        setVideoProgress(progress);
        setRecordingStep(Math.round((ci / captureFrames) * numFrames));

        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 60));

        const dataUrl = await toPng(mockupRef.current!, {
          cacheBust: false,
          pixelRatio: devicePixelRatio,
          style: { transform: 'scale(1)', margin: '0' },
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Frame image failed to load'));
          img.src = dataUrl;
        });

        ctx.drawImage(img, 0, 0, safeWidth, safeHeight);

        for (let rep = 0; rep < repeatCount; rep++) {
          if (encodedCount >= numFrames) break;
          const frame = new VideoFrame(buffer, {
            timestamp: Math.round((encodedCount * 1_000_000) / fps),
            duration: Math.round(1_000_000 / fps),
          });
          videoEncoder.encode(frame, { keyFrame: encodedCount % fps === 0 });
          frame.close();
          encodedCount++;
        }

        if (videoEncoder.encodeQueueSize > 10) {
          await new Promise(r => setTimeout(r, 8));
        }
      }

      await videoEncoder.flush();
      muxer.finalize();

      const { buffer: resultBuffer } = muxer.target as ArrayBufferTarget;
      const blob = new Blob([resultBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `upshift-mix-video.mp4`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('MP4 export failed:', err);
      alert(`Export Failed!\nError: ${err.message}`);
    } finally {
      setIsRecording(false);
      setVideoProgress(1);
    }
  };

  const renderCardVisual = (card: MixCard) => {
    if (card.mode === 'quest') {
      const status = getHabitStatus(card.achieved, card.goal, gender);
      return (
        <div key={card.id} className="upshift-card">
          <div className="card-label">
            <img
              src={`https://emojicdn.elk.sh/${card.emoji}?style=apple`}
              alt={card.emoji}
              className="card-emoji"
              crossOrigin="anonymous"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
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
          <div className="card-progress-bg" >
            <div
              className="card-progress-fill"
              style={{
                width: `${Math.min(100, (card.achieved * videoProgress / card.goal) * 100)}%`,
                background: status.gradient
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
            <img src={appDef.imageUrl} alt={appDef.name} className="card-emoji" crossOrigin="anonymous" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
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
          <div className="card-progress-bg" >
            <div
              className="card-progress-fill"
              style={{
                width: `${Math.min(100, videoProgress * 100)}%`,
                background: status.gradient
              }}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`creator-editor-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''} ${isRecording ? 'is-recording' : ''}`}>
      <header className="creator-header">
        <Link to={`/creator${fromPortal ? '?from=portal' : ''}`} className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <main className="creator-main">
        {/* LEFT: TEMPLATE PREVIEW */}
        <section className="preview-column">
          <h1>Mix Preview</h1>

          <div className="phone-mockup-wrapper">
            <div className={`phone-mockup ${isRecording ? "is-recording" : ""}`} ref={mockupRef}>
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
                      crossOrigin="anonymous"
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

          <div className="download-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <button
              className="download-pill-btn"
              onClick={handleDownload}
              disabled={isDownloading || isRecording}
            >
              {isDownloading ? 'Generating Image...' : 'Download Template (.png)'} <RiDownloadLine />
            </button>

            <div className="adjust-box" style={{ marginBottom: '0' }}>
              <div className="slider-item">
                <div className="slider-meta">
                  <span className="slider-label">Video Duration</span>
                  <span className="slider-value-box">{videoDuration.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  className="upshift-slider"
                  min="1.5"
                  max="10"
                  step="0.5"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(parseFloat(e.target.value))}
                  disabled={isRecording}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                  <span>1.5s</span>
                  <span>10s</span>
                </div>
              </div>
            </div>

            <button
              className="download-pill-btn"
              style={{ borderColor: 'rgb(117, 255, 241)', color: 'rgb(117, 255, 241)' }}
              onClick={handleDownloadVideo}
              disabled={isDownloading || isRecording}
            >
              {isRecording ? `Generating MP4 (${Math.round((recordingStep / Math.floor(30 * videoDuration)) * 100)}%)...` : 'Download Video (MP4)'} <RiVideoLine />
            </button>
          </div>
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
      <canvas
        id="record-canvas-mix"
        width={1080}
        height={1920}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}
      />
    </div>
  );
};

export default Mix;