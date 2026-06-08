import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft as _FiChevronLeft, FiChevronRight as _FiChevronRight } from 'react-icons/fi';

const FiChevronLeft = _FiChevronLeft as React.ElementType;
const FiChevronRight = _FiChevronRight as React.ElementType;

// Drop the real screenshots into /public/images/reddit-examples/
// (see the README.txt in that folder). Add/remove entries here freely.
const RESULT_IMAGES: { src: string; caption: string }[] = [
  { src: '/images/reddit-examples/IMG_0604.PNG', caption: '750K+ views · r/Habits · 1.3K upvotes' },
  { src: '/images/reddit-examples/IMG_5325 (1).jpg', caption: '~160K views · r/Adulting · 402 upvotes' },
  { src: '/images/reddit-examples/IMG_5323.jpg', caption: '144K views · r/DarkPsychology101 · 496 upvotes' },
  { src: '/images/reddit-examples/IMG_5324.jpg', caption: '141K views · r/Mindfulness · 463 upvotes' },
  { src: '/images/reddit-examples/IMG_5328.jpg', caption: '136K views · r/Habits · 306 upvotes' },
  { src: '/images/reddit-examples/IMG_5327.jpg', caption: '~130K views · r/davidgoggins · 359 upvotes' },
  { src: '/images/reddit-examples/IMG_5326.jpg', caption: '~120K views · r/happy · 359 upvotes' },
  { src: '/images/reddit-examples/Screenshot 2026-06-03 180119.jpg', caption: '~105K views · r/happy · 277 upvotes' },
  { src: '/images/reddit-examples/Screenshot 2026-06-03 180154.jpg', caption: '~90K views · r/NABEER · 248 upvotes' },
  { src: '/images/reddit-examples/Screenshot 2026-06-03 180249.jpg', caption: '~72K views · r/stopdrinkingfitness · 216 upvotes' },
  { src: '/images/reddit-examples/IMG_5330.jpg', caption: '94K views · r/Habits · 158 upvotes' },
  { src: '/images/reddit-examples/IMG_5331.jpg', caption: '69K views · r/Buildingmyfutureself · 138 upvotes' },
  { src: '/images/reddit-examples/IMG_5332.jpg', caption: '56K views · r/Productivitycafe · 129 upvotes' },
  { src: '/images/reddit-examples/IMG_5329.jpg', caption: '47K views · r/motivation · 195 upvotes' },
];

interface RedditResultsSliderProps {
  images?: { src: string; caption: string }[];
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
}

const RedditResultsSlider: React.FC<RedditResultsSliderProps> = ({
  images = RESULT_IMAGES,
  title = 'Real results from creators',
  subtitle = 'Proof of concept — these are real posts made with this exact playbook.',
  autoPlay = true,
}) => {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + count) % count);
  }, [count]);

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [autoPlay, count]);

  if (count === 0) return null;

  return (
    <div className="reddit-results-slider">
      <div className="reddit-results-head">
        <h3 className="requirements-title" style={{ marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{subtitle}</p>
      </div>

      <div className="reddit-slider-frame">
        {count > 1 && (
          <button className="reddit-slider-arrow left" onClick={() => go(-1)} aria-label="Previous">
            <FiChevronLeft />
          </button>
        )}

        <div className="reddit-slider-track">
          {images.map((img, i) => (
            <div
              key={img.src}
              className={`reddit-slide ${i === index ? 'active' : ''}`}
              style={{ display: i === index ? 'flex' : 'none' }}
            >
              <img
                src={img.src}
                alt={img.caption}
                className="reddit-slide-img"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.objectFit = 'contain';
                  el.src =
                    'data:image/svg+xml;utf8,' +
                    encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="500"><rect width="100%" height="100%" fill="#16161f"/><text x="50%" y="48%" fill="#ff4500" font-size="20" font-family="sans-serif" text-anchor="middle">Reddit example</text><text x="50%" y="55%" fill="#666" font-size="12" font-family="sans-serif" text-anchor="middle">add image to /images/reddit-examples/</text></svg>`
                    );
                }}
              />
              {img.caption && <div className="reddit-slide-caption">{img.caption}</div>}
            </div>
          ))}
        </div>

        {count > 1 && (
          <button className="reddit-slider-arrow right" onClick={() => go(1)} aria-label="Next">
            <FiChevronRight />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="reddit-slider-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`reddit-slider-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RedditResultsSlider;
