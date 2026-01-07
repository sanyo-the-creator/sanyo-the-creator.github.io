import React, { useState } from 'react';
import { faqItems } from '../../data/faqs';
import { SEO, StructuredData } from '../../components/common/SEO';
import './Features.css';
import LightRays from '../../components/common/LightRays/LightRays';
import Breadcrumbs from '../../components/common/Breadcrumbs/Breadcrumbs';
// Import all images
import affiliateScreen from '../../assets/images/affiliateScreen2.jpeg';
import appBlocker from '../../assets/images/appBlocker.jpeg';
import badges from '../../assets/images/badges.jpeg';
import blockNow from '../../assets/images/blockNow.jpeg';
import customBlockOverlay from '../../assets/images/customBlockOverlay.jpeg';
import dailySidequest from '../../assets/images/dailySidequest.jpeg';
import dayCelebration from '../../assets/images/dayCelebration.jpeg';
import exploreQuests from '../../assets/images/exploreQuests.jpeg';
import friendsScreen from '../../assets/images/friends-screen2.jpg';
import friendsScreen2 from '../../assets/images/friends-screen2.jpg';
import goalJournal from '../../assets/images/goalJournal.jpeg';
import goalsScreen from '../../assets/images/goals-screen.jpg';
import groupListScreen from '../../assets/images/group-list-screen.jpg';
import homeScreen from '../../assets/images/home-screen.jpg';
import leaderboardScreen from '../../assets/images/leaderboard-screen.jpg';
import leaderboardGroups from '../../assets/images/leaderboardGroups.jpeg';
import leaderboardUsers from '../../assets/images/leaderboardUsers.jpeg';
import monthQuest from '../../assets/images/monthQuest.jpeg';
import onedayQuest from '../../assets/images/onedayQuest.jpeg';
import pornBlocker from '../../assets/images/pornBlocker.jpeg';
import profileScreen from '../../assets/images/profile-screen.jpg';
import questBlock from '../../assets/images/questBlock.jpeg';
import quitQuests from '../../assets/images/quitQuests.jpeg';
import reminders from '../../assets/images/reminders.jpeg';
import rouletteQuest from '../../assets/images/rouletteQuest.jpeg';
import stopwatch from '../../assets/images/stopwatch.jpeg';
import streakCelebration from '../../assets/images/streakCelebration.jpeg';
import timeTrackerScreen from '../../assets/images/time-tracker-screen.jpg';
import timeLimit from '../../assets/images/timeLimit.jpeg';
import weeklyQuest from '../../assets/images/weeklyQuest.jpeg';
import workSchedule from '../../assets/images/workSchedule.jpeg';
import customTheme from '../../assets/images/customTheme.jpeg';
const features = [
  {
    image: homeScreen,
    imagePosition: 'center -100px',
    title: 'Quest & Sidequests',
    subtitle: 'Track your daily habits. Build streaks, earn XP, and level up your life.'
  },
  {
    image: profileScreen,
    imagePosition: 'center -102px',
    title: 'Profile & Stats',
    subtitle: 'Your Upshift Profile with all your stats, achievements and public goals'
  },
  {
    image: goalsScreen,
    imagePosition: 'center -46px',
    title: 'Goals & Journal',
    subtitle: 'Set long-term goals, break them into milestones, and track your progress.'
  },
  {
    image: timeTrackerScreen,
    imagePosition: 'center -174px',
    title: 'Time Tracker',
    subtitle: 'Track your time and remove distractions.'
  },
  {
    image: groupListScreen,
    imagePosition: 'center -238px',
    title: 'Groups & Challenges',
    subtitle: 'Join groups, compete with friends, and stay accountable together.'
  },
  {
    image: friendsScreen,
    imagePosition: 'center -305px',
    title: 'Friends & Social',
    subtitle: 'Connect with friends and share your progress'
  },

  {
    image: appBlocker,
    imagePosition: '6px -95px',
    title: 'App Blocker',
    subtitle: 'Block distracting apps, based on your needs'
  },
  {
    image: questBlock,
    imagePosition: 'center -101px',
    title: 'Quest Blocker',
    subtitle: 'We create the first ever quest blocker. Block apps until you complete your quests'
  },
  {
    image: blockNow,
    imagePosition: 'center -95px',
    title: 'Block Now',
    subtitle: 'Instantly block apps when you need to focus'
  },
  {
    image: customBlockOverlay,
    imagePosition: 'center -204px',
    title: 'Custom Block Overlay',
    subtitle: 'Each type of block and pre-built block has a custom overlay to help you stay focused'
  },
  {
    image: timeLimit,
    imagePosition: 'center -96px',
    title: 'Time Limits',
    subtitle: 'Set daily usage limits for apps and websites'
  },
  {
    image: pornBlocker,
    imagePosition: 'center -96px',
    title: 'Porn Blocker',
    subtitle: 'Block adult content and much more pre-built blocks'
  },
  {
    image: workSchedule,
    imagePosition: 'center -146px',
    title: 'Work Schedule',
    subtitle: 'Set work schedule and block distracting apps during work hours'
  },
  {
    image: pornBlocker,
    imagePosition: 'center -287px',
    title: 'Strict mode',
    subtitle: 'Block cannot be bypassed until the app is unblocked (depending on the block type)'
  },
  {
    image: dailySidequest,
    imagePosition: 'center -356px',
    title: 'Daily Sidequests',
    subtitle: 'Complete daily challenges for extra XP'
  },
  {
    image: exploreQuests,
    imagePosition: 'center -138px',
    title: 'Explore Quests',
    subtitle: 'Discover new habits and challenges'
  },
  {
    image: goalJournal,
    imagePosition: 'center -68px',
    title: 'Goal Journal',
    subtitle: 'Write plan and reflection for your goals'
  },
  {
    image: onedayQuest,
    imagePosition: 'center -279px',
    title: 'One Day Quests',
    subtitle: 'Similar to todolist, tasks for one day, possible to schedule for future days'
  },
  {
    image: monthQuest,
    imagePosition: 'center -281px',
    title: 'Monthly Quests',
    subtitle: 'Pick days of the month for your quests'
  },


  {
    image: weeklyQuest,
    imagePosition: 'center -261px',
    title: 'Weekly Quests',
    subtitle: 'Pick days of the week for your quests'
  },

  {
    image: quitQuests,
    imagePosition: 'center -268px',
    title: 'Quit Quests',
    subtitle: 'Break bad habits by daily tracking'
  },
  {
    image: reminders,
    imagePosition: 'center -252px',
    title: 'Smart Reminders',
    subtitle: 'Get reminded to complete your habits'
  },
  {
    image: rouletteQuest,
    imagePosition: 'center -129px',
    title: 'Roulette Quests',
    subtitle: 'Random challenges to keep things interesting'
  },
  {
    image: stopwatch,
    imagePosition: 'center center',
    title: 'Focus Timer',
    subtitle: 'Time your focus sessions and track productivity'
  },
  {
    image: streakCelebration,
    imagePosition: 'center -158px',
    title: 'Streak Celebrations',
    subtitle: 'Celebrate your consistency and achievements'
  },
  {
    image: leaderboardScreen,
    imagePosition: 'center -52px',
    title: 'Leaderboard',
    subtitle: 'Compete with friends and climb the rankings'
  },
  {
    image: badges,
    imagePosition: 'center -61px',
    title: 'Badges & Achievements',
    subtitle: 'Unlock badges and celebrate your milestones'
  },

  {
    image: dayCelebration,
    imagePosition: 'center -184px',
    title: 'Day Celebrations',
    subtitle: 'Celebrate completing your daily goals with custom popup'
  },
  {
    image: customTheme,
    imagePosition: 'center -195px',
    title: 'Custom Theme',
    subtitle: 'Customize profile and to your liking (9themes)'
  },
  {
    image: affiliateScreen,
    imagePosition: 'center -71px',
    title: 'Affiliate Program',
    subtitle: 'Earn rewards by sharing Upshift '
  }
];

