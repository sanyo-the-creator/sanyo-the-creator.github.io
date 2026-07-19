import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  RiDownloadLine as _RiDownloadLine, 
  RiArrowLeftLine as _RiArrowLeftLine, 
  RiVideoLine as _RiVideoLine, 
  RiInformationLine as _RiInformationLine 
} from 'react-icons/ri';
import './Creator.css';
import './ContentLibrary.css';
import LightRays from '../../components/common/LightRays/LightRays';

const RiDownloadLine = _RiDownloadLine as any;
const RiArrowLeftLine = _RiArrowLeftLine as any;
const RiVideoLine = _RiVideoLine as any;
const RiInformationLine = _RiInformationLine as any;

const ContentLibrary: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  const assets = [
    {
      id: 1,
      title: "Upshift Clip 1",
      filename: "upshift_clip_1.mp4",
      url: process.env.PUBLIC_URL + "/media/upshift_clip_1.mp4?v=3"
    },
    {
      id: 2,
      title: "Upshift Clip 2",
      filename: "upshift_clip_2.mp4",
      url: process.env.PUBLIC_URL + "/media/upshift_clip_2.mp4?v=3"
    },
    {
      id: 3,
      title: "Upshift Clip 3",
      filename: "upshift_clip_3.mp4",
      url: process.env.PUBLIC_URL + "/media/upshift_clip_3.mp4?v=3"
    }
  ];

  return (
    <div className="creator-landing content-library">
      <header className="creator-header">
        <Link to={`/creator${fromPortal ? '?from=portal' : ''}`} className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>
      
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

      <header className="library-header">
        <h1 className="creator-landing-title">Content Library</h1>
        <div className="rules-banner">
          <RiInformationLine className="rules-icon" />
          <p>
            <strong>IMPORTANT RULE:</strong> These clips MUST be included in the <strong>first 15 seconds</strong> of your shared video to be counted for rewards.
          </p>
        </div>
      </header>

      <div className="assets-grid">
        {assets.map(asset => (
          <div key={asset.id} className="asset-card">
            <div className="video-preview-container">
              <video 
                className="asset-video-preview" 
                controls
                muted
                playsInline
                preload="metadata"
              >
                <source src={asset.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="asset-info">
              <h3 className="asset-title">{asset.title}</h3>
              <a 
                href={asset.url} 
                download={asset.filename}
                className="download-asset-btn"
              >
                <RiDownloadLine /> Download MP4
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentLibrary;
