import React from 'react';

// The app's own theme stylesheets, copied verbatim from
// upshift/ionic-upshift/src/app/themes/ (see the header in each file for the
// containment-only changes).
import './themes/default.theme.css';
import './themes/galaxy.theme.css';
import './themes/nebula.theme.css';
import './themes/black-hole.theme.css';
import './themes/earth.theme.css';
import './themes/moon.theme.css';
import './themes/saturn.theme.css';
import './themes/solar-system.theme.css';
import './themes/ufo.theme.css';
import './themes/saturn-animation.css';

export type MockupTheme = {
  id: string;
  label: string;
  /** Class the app puts on the themed container; '' keeps the old mockup look. */
  className: string;
};

export const MOCKUP_THEMES: MockupTheme[] = [
  { id: 'original', label: 'Original (dark)', className: '' },
  { id: 'default', label: 'Default', className: 'theme-default' },
  { id: 'galaxy', label: 'Galaxy', className: 'theme-galaxy' },
  { id: 'nebula', label: 'Nebula', className: 'theme-nebula' },
  { id: 'black-hole', label: 'Black Hole', className: 'theme-black-hole' },
  { id: 'earth', label: 'Earth', className: 'theme-earth' },
  { id: 'moon', label: 'Moon', className: 'theme-moon' },
  { id: 'saturn', label: 'Saturn', className: 'theme-saturn' },
  { id: 'solar-system', label: 'Solar System', className: 'theme-solar-system' },
  { id: 'ufo', label: 'UFO', className: 'theme-ufo' },
];

export const DEFAULT_THEME_ID = 'original';

export const getMockupTheme = (id: string): MockupTheme =>
  MOCKUP_THEMES.find(t => t.id === id) || MOCKUP_THEMES[0];

// The mockup is a fixed 540x960 frame, so the solar system's stars are
// scattered over that instead of over window.innerWidth/innerHeight.
const MOCKUP_W = 540;
const MOCKUP_H = 960;

const COSMIC_STARS = Array.from({ length: 70 }, (_, i) => ({
  key: i,
  top: Math.random() * MOCKUP_H,
  left: Math.random() * MOCKUP_W,
  size: Math.random() * 4 + 1,
  opacity: Math.random() * 0.8 + 0.2,
}));

const SOLAR_PLANETS = [
  'solar-mercury', 'solar-venus', 'solar-earth', 'solar-mars',
  'solar-jupiter', 'solar-saturn', 'solar-uranus', 'solar-neptune',
];

/**
 * The per-theme elements the app renders alongside the theme class
 * (see upshift/ionic-upshift/src/app/pages/profile/profile.page.html).
 * Each theme's stylesheet styles or hides them, exactly as in the app.
 */
export const ThemeLayers: React.FC<{ themeId: string }> = ({ themeId }) => {
  if (themeId === 'original') return null;

  return (
    <>
      {/* Falling stars — every theme's stylesheet either styles or hides these. */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={`fs-${i}`} className="falling-star" />
      ))}

      {themeId === 'earth' && (
        <>
          <div className="stars-layer" />
          <div className="cloud-layer" />
        </>
      )}

      {themeId === 'moon' && (
        <>
          <div className="cosmic-dust" />
          <div className="meteor-layer" />
        </>
      )}

      {themeId === 'nebula' && (
        <>
          <div className="cosmic-dust" />
          <div className="nebula-layer" />
        </>
      )}

      {themeId === 'saturn' && (
        <>
          {React.createElement('app-saturn-animation', {}, (
            <div id="saturn">
              <div className="planet bottom planet-bg" />
              <div className="rings" />
              <div className="planet top planet-bg" />
            </div>
          ))}
          <div className="cosmic-dust" />
          <div className="nebula-layer" />
          <div className="saturn-planet" />
        </>
      )}

      {themeId === 'black-hole' && (
        <>
          <div className="blackhole-container">
            <div className="blackhole">
              <div className="megna">
                <div className="black" />
              </div>
            </div>
          </div>
          <div className="hawking-radiation" />
          <div className="spacetime-waves" />
        </>
      )}

      {themeId === 'ufo' && (
        <>
          <div className="ufo-lights" />
          <div className="ufo-dome" />
          <div className="alien-stars" />
          <div className="energy-field" />
        </>
      )}

      {themeId === 'solar-system' && (
        <>
          <div className="cosmic-stars">
            {COSMIC_STARS.map(s => (
              <div
                key={s.key}
                className="cosmic-star"
                style={{ top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.opacity }}
              />
            ))}
          </div>
          <div className="cosmic-sun" />
          {SOLAR_PLANETS.map(p => <div key={p} className={p} />)}
        </>
      )}
    </>
  );
};