const reviews = [
  {
    rating: 5,
    title: "Finally sticking to my habits",
    author: "emilyc_92",
    date: "Nov 11, 2025",
    content:
      "I’ve tried so many habit apps, but Upshift is the only one that actually keeps me going. It’s simple, motivating, and the little celebrations when I finish my daily goals make it weirdly fun. I actually look forward to checking things off now."
  },
  {
    rating: 5,
    title: "Focus + motivation in one app",
    author: "jayden",
    date: "Oct 29, 2025",
    content:
      "I love that Upshift helps me stay off distracting apps and keeps me productive. The focus timer and app blocker work perfectly together. I get way more done, and it doesn’t feel like a punishment — more like a game with rewards."
  },
  {
    rating: 5,
    title: "Keeps me organized without stressing me out",
    author: "nora.writes",
    date: "Oct 18, 2025",
    content:
      "I use it to track goals and small habits, and the reminders are super gentle — not annoying like other apps. I really like that I can plan my week and see how much progress I’ve made. Also, the custom profiles and popups are a nice touch!"
  },
  {
    rating: 5,
    title: "Helped me quit bad habits",
    author: "dylan_p",
    date: "Oct 8, 2025",
    content:
      "Upshift helped me cut down on scrolling and replace it with better routines. The ‘quests’ idea actually works — seeing progress every day makes it easier to stay consistent. I didn’t expect an app to motivate me this much."
  },
  {
    rating: 5,
    title: "Way more fun than a boring to-do list",
    author: "haileyx",
    date: "Sept 30, 2025",
    content:
      "I usually lose interest in productivity apps after a week, but Upshift keeps things fresh. The daily and weekly challenges are cool, and I like getting XP for finishing stuff. It actually makes self-discipline kind of enjoyable."
  },
  {
    rating: 5,
    title: "Time tracking done right",
    author: "rohanv",
    date: "Sept 24, 2025",
    content:
      "The time tracker is awesome — I can finally see where my day goes. The app blocks social media when I want to focus, which is super helpful. I’ve been finishing work earlier just because of that."
  },
  {
    rating: 4,
    title: "Annoying… but that’s why it works",
    author: "marie_l",
    date: "Sept 20, 2025",
    content:
      "I won’t lie, sometimes I hate when it stops me from opening Instagram, but then I realize that’s literally the point. It makes me think twice before wasting time. Even on the easiest setting it’s super effective."
  },
  {
    rating: 5,
    title: "Honestly life-changing",
    author: "brianco",
    date: "Sept 15, 2025",
    content:
      "After a month of using Upshift, I’ve become way more consistent with my routines. I love seeing my streaks grow and competing with friends. It’s rare for an app to make me feel this proud of my progress."
  }
];

