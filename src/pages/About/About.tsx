import React from 'react';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import LightRays from '../../components/common/LightRays/LightRays';
import { SEO, StructuredData } from '../../components/common/SEO';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <SEO
        title="About Upshift - Our Mission | Personal Development App"
        description="Learn about Upshift's mission to transform lives through gamified personal development. Discover our story, vision, and commitment to helping you achieve your goals."
        keywords="about upshift, mission, personal development, gamification, life transformation, productivity app, our story"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData
        type="webpage"
        title="About Upshift - Our Mission"
        description="Learn about Upshift's mission to transform lives through personal development"
        url="https://joinupshift.com/about"
      />
      {/* Hero Section */}
      <section className="about-hero section">
        <div className="container">
          <div className="about-hero-content">
            <h1 className="about-title">
              About <span className="gradient-text">Upshift</span>
            </h1>
            <p className="about-subtitle">
              Empowering individuals to unlock their full potential through
              gamified personal development and community support.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="vision-section section">
        <div className="container">
          <div className="vision-content">
            <div className="vision-text">
              <ScrollReveal>Our Vision</ScrollReveal>
              <p>
                We envision a world where personal development is as engaging as playing a game,
                where building good habits feels rewarding and fun, and where people support
                each other in their growth journeys.
              </p>
              <p>
                Upshift transforms the often difficult process of behavior change into an
                exciting adventure where progress is visible, measurable, and celebrated.
              </p>
            </div>
            <SpotlightCard className="vision-card">
              <h3>🎯 Our Mission</h3>
              <p>
                To make personal growth engaging, social, and sustainable through
                gamification and community support, helping everyone become their best self.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="problem-solution-section section">
        <LightRays
          raysOrigin="top-center"
          raysColor="#667EEA"
          raysSpeed={0.8}
          lightSpread={1.2}
          rayLength={1.5}
          pulsating={true}
          fadeDistance={0.8}
          saturation={0.7}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.1}
          distortion={0.2}
        />
        <div className="container">
          <div className="problem-solution-grid">
            <div className="problem-solution-card-wrapper">
              <SpotlightCard className="problem-card">
                <div className="card-icon">❌</div>
                <h3>The <span className="gradient-text">Problem</span></h3>
                <p>
                  Traditional habit apps fail because they lack motivation,
                  community support, and engaging mechanics. Most people give up
                  within weeks due to lack of accountability and boring interfaces.
                </p>
              </SpotlightCard>
            </div>

            <div className="problem-solution-card-wrapper">
              <SpotlightCard className="solution-card">
                <div className="card-icon">✅</div>
                <h3>Our <span className="gradient-text">Solution</span></h3>
                <p>
                  Upshift combines proven gamification psychology with social
                  accountability and comprehensive tracking to create lasting
                  behavioral change that feels like playing a game.
                </p>
              </SpotlightCard>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section section">
        <div className="container">
          <h2 className="values-title text-center gradient-text">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🎮</div>
              <h4>Make It Fun</h4>
              <p>Personal growth should be enjoyable, not a chore.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h4>Community First</h4>
              <p>We believe in the power of support and accountability.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">📈</div>
              <h4>Progress Over Perfection</h4>
              <p>Small consistent steps lead to massive transformations.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">🔬</div>
              <h4>Science-Based</h4>
              <p>Our approach is grounded in behavioral psychology research.</p>
            </div>
          </div>

          <div className="about-cta text-center">
            <a href="/download">
            <StarBorder className="btn btn-primary btn-lg">
              🚀 Start Your Journey
            </StarBorder></a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
