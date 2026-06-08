import React from 'react';
import { Link } from 'react-router-dom';
import './CreatorProgram.css';
import { SEO, StructuredData } from '../../components/common/SEO';
import LightRays from '../../components/common/LightRays/LightRays';
import RedditProgramSection from './RedditProgramSection';

const RedditProgram: React.FC = () => {
  return (
    <div className="creator-program-page">
      <SEO
        title="Upshift Reddit Creator Program | Earn money making posts"
        description="Partner with us to promote Upshift on Reddit and earn money based on your posts."
        keywords="upshift creator program, earn money, reddit creator, upshift partners, reddit"
      />
      <StructuredData
        type="webpage"
        title="Upshift Reddit Creator Program"
        description="Partner with us to promote Upshift on Reddit and earn money based on your posts."
        url="https://joinupshift.com/creator-program/reddit"
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

      <RedditProgramSection />
    </div>
  );
};

export default RedditProgram;
