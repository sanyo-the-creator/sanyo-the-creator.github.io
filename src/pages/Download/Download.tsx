import React from 'react';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import LightRays from '../../components/common/LightRays/LightRays';
import { SEO, StructuredData } from '../../components/common/SEO';
import './Download.css';

const Download: React.FC = () => {

  const downloadLinks = [
    {
      platform: 'iOS',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      title: 'Download for iPhone',
      subtitle: 'Available on the App Store',
      url: 'https://apps.apple.com/gb/app/upshift-level-up-your-life/id6749509316',
      primary: true
    },
    {
      platform: 'Android',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
        </svg>
      ),
      title: 'Download for Android',
      subtitle: 'Join waitlist right now!',
      url: 'https://forms.gle/iJa3K3p6LmWkmHxn6#',
      primary: true
    }
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Instant Setup',
      description: 'Get started in under 2 minutes'
    },
    {
      icon: '🔄',
      title: 'Cross-Platform Sync',
      description: 'Your progress syncs across all devices'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected'
    },
    {
      icon: '🎯',
      title: 'Goal Tracking',
      description: 'Track habits and achieve your goals'
    }
  ];

  return (
    <div className="download-page">
      <SEO
        title="Download Upshift - Level up your life | iOS & Android App"
        description="Download Upshift app for iOS and Android. Transform your life with the most engaging personal development app. Block distracting apps, set goals, and track your progress."
        keywords="download upshift, ios app, android app, personal development app, habit tracker download, productivity app, app blocker, screen time management"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData
        type="webpage"
        title="Download Upshift"
        description="Download Upshift app for iOS and Android"
        url="https://joinupshift.com/download"
      />
      <LightRays
        raysOrigin="top-center"
        raysColor="#667EEA"
        raysSpeed={0.6}
        lightSpread={1.5}
        rayLength={2}
        pulsating={true}
        fadeDistance={1.2}
        saturation={0.8}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.05}
        distortion={0.1}
      />

      {/* Hero Section */}
      <section className="download-hero section">
        <div className="container">
          <div className="download-hero-content">
            <h1 className="download-title">
              Download <span className="gradient-text">Upshift</span>
            </h1>
            <p className="download-subtitle">
              Transform your life with the most engaging personal development app. 
              Available on all your favorite platforms.
            </p>
            
            <div className="download-links">
              {downloadLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url || undefined}
                  target={link.url ? "_blank" : undefined}
                  rel={link.url ? "noopener noreferrer" : undefined}
                  className={`download-card ${link.primary ? 'primary' : 'secondary'}`}
                  data-platform={link.platform}
                  style={{ cursor: link.url ? 'pointer' : 'default' }}
                  onClick={(e) => {
                    if (!link.url) {
                      e.preventDefault();
                      // Môžete pridať notifikáciu "Coming Soon" alebo iné správanie
                      // console.log('Link not available yet');
                    }
                  }}
                >
                  <div className="download-icon">{link.icon}</div>
                  <div className="download-info">
                    <h3 className="download-platform">{link.title}</h3>
                    <p className="download-store">{link.subtitle}</p>
                  </div>
                  <StarBorder
                    className="download-btn"
                    color={link.primary ? "#3A29FF" : "#8b5cf6"}
                  >
                    Download
                  </StarBorder>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default Download;
