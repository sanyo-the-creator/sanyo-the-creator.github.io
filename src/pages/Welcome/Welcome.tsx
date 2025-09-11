import React from 'react';
import TextType from '../../components/common/TextType/TextType';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import RotatingText from '../../components/common/RotatingText/index';
import './Welcome.css';
import LightRays from '../../components/common/LightRays/LightRays';
const Welcome: React.FC = () => {
  const nextSteps = [
    {
      icon: '👤',
      title: 'Complete Your Profile',
      description: 'Fill in your personal information and preferences in the app',
      action: 'Complete Profile',
      primary: true,
    },
    {
      icon: '⚔️',
      title: 'Create Your First Quest',
      description: 'Set up a daily habit and start earning XP immediately',
      action: 'Start Questing',
    },
    {
      icon: '🏰',
      title: 'Join Groups',
      description: 'Connect with communities and compete with friends',
      action: 'Find Groups',
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'View detailed analytics and achievement progress',
      action: 'See Stats',
    },
  ];

  const quickTips = [
    'Start small - even 5 minutes a day can create lasting change',
    'Join groups that align with your interests and goals',
    // 'Use the app blocker to stay focused during quest time',
    'Celebrate small wins - every XP point counts!',
    'Be consistent - streaks are more important than perfection',
  ];

  return (
    <div className="welcome-page">
      {/* Hero Section */}
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
      <section className="welcome-hero">
        <div className="container">
          <div className="welcome-hero-content">

            <h1 className="welcome-title">
              Welcome to <span className="gradient-text">Upshift!</span>
            </h1>
            <p className="welcome-subtitle">
              Congratulations! Your email has been successfully verified. You can now return to the app and complete your profile setup to start your transformation journey.
            </p>


            {/* Success Message */}
            <div className="success-section">
              <div className="success-badges">

                <StarBorder className="btn btn-secondary btn-lg" color="#8b5cf6" >
                  <span className="badge-icon">✅</span>
                  <span>Email Verified</span>
                </StarBorder>

                <StarBorder className="btn btn-secondary btn-lg" color="#8b5cf6" >
                  <span className="badge-icon">💎</span>
                  <span>Account Active</span>
                </StarBorder>
                <StarBorder className="btn btn-secondary btn-lg" color="#8b5cf6" >
                  <span className="badge-icon">🚀</span>
                  <span>Ready for Setup</span>
                </StarBorder>


              </div>
            </div>
          </div>
        </div>
      </section>





    </div>
  );
};

export default Welcome;