const Features: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) < minSwipeDistance) {
      setTouchStart(0);
      setTouchEnd(0);
      return;
    }

    if (distance > 0) {
      // Swipe left - next slide (loop to start if at end)
      setCurrentSlide(prev => prev === features.length - 1 ? 0 : prev + 1);
    } else if (distance < 0) {
      // Swipe right - previous slide (loop to end if at start)
      setCurrentSlide(prev => prev === 0 ? features.length - 1 : prev - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => prev === features.length - 1 ? 0 : prev + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => prev === 0 ? features.length - 1 : prev - 1);
  };

  return (
    <div className="features-page">
      <SEO
        title="Features - Upshift App | Productivity & Personal Development Tools"
        description="Discover all features of Upshift: habit tracking, goal setting, time tracking, app blocking, quest system, groups, leaderboards, and more. Level up your life with gamification."
        keywords="upshift features, habit tracking, goal setting, time tracker, app blocker, productivity features, quest system, gamification, focus timer, porn blocker, screen time management"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData
        type="webpage"
        title="Upshift Features - All Productivity Tools"
        description="Discover all features of Upshift app"
        url="https://joinupshift.com/features"
      />
      <StructuredData
        type="faq"
        items={faqItems}
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
      <section className="features-hero">
        <div className="" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>

          <h1 className="features-title gradient-text">Features</h1>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-grid-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Desktop Grid */}
          <div className="features-grid2 desktop-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-image">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    style={{ objectPosition: feature.imagePosition || 'center center' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop';
                    }}
                  />
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-subtitle">{feature.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Slider */}
          <div className="features-slider mobile-slider">
            <div className="slider-container">
              {/* Navigation Arrows */}
              <button
                className="slider-arrow slider-arrow-left"
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                className="slider-arrow slider-arrow-right"
                onClick={nextSlide}
                aria-label="Next slide"
              >
                ›
              </button>

              <div
                className="slider-track"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {features.map((feature, index) => (
                  <div key={index} className="slider-card">
                    <div className="feature-card">
                      <div className="feature-image">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          style={{ objectPosition: feature.imagePosition || 'center center' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop';
                          }}
                        />
                      </div>
                      <div className="feature-content">
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-subtitle">{feature.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Counter */}
            <div className="slide-counter">
              {currentSlide + 1} / {features.length}
            </div>

          </div>

          <h1 className="features-more">...and much more!</h1>
        </div>

      </section>

      {/* Reviews Section */}
      <section className="reviews-section">
        <div className="">
          <h2 className="reviews-title">Reviews</h2>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-rating">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`star ${i < review.rating ? 'filled' : ''}`}
                    >
                      <div style={{ opacity: '1', height: '15px', width: '15px' }}><div style={{ display: 'contents' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-slot="icon" color="rgb(240, 154, 55)" style={{ width: '100%', height: '100%' }}><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd"></path></svg></div></div>
                    </span>
                  ))}
                </div>
                <h3 className="review-title">{review.title}</h3>
                <div className="review-meta">
                  by {review.author} - {review.date}
                </div>
                <p className="review-content">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="">
          <h2 className="faq-title">FAQ</h2>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${openFaqIndex === index ? 'open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <span className="faq-icon">
                    {openFaqIndex === index ? '×' : '+'}
                  </span>
                  {item.question}
                </button>
                {openFaqIndex === index && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
