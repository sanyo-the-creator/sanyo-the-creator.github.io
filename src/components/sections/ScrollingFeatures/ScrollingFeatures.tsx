import React, { useState, useEffect, useRef } from 'react';
import './ScrollingFeatures.css'

interface Feature {
  id: string;
  title: string;
  description: string;
  screenshot: string;
  highlights: string[];
}

interface ScrollingFeaturesProps {
  features: Feature[];
  className?: string;
}



const ScrollingFeatures: React.FC<ScrollingFeaturesProps> = ({
  features,
  className = ''
}) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Zabezpečíme, že sa vždy začne od indexu 0
  useEffect(() => {
    setActiveFeature(0);
  }, []);

  // Tu je správne použitie useState a useEffect
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobileView = windowWidth <= 809;



  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const viewportCenter = scrollY + windowHeight / 2;

      let closestIndex = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      featureRefs.current.forEach((featureEl, index) => {
        if (!featureEl) return;

        const rect = featureEl.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const elementCenter = elementTop + rect.height / 2;

        const distanceFromCenter = Math.abs(viewportCenter - elementCenter);

        // Použijeme jednoduchšiu logiku - najbližší element k centru viewportu
        if (distanceFromCenter < minDistance) {
          minDistance = distanceFromCenter;
          closestIndex = index;
        }

        if (isVisible) {
          const normalizedDistance = distanceFromCenter / (rect.height / 2);
          const dynamicOpacity = Math.max(0, 1 - normalizedDistance);
          featureEl.style.setProperty('--dynamic-opacity', dynamicOpacity.toString());
        }
      });

      // Aktualizujeme iba ak sa index skutočne zmenil
      if (closestIndex !== activeFeature) {
        ;
        setActiveFeature(closestIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, activeFeature]);

  useEffect(() => {
    if (isVisible && sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('[data-appear-animation]');

      elements.forEach((element, index) => {
        const el = element as HTMLElement;
        const delay = index * 100;

        setTimeout(() => {
          el.style.transition = 'all 0.8s cubic-bezier(0.33, 1.53, 0.69, 0.99)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0px) scale(1)';
        }, delay);
      });
    }
  }, [isVisible, isMobileView]);

  return (
    <section
      ref={sectionRef}
      className={` relative min-h-screen section ${className}`}
      data-upshift-name="Product section"
      id="product"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1s ease-out'
      }}
    >
      <div className="container-features mx-auto px-4" data-upshift-name="Container">

        {/* Feature Images Container */}
        {isMobileView ? (
          <div className="features-mobile flex flex-col gap-12">
            {features.map((feature) => (
              <div key={feature.id} className="feature-block-mobile">


                <h2
                  className="text-3xl font-bold text-white mb-4"
                  style={{ fontFamily: '"Bricolage Grotesque", sans-serif', lineHeight: '1.2' }}
                >
                  {feature.title}
                </h2>
                <p className="text-lg text-gray-300 mb-4">{feature.description}</p>
                {feature.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, i) => (
                      <div
                        key={i}
                        className="px-3 py-1 bg-gray-800 rounded text-white text-sm"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-6">
                  <div className="phone-mockup">
                    <div className="phone-screen">
                      <img
                        src={feature.screenshot}
                        alt={feature.title}
                        className="hero-screenshot"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="picus mb-8">
              <div className="relative aspect-video rounded-2xl overflow-hidden">

                {features.map((feature, index) => {
                  const isActive = activeFeature === index;
                  console.log(`Rendering image ${index}: ${feature.id}, active: ${isActive}, screenshot: ${feature.screenshot}`);

                  return (
                    <div
                      key={feature.id}
                      className="absolute inset-0 transition-opacity duration-700 kokot"
                      data-upshift-name={`Image ${index}`}
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: `scale(${isActive ? 1 : 0.95})`,
                        zIndex: isActive ? 10 : 1
                      }}
                      data-appear-animation
                    >
                      <div style={{
                        position: 'absolute',
                        borderRadius: 'inherit',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                      }}>

                        <div className="phone-mockup">
                          <div className="phone-screen">
                            <img
                              src={feature.screenshot}
                              alt={feature.title}
                              className="w-full h-full object-cover rounded-2xl"
                              style={{
                                transition: 'transform 0.8s cubic-bezier(0.33, 1.53, 0.69, 0.99)',
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                borderRadius: '0',
                                objectPosition: 'center center',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-32 kokotina">
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  ref={(el) => { featureRefs.current[index] = el; }}
                  className="min-h-screen flex items-center"
                  data-upshift-name="Tab item"
                  data-appear-animation
                  style={{
                    opacity: activeFeature === index ? 1 : 0.3,
                    transform: `translateY(${activeFeature === index ? '0px' : '20px'})`,
                    transition: 'all 0.8s cubic-bezier(0.33, 1.53, 0.69, 0.99)'
                  }}
                >
                  <div className="pome">
                    <h2
                      className="text-4xl md:text-5xl font-bold text-white mb-2"
                      style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        lineHeight: '120%'
                      }}
                    >
                      {feature.title}
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                      {feature.description}
                    </p>
                    <button className="learn-more">
                      <a href="/features">Learn More</a>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ScrollingFeatures;
