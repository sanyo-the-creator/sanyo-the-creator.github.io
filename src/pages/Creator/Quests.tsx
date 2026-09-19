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
import { supabase } from '../../lib/supabase';
import appStoreImg from '../../assets/appStore.png';
import './Creator.css';
import ImageCropModal from './ImageCropModal';
import { MOCKUP_THEMES, DEFAULT_THEME_ID, getMockupTheme, ThemeLayers } from './mockupThemes';
import { useStatPresets } from './useStatPresets';
import { freezeAnimationsAt } from './captureAnimations';
import { makeShadowsExportSafe } from './exportSafeShadows';

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

/**
 * Calories and sleep are targets rather than things to maximise: blowing past
 * the goal is as bad as falling short, so they are scored on how far the value
 * sits from the goal in either direction.
 */
const isTargetUnit = (name: string, unit?: string): boolean =>
  unit === 'kcal' || /\bsleep\b/i.test(name);

/** The type actually used for scoring, auto-detecting calories and sleep. */
const resolveQuestType = (habit: { name: string; unit?: string; type?: QuestType }): QuestType =>
  habit.type ?? (isTargetUnit(habit.name, habit.unit) ? 'target' : 'build');

/**
 * Quit quests score the other way round: in the app a quit quest counts as
 * completed when the value stays under the goal, so 0 relapses against a goal
 * of 0 is a perfect score and going over it at all is a fail.
 */
const getScorePercent = (achieved: number, goal: number, type: QuestType = 'build'): number => {
  if (type === 'quit') {
    return achieved <= goal ? 100 : 0;
  }
  if (type === 'target') {
    if (goal <= 0) return achieved > 0 ? 0 : 100;
    const deviation = Math.abs(achieved - goal) / goal;
    if (deviation <= 0.1) return 100;
    if (deviation <= 0.25) return 66;
    if (deviation <= 0.4) return 33;
    return 0;
  }
  if (goal <= 0) return achieved > 0 ? 100 : 0;
  return (achieved / goal) * 100;
};

