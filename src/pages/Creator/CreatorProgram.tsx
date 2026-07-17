import React from 'react';
import { Link } from 'react-router-dom';
import './CreatorProgram.css';
import { SEO, StructuredData } from '../../components/common/SEO';
import LightRays from '../../components/common/LightRays/LightRays';
import CreatorProgramSection from './CreatorProgramSection';
import UpshiftMenu from '../../components/common/UpshiftMenu';

const CreatorProgram: React.FC = () => {
  return (
    <div className="creator-program-page">
      <UpshiftMenu />
      <SEO
        title="Upshift Creator Program | Earn money making videos"
        description="Partner with us to promote Upshift on TikTok and Instagram and earn money based on your video views."
        keywords="upshift creator program, earn money, tiktok creator, instagram creator, upshift partners"
      />
      <StructuredData
        type="webpage"
        title="Upshift Creator Program"
        description="Partner with us to promote Upshift on TikTok and Instagram and earn money based on your video views."
        url="https://joinupshift.com/creator-program"
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

      <CreatorProgramSection />
    </div>
  );
};

export default CreatorProgram;
