import React from 'react';
import { RiImageAddLine as _RiImageAddLine } from 'react-icons/ri';
import appStoreImg from '../../assets/appStore.png';
import { AVAILABLE_APPS } from './ScreenTime';

const RiImageAddLine = _RiImageAddLine as any;

/** One weekly quest stat, already scored by the Classic view's rules. */
export type ScoreStat = {
  emoji: string;
  /** Image used instead of the emoji, e.g. an app icon for screen time. */
  iconUrl?: string;
  name: string;
  /** Tint for the name, e.g. the app's brand colour. */
  nameColor?: string;
  value: string;
  /** Text after the value, e.g. "/210 min" or "avg daily". */
  goal: string;
  status: string;
  color: string;
  gradient: string;
  /** 0..100, already scaled by the export progress. */
  fill: number;
};

export type ScoreCardData = {
  name: string;
  handle: string;
  verified: boolean;
  score: number;
  topPercent: number;
  /** Daily average, in minutes. */
  screenTime: number;
  /** % change vs last week; negative is less time on the phone. */
  screenTimeChange: number;
  /** Whether the distracting apps show as locked by Upshift. */
  appsBlocked: boolean;
};

export const GOOD_SCORECARD: ScoreCardData = {
  name: 'Jake Miller',
  handle: 'jakemiller',
  verified: true,
  score: 94,
  topPercent: 3,
  screenTime: 108,
  screenTimeChange: -64,
  appsBlocked: true,
};

/** Chopped screen time always lands between 8h and 14h a day. */
export const CHOPPED_SCREEN_TIME = { min: 8 * 60 + 1, max: 14 * 60 - 1 };

export const CHOPPED_SCORECARD: ScoreCardData = {
  name: 'Jake Miller',
  handle: 'jakemiller',
  verified: true,
  score: 34,
  topPercent: 66,
  screenTime: 683,
  screenTimeChange: 38,
  appsBlocked: false,
};

type Props = {
  data: ScoreCardData;
  stats: ScoreStat[];
  image: string | null;
  imageX: number;
  imageY: number;
  imageZoom: number;
  /** 0..1, used to count values up when exporting video. */
  progress: number;
  onPickImage: () => void;
};

// The double chevron from the in-app header.
const UpshiftMark: React.FC = () => (
  <svg className="scorecard-mark" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12.5L12 5l8 7.5" stroke="#4f7bff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 19L12 14l5.5 5" stroke="#4f7bff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Colour of the headline number, in the same tiers as the quest ratings. */
const scoreTier = (score: number) => {
  if (score >= 80) return { color: '#4fd8ff', bar: 'linear-gradient(90deg, #2f6bff, #4fd8ff)' };
  if (score >= 50) return { color: '#b98cff', bar: 'linear-gradient(90deg, #6366f1, #b98cff)' };
  return { color: '#ff4d6a', bar: 'linear-gradient(90deg, #be123c, #ff4d6a)' };
};

// The apps people most want gone, shown as locked (or not) by Upshift.
const BLOCKED_APP_IDS = ['tiktok', 'instagram', 'pornhub', 'twitter'];
const BLOCKED_APPS = BLOCKED_APP_IDS.map(id => AVAILABLE_APPS.find(a => a.id === id)!).filter(Boolean);

const formatMinutes = (min: number) => {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="2.4" fill="none" />
  </svg>
);

const ScoreCard: React.FC<Props> = ({ data, image, imageX, imageY, imageZoom, progress, onPickImage }) => {
  const shown = (n: number) => Math.round(n * progress);
  const tier = scoreTier(data.score);
  const down = data.screenTimeChange <= 0;

  return (
    <div className="scorecard">
      <div className="scorecard-photo" onClick={onPickImage}>
        {image ? (
          <img
            src={image}
            alt="Profile"
            crossOrigin="anonymous"
            style={{ transform: `translate(${imageX}px, ${imageY}px) scale(${imageZoom / 100})`, transition: 'none' }}
          />
        ) : (
          <div className="scorecard-photo-empty">
            <RiImageAddLine />
            <span className="insert-label">Insert Image Here</span>
          </div>
        )}
      </div>
      <div className="scorecard-shade" />

      <div className="scorecard-body">
        {/* App blocker: the apps that eat the day, locked (or wide open) */}
        <div className={`scorecard-blocker ${data.appsBlocked ? 'on' : 'off'}`}>
          <div className="scorecard-blocker-apps">
            {BLOCKED_APPS.map(app => (
              <span key={app.id} className="scorecard-blocker-app">
                <img src={app.imageUrl} alt={app.name} crossOrigin="anonymous" />
                {data.appsBlocked ? (
                  <span className="scorecard-blocker-lock"><LockIcon /></span>
                ) : (
                  <span className="scorecard-blocker-lock warn">!</span>
                )}
              </span>
            ))}
          </div>
          {data.appsBlocked ? (
            <span className="scorecard-blocker-text">
              <LockIcon className="scorecard-blocker-inline" />Blocked by <b>Upshift</b>
            </span>
          ) : (
            <span className="scorecard-blocker-warn">
              <span className="scorecard-blocker-warn-title">{'\u26A0'} 0 apps blocked</span>
              <span className="scorecard-blocker-warn-sub">Upshift recommends blocking these</span>
            </span>
          )}
        </div>

        <span className="scorecard-name">
          {data.name}
          {data.verified && (
            <svg className="scorecard-check" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#2f6bff" />
              <path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <div className="scorecard-hero">
          <div className="scorecard-score">
            <span className="scorecard-score-num">{shown(data.score)}</span>
            <span className="scorecard-score-side">
              <span className="scorecard-score-max">/100</span>
              <span className="scorecard-score-label" style={{ color: tier.color }}>Upshift Score</span>
            </span>
          </div>

          <div className={`scorecard-screen ${down ? 'down' : 'up'}`}>
            <span className="scorecard-screen-label">Screen time</span>
            <span className="scorecard-screen-num">{formatMinutes(data.screenTime * progress)}</span>
            <span className="scorecard-screen-change">
              {down ? '\u2193' : '\u2191'} {Math.abs(shown(data.screenTimeChange))}% vs last week
            </span>
          </div>
        </div>

        <div className="scorecard-footer">
          <img src={appStoreImg} alt="Download on App Store" className="scorecard-badge" />
          <span>Upshift: #1 Productivity app</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