const getHabitStatus = (
  achieved: number,
  goal: number,
  gender: 'Male' | 'Female',
  type: QuestType = 'build'
): HabitStatus => {
  const percent = getScorePercent(achieved, goal, type);
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

type QuestType = 'build' | 'quit' | 'target';

interface Habit {
  id: string;
  emoji: string;
  name: string;
  achieved: number;
  goal: number;
  unit?: string;
  /**
   * 'build' grows a habit and 'quit' breaks one (QuestType in the app);
   * 'target' is for values like calories and sleep, where overshooting the
   * goal is just as bad as missing it. Left unset, calories and sleep are
   * detected automatically.
   */
  type?: QuestType;
}

/**
 * Value shown on a card. During a video export it counts up from 0 to the real
 * number alongside the progress bar; outside a recording videoProgress is 1,
 * so the preview always shows the final value.
 */
/**
 * html-to-image paints its `backgroundColor` onto the clone's root, replacing
 * whatever the node had - which wiped the galaxy theme's own #0a0a1a and made
 * every export darker than the page. Hand it the node's real colour, falling
 * back to black only when the node is transparent (which is what shows through
 * on the page anyway).
 */
const mockupBackground = (el: HTMLElement | null): string => {
  if (!el) return '#000';
  const color = getComputedStyle(el).backgroundColor;
  return !color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent' ? '#000' : color;
};

const getDisplayValue = (value: number, videoProgress: number): number =>
  value * videoProgress;

/** Fill of the progress bar, mirroring how each quest type is scored. */
const getProgressWidth = (habit: Habit, videoProgress: number): number => {
  const type = resolveQuestType(habit);
  if (type === 'quit') {
    return Math.min(100, getScorePercent(habit.achieved * videoProgress, habit.goal, 'quit'));
  }
  if (habit.goal <= 0) return 0;
  // A target quest fills toward its goal and stops there, however far over it goes.
  return Math.min(100, (habit.achieved * videoProgress / habit.goal) * 100);
};

/**
 * The two stat presets behind the Good / Chopped switch. "Good" is the setup
 * the page ships with; "Chopped" is the same six quests, falling off.
 */
const GOOD_HABITS: Habit[] = [
  { id: '1', emoji: '🦷', name: 'BRUSH TEETH', achieved: 7, goal: 7, unit: '\u200B' },
  { id: '2', emoji: '🏃', name: 'DAILY EXERCISE', achieved: 150, goal: 210, unit: 'min' },
  { id: '3', emoji: '🎓', name: 'UNI', achieved: 5, goal: 5, unit: 'h' },
  { id: '4', emoji: '💻', name: 'WORK', achieved: 6, goal: 7, unit: 'h' },
  { id: '5', emoji: '📚', name: 'DAILY READING', achieved: 7, goal: 70, unit: 'pages' },
  { id: '6', emoji: '❌', name: 'RELAPSES', achieved: 0, goal: 0, unit: '\u200B', type: 'quit' },
];

const CHOPPED_HABITS: Habit[] = [
  { id: '1', emoji: '🦷', name: 'BRUSH TEETH', achieved: 2, goal: 7, unit: '\u200B' },
  { id: '2', emoji: '🏃', name: 'DAILY EXERCISE', achieved: 30, goal: 210, unit: 'min' },
  { id: '3', emoji: '🎓', name: 'UNI', achieved: 1, goal: 5, unit: 'h' },
  { id: '4', emoji: '💻', name: 'WORK', achieved: 2, goal: 7, unit: 'h' },
  { id: '5', emoji: '📚', name: 'DAILY READING', achieved: 5, goal: 70, unit: 'pages' },
  { id: '6', emoji: '❌', name: 'RELAPSES', achieved: 4, goal: 0, unit: '\u200B', type: 'quit' },
];

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
  const [isRecording, setIsRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(1);
  const [recordingStep, setRecordingStep] = useState(0);
  const [videoDuration, setVideoDuration] = useState(1.5);
  // iPhone has no WebCodecs support. Mac/iPad do. Detect by UA + touch (not pointer).
  const isIphone = /iPhone|iPod/.test(navigator.userAgent);
  const supportsVideoExport = !isIphone && typeof (window as any).VideoEncoder !== 'undefined';
  const mockupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  const {
    level: statLevel,
    selectLevel: applyStatLevel,
    items: habits,
    setItems: setHabits,
    saveCurrent: saveStatPreset,
    resetPresets: resetStatPresets,
    savedAt,
  } = useStatPresets<Habit>('upshift-creator-quests-presets', {
    Good: GOOD_HABITS,
    Chopped: CHOPPED_HABITS,
  });

  // Image Adjustment States
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [imageX, setImageX] = useState(0);
  const [imageY, setImageY] = useState(0);
  const [imageZoom, setImageZoom] = useState(50);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits((prev: Habit[]) => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingCropSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Allow picking the same file again after cancelling the cropper.
    e.target.value = '';
  };

  const handleCropConfirm = (cropped: string) => {
    setImage(cropped);
    setPendingCropSrc(null);
    setImageX(0);
    setImageY(0);
    setImageZoom(100);
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
        backgroundColor: mockupBackground(mockupRef.current),
        pixelRatio: 2,
        skipFonts: true,
        style: {
          transform: 'scale(1)',
          margin: '0',
        }
      };
      // Hold the themed animations exactly where they are on screen (no seek),
      // so the exported still matches the preview at the moment of the click.
      const releaseAnimations = freezeAnimationsAt(mockupRef.current);
      const releaseShadows = makeShadowsExportSafe(mockupRef.current);
      let dataUrl: string;
      try {
        // Warm-up passes for mobile browsers
        await toPng(mockupRef.current, options).catch(() => { });
        await toPng(mockupRef.current, options).catch(() => { });
        dataUrl = await toPng(mockupRef.current, options);
      } finally {
        releaseShadows();
        releaseAnimations();
      }

      const link = document.createElement('a');
      link.download = `upshift-quests-image.png`;
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

    // iOS Safari does not support WebCodecs — fall back to MediaRecorder
    const hasWebCodecs = typeof (window as any).VideoEncoder !== 'undefined';
    if (!hasWebCodecs) {
      await handleDownloadVideoMediaRecorder();
      return;
    }

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

      const el = mockupRef.current!;
      // Fixed 2x, matching the PNG export: window.devicePixelRatio is 1 on a
      // non-retina display, which was halving the video to 540x960.
      const exportScale = 2;
      const width = Math.round(el.offsetWidth * exportScale);
      const height = Math.round(el.offsetHeight * exportScale);
      const safeWidth = width % 2 === 0 ? width : width - 1;
      const safeHeight = height % 2 === 0 ? height : height - 1;

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: safeWidth, height: safeHeight },
        fastStart: 'in-memory',
      });

      let lastDecoderConfig: any = null;
      const videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => {
          const rawConfig = metadata?.decoderConfig ?? lastDecoderConfig;
          if (!rawConfig) return;
          const safeConfig = {
            ...rawConfig,
            colorSpace: rawConfig.colorSpace
              ? { ...rawConfig.colorSpace, ...SAFE_COLOR_SPACE }
              : SAFE_COLOR_SPACE,
          };
          lastDecoderConfig = safeConfig;
          muxer.addVideoChunk(chunk, { ...metadata, decoderConfig: safeConfig });
        },
        error: (e) => console.error('VideoEncoder error:', e),
      });

      const codecCandidates: VideoEncoderConfig[] = [
        // High profile first - it is the best fit for the themes' smooth dark
        // gradients. The plain Main/Baseline entries stay as fallbacks, without
        // the extra hints, so browsers that reject those fields still export.
        { codec: 'avc1.640029', width: safeWidth, height: safeHeight, bitrate: 16_000_000, framerate: fps, latencyMode: 'quality', hardwareAcceleration: 'prefer-software' },
        { codec: 'avc1.640029', width: safeWidth, height: safeHeight, bitrate: 16_000_000, framerate: fps, hardwareAcceleration: 'no-preference' },
        { codec: 'avc1.4D0029', width: safeWidth, height: safeHeight, bitrate: 16_000_000, framerate: fps, hardwareAcceleration: 'prefer-software' },
        { codec: 'avc1.42E01F', width: safeWidth, height: safeHeight, bitrate: 16_000_000, framerate: fps, hardwareAcceleration: 'prefer-software' },
        { codec: 'avc1.4D0029', width: safeWidth, height: safeHeight, bitrate: 16_000_000, framerate: fps, hardwareAcceleration: 'no-preference' },
        { codec: 'avc1.42E01F', width: safeWidth, height: safeHeight, bitrate: 16_000_000, framerate: fps, hardwareAcceleration: 'no-preference' },
      ];

      let configured = false;
      for (const candidate of codecCandidates) {
        try {
          const support = await VideoEncoder.isConfigSupported(candidate);
          if (support.supported) {
            videoEncoder.configure(candidate);
            configured = true;
            break;
          }
        } catch { /* try next */ }
      }
      if (!configured) throw new Error('No supported video codec found on this device/browser.');

      const buffer = document.createElement('canvas');
      buffer.width = safeWidth;
      buffer.height = safeHeight;
      const ctx = buffer.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Failed to get 2D context');

      // Every output frame is captured for its own moment: repeating a slower
      // capture across several frames is what made the motion step.
      const rampSeconds = Math.min(durationSeconds * 0.6, 2);
      const rampFrames = Math.max(2, Math.round(rampSeconds * fps));

      for (let fi = 0; fi < numFrames; fi++) {
        const linear = Math.min(1, fi / Math.max(rampFrames - 1, 1));
        // Eased out, so the values slow into their final number.
        const progress = 1 - Math.pow(1 - linear, 3);
        const inRamp = fi < rampFrames;

        setVideoProgress(progress);
        setRecordingStep(fi);

        await new Promise(r => requestAnimationFrame(r));
        // Let React commit the new values before grabbing the frame; once they
        // have settled only the theme is moving, so no wait is needed.
        if (inRamp) await new Promise(r => setTimeout(r, 30));

        // Hold every themed animation at this frame's moment so the clone
        // html-to-image rasterises shows the same thing the preview does.
        const releaseAnimations = freezeAnimationsAt(mockupRef.current!, fi / fps);
        const releaseShadows = makeShadowsExportSafe(mockupRef.current!);
        let dataUrl: string;
        try {
          dataUrl = await toPng(mockupRef.current!, {
            cacheBust: false,
            pixelRatio: exportScale,
            style: { transform: 'scale(1)', margin: '0' },
          });
        } finally {
          releaseShadows();
          releaseAnimations();
        }

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Frame image failed to load'));
          img.src = dataUrl;
        });

        ctx.drawImage(img, 0, 0, safeWidth, safeHeight);

        const frame = new VideoFrame(buffer, {
          timestamp: Math.round((fi * 1_000_000) / fps),
          duration: Math.round(1_000_000 / fps),
        });
        videoEncoder.encode(frame, { keyFrame: fi % fps === 0 });
        frame.close();

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
      link.download = `upshift-quests-video.mp4`;
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

  const handleDownloadVideoMediaRecorder = async () => {
    if (!mockupRef.current) return;

    // 30fps so the bars move as smoothly as in the WebCodecs path.
    const captureFps = 30;
    const durationSeconds = videoDuration;
    const captureFrames = Math.ceil(durationSeconds * captureFps);

    const el = mockupRef.current!;
    // Fixed 2x, matching the PNG export, rather than the display's pixel ratio.
    const exportScale = 2;
    const safeWidth = Math.round(el.offsetWidth * exportScale);
    const safeHeight = Math.round(el.offsetHeight * exportScale);

    const buffer = document.createElement('canvas');
    buffer.width = safeWidth;
    buffer.height = safeHeight;
    const ctx = buffer.getContext('2d', { alpha: false })!;

    const mimeTypes = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';

    const stream = (buffer as any).captureStream(captureFps);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.start();

    try {
      // Ramp over the first frames, then hold - see the WebCodecs path.
      const rampSeconds = Math.min(durationSeconds * 0.6, 2);
      const rampFrames = Math.max(2, Math.round(rampSeconds * captureFps));

      for (let ci = 0; ci < captureFrames; ci++) {
        const linear = Math.min(1, ci / Math.max(rampFrames - 1, 1));
        // Eased out, so the values slow into their final number.
        const progress = 1 - Math.pow(1 - linear, 3);
        setVideoProgress(progress);
        setRecordingStep(ci);

        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 30));

        // Hold every themed animation at this frame's moment so the clone
        // html-to-image rasterises shows the same thing the preview does.
        const releaseAnimations = freezeAnimationsAt(mockupRef.current!, ci / captureFps);
        const releaseShadows = makeShadowsExportSafe(mockupRef.current!);
        let dataUrl: string;
        try {
          dataUrl = await toPng(mockupRef.current!, {
            cacheBust: false,
            pixelRatio: exportScale,
            style: { transform: 'scale(1)', margin: '0' },
          });
        } finally {
          releaseShadows();
          releaseAnimations();
        }

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Frame load failed'));
          img.src = dataUrl;
        });
        ctx.drawImage(img, 0, 0, safeWidth, safeHeight);

        await new Promise(r => setTimeout(r, 1000 / captureFps));
      }
    } finally {
      await new Promise<void>(resolve => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `upshift-quests-video.${ext}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setIsRecording(false);
      setVideoProgress(1);
    }
  };


  return (
    <div className={`creator-editor-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''} ${isRecording ? 'is-recording' : ''}`}>
      {/* Desktop/Default Header */}
      <header className="creator-header">
        <Link to={`/creator${fromPortal ? '?from=portal' : ''}`} className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <main className="creator-main">
        {/* LEFT: TEMPLATE PREVIEW */}
        <section className="preview-column">
          <h1>Quests Preview</h1>
          <div className="phone-mockup-wrapper">
            <div
              className={`phone-mockup ${getMockupTheme(themeId).className} ${isRecording ? "is-recording" : ""}`}
              ref={mockupRef}
            >
              <ThemeLayers themeId={themeId} />
              {/* Header Matching Provided HTML */}
              <div className="upshift-logo-container">
                <img src={appStoreImg} alt="Download on App Store" className="app-store-badge-mock" />
                <h3 className="brand-text">Upshift: #1 Productivity app</h3>
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
                    crossOrigin="anonymous"
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
                      const status = getHabitStatus(habit.achieved, habit.goal, gender, resolveQuestType(habit));
                      return (
                        <div key={habit.id} className="upshift-card">
                          <div className="card-label">
                            <img
                              src={`https://emojicdn.elk.sh/${habit.emoji}?style=apple`}
                              alt={habit.emoji}
                              className="card-emoji"
                              crossOrigin="anonymous"
                              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                            />
                            <span>{habit.name}</span>
                          </div>
                          <div className="card-value-line">
                            <span className="value-num">{formatNumber(getDisplayValue(habit.achieved, videoProgress))}</span>
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
                                width: `${getProgressWidth(habit, videoProgress)}%`,
                                background: status.gradient
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
                      const status = getHabitStatus(habit.achieved, habit.goal, gender, resolveQuestType(habit));
                      return (
                        <div key={habit.id} className="upshift-card">
                          <div className="card-label">
                            <img
                              src={`https://emojicdn.elk.sh/${habit.emoji}?style=apple`}
                              alt={habit.emoji}
                              className="card-emoji"
                              crossOrigin="anonymous"
                              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                            />
                            <span>{habit.name}</span>
                          </div>
                          <div className="card-value-line">
                            <span className="value-num">{formatNumber(getDisplayValue(habit.achieved, videoProgress))}</span>
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
                                width: `${getProgressWidth(habit, videoProgress)}%`,
                                background: status.gradient
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
                      const status = getHabitStatus(habit.achieved, habit.goal, gender, resolveQuestType(habit));
                      return (
                        <div key={habit.id} className="upshift-card">
                          <div className="card-label">
                            <img
                              src={`https://emojicdn.elk.sh/${habit.emoji}?style=apple`}
                              alt={habit.emoji}
                              className="card-emoji"
                              crossOrigin="anonymous"
                              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                            />
                            <span>{habit.name}</span>
                          </div>
                          <div className="card-value-line">
                            <span className="value-num">{formatNumber(getDisplayValue(habit.achieved, videoProgress))}</span>
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
                                width: `${getProgressWidth(habit, videoProgress)}%`,
                                background: status.gradient
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE: CUSTOMIZE RATINGS */}
        <section className="controls-column">
          <h2>Customize Ratings</h2>

          <div className="gender-toggle stat-level-toggle">
            <button
              className={`toggle-opt ${statLevel === 'Good' ? 'active' : ''}`}
              onClick={() => applyStatLevel('Good')}
            >
              Good
            </button>
            <button
              className={`toggle-opt ${statLevel === 'Chopped' ? 'active' : ''}`}
              onClick={() => applyStatLevel('Chopped')}
            >
              Chopped
            </button>
          </div>

          <div className="preset-actions">
            <button className="preset-btn save" onClick={saveStatPreset}>
              {savedAt ? `Saved \u2713 \u2014 update ${statLevel} stats` : `Save current as ${statLevel} stats`}
            </button>
            <button className="preset-btn reset" onClick={resetStatPresets}>
              Reset
            </button>
          </div>

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

          <div className="theme-select-box">
            <label className="theme-select-label" htmlFor="theme-select">Background Theme</label>
            <select
              id="theme-select"
              className="theme-select"
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
            >
              {MOCKUP_THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
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
                  <div className="quest-type-toggle">
                    <button
                      className={`type-opt ${resolveQuestType(habit) === 'build' ? 'active' : ''}`}
                      onClick={() => updateHabit(habit.id, { type: 'build' })}
                    >
                      Build
                    </button>
                    <button
                      className={`type-opt target ${resolveQuestType(habit) === 'target' ? 'active' : ''}`}
                      onClick={() => updateHabit(habit.id, { type: 'target' })}
                      title="Hitting the goal is the win - going well over it is not (calories, sleep)"
                    >
                      Target
                    </button>
                    <button
                      className={`type-opt quit ${resolveQuestType(habit) === 'quit' ? 'active' : ''}`}
                      onClick={() => updateHabit(habit.id, { type: 'quit' })}
                    >
                      Quit
                    </button>
                  </div>
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
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const fallback = habit.type === 'quit' ? 0 : 1;
                          updateHabit(habit.id, { goal: isNaN(val) ? fallback : val });
                        }}
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

            {!supportsVideoExport ? (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '8px', border: '1px solid #222', borderRadius: '4px' }}>
                🎬 MP4 export not available on iPhones — use desktop browser
              </div>
            ) : (
              <button
                className="download-pill-btn"
                style={{ borderColor: 'rgb(117, 255, 241)', color: 'rgb(117, 255, 241)' }}
                onClick={handleDownloadVideo}
                disabled={isDownloading || isRecording}
              >
                {isRecording ? `Generating MP4 (${Math.round((recordingStep / Math.floor(30 * videoDuration)) * 100)}%)...` : 'Download Video (MP4)'} <RiVideoLine />
              </button>
            )}
          </div>
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
      {pendingCropSrc && (
        <ImageCropModal
          src={pendingCropSrc}
          onCancel={() => setPendingCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
};

export default Quests;