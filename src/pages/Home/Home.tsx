import React from 'react';
import Aurora from '../../components/common/Aurora/Aurora';
import RotatingText from '../../components/common/RotatingText/index';
import ScrollVelocity from '../../components/common/ScrollVelocity/ScrollVelocity';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import TextType from '../../components/common/TextType/TextType';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import ScrollingFeatures from '../../components/sections/ScrollingFeatures';
import upshiftHomeImage from '../../assets/images/home-screen.jpg';
import upshiftGoalsImage from '../../assets/images/goals-screen.jpg';
import upshiftProfileImage from '../../assets/images/profile-screen.jpg';
import timeTrackerImage  from '../../assets/images/time-tracker-screen.jpg';
import friendsImage  from '../../assets/images/friends-screen.jpg';
import groupImage  from '../../assets/images/group-list-screen.jpg';
import CountUp from '../../components/common/CountUp/CountUp'
import ProfileCard from '../../components/common/ProfileCard/ProfileCard'


import './Home.css';
import { MagicBento } from '../../components/common';

const Home: React.FC = () => {
  // Scrolling Features Data
  const scrollingFeatures = [
    {
      id: 'dashboard',
      title: '🎯 Quests and Sidequest',
      description: 'Get a comprehensive overview of your journey with Upshift. Monitor your streaks, visualize progress over time, and gain valuable insights to stay on track and achieve lasting freedom.',
      screenshot: upshiftHomeImage,
      highlights: [
        'Timer tracking your progress',
        'Pledge system for accountability',
        'Meditation and mindfulness tools'
      ]
    },
     {
      id: 'time2',
      title: '🚀 Groups and Challenges',
      description: 'Gain an in-depth look at your recovery journey. Explore detailed analytics, track your progress, identify key patterns, and use actionable insights to build stronger habits and maintain your momentum.',
      screenshot: groupImage,
      highlights: [
        'Recovery percentage tracking',
        'Detailed progress analytics',
        'Streak monitoring and insights'
      ]
    },
    {
      id: 'analytics',
      title: '🥅 Goals with Journal',
      description: 'Gain an in-depth look at your recovery journey. Explore detailed analytics, track your progress, identify key patterns, and use actionable insights to build stronger habits and maintain your momentum.',
      screenshot: upshiftGoalsImage,
      highlights: [
        'Recovery percentage tracking',
        'Detailed progress analytics',
        'Streak monitoring and insights'
      ]
    },
     {
      id: 'time',
      title: '⏳ Time Tracker',
      description: 'Gain an in-depth look at your recovery journey. Explore detailed analytics, track your progress, identify key patterns, and use actionable insights to build stronger habits and maintain your momentum.',
      screenshot: timeTrackerImage,
      highlights: [
        'Recovery percentage tracking',
        'Detailed progress analytics',
        'Streak monitoring and insights'
      ]
    },
    
    {
      id: 'community',
      title: '📈 Profile with level and stats',
      description: 'Connect with a supportive community on your journey. Share experiences, exchange tips, celebrate milestones, and find encouragement from others who understand and are working toward similar goals.',
      screenshot: upshiftProfileImage,
      highlights: [
        'Supportive community discussions',
        'Share experiences and tips',
        'Celebrate milestones together'
      ]
    },
    {
      id: 'community2',
      title: '🏋️‍♂️ Friends',
      description: 'Connect with a supportive community on your journey. Share experiences, exchange tips, celebrate milestones, and find encouragement from others who understand and are working toward similar goals.',
      screenshot: friendsImage,
      highlights: [
        'Supportive community discussions',
        'Share experiences and tips',
        'Celebrate milestones together'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
     
      avatar: '👩‍💼',
      quote: 'Upshift transformed how I approach personal development. The gamification makes building habits actually fun!'
    },
    {
      name: 'Marcus Johnson',
      role: 'Software Engineer',
      
      avatar: '👨‍💻',
      quote: 'The social accountability features are game-changing. My productivity has increased by 40% since using Upshift.'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50%',
          zIndex: 0
        }}>
          <Aurora
            colorStops={["#1a0565ff", "#2642c2ff", "#3e58adff"]}
            blend={1.5}
            amplitude={1}
            speed={0.5}
          />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-content">
            <div className="hero-text">

              <div className="hero-title-container">
                <h1 className="hero-title">
                  Transform Your Life <br /> Into a{" "}
                  <RotatingText
                  interval={5000}
                    texts={["Quest   ", "Game   ", "Journey    ", "Mission   "]}
                    className="gradient-text"
                  />
                </h1>
              </div>

              <TextType
                text="The most powerful personal development platform backed by gamification psychology and social accountability."
                className="hero-subtitle"
                typingSpeed={30}
                initialDelay={1000}
              />
            </div>

            <div className="hero-visual">
              <div className="phone-mockup-container">
                <div className="phone-mockup">
                  <div className="phone-screen">
                    <img
                      src={upshiftHomeImage}
                      alt="Upshift App Interface"
                      className="hero-screenshot"
                    />
                  </div>
                </div>
                <div className="phone-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <SpotlightCard className="hero-stats-card" spotlightColor="rgba(57, 70, 255, 0.2)">
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number gradient-text">
                <CountUp
                  from={0}
                  to={92}
                  separator=","
                  direction="up"
                  duration={1.25}
                  className="count-up-text"
                />%</div>
              <div className="stat-label">Motivation Boost</div>
            </div>
            <div className="stat-item">
              <div className="stat-number gradient-text">
                <CountUp
                  from={0}
                  to={87}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                />%</div>
              <div className="stat-label">Fewer Distractions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number gradient-text">
                <CountUp
                  from={0}
                  to={95}
                  separator=","
                  direction="up"
                  duration={1.50}
                  className="count-up-text"
                />%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </SpotlightCard>
      </section>



      {/* Scrolling Features Section */}
      <ScrollingFeatures features={scrollingFeatures} />


      {/* Additional Features Section */}
      <section className="features-section section mt-6">
        <div className="container-extra-features magic-bento">
          <MagicBento></MagicBento>
        </div>
      </section>

      {/* Scroll Velocity Section */}
      <ScrollVelocity
        texts={["⚔️ LEVEL UP • 🏆 ACHIEVE • 🎯 FOCUS • 🚀 TRANSFORM • 💪 GROW • ✨ SUCCEED"]}
        velocity={100}
        className="scroll-velocity-section"
      />


      {/* Testimonials Section */}
      <section className="testimonials-section section">
        <div className="testimonials-container">
          <div className="section-header text-center">
            <h2 className="section-title">Loved by thousands</h2>
          </div>


          <div className="testimonials-grid">

            {testimonials.map((testimonial, index) => (
              <SpotlightCard spotlightColor="rgba(57, 70, 255, 0.2)">
                <div className="testimonial-content">
                  <div className="testimonial-quote">"{testimonial.quote}"</div>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.avatar}</div>
                    <div className="author-info">
                      <div className="author-name">{testimonial.name}</div>
                      <div className="author-role">{testimonial.role} </div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="cta-section">

        <button className="btn btn-primary btn-lg btn-cta glow-effect mb-6"  onClick={() => window.location.href = '/download'}>
          <span className="btn-icon">🚀</span>
          Download Upshift Now
        </button>
      </section>
    </div>
  );
};

export default Home;
