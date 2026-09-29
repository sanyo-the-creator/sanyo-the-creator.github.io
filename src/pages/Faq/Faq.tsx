import React, { useState } from 'react';
import { SEO, StructuredData } from '../../components/common/SEO';
import { SUPPORT_EMAIL } from '../../components/site/SiteChrome';
import { faqGroups, faqItems } from '../../data/faqs';
import './Faq.css';

const Faq: React.FC = () => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = faqGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !q || `${it.question} ${it.summary || ''} ${it.answer}`.toLowerCase().includes(q)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="faq-page">
      <SEO
        title="FAQ - Upshift | Quests, Quest Blocker, Goals and More"
        description="Answers about Upshift: quests and sidequests, the Quest Blocker, app blocks, goals, time tracking, friends, pricing and privacy."
        keywords="upshift faq, quest blocker, app blocker help, habit tracker questions, screen time privacy"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData type="faq" items={faqItems} />

      <section className="faq-intro">
        <span className="site-eyebrow">Need Help?</span>
        <h1>Frequently Asked <span className="faq-grad">Questions</span></h1>
        <p>Everything about quests, the blocker, goals, friends and your account.</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions"
          aria-label="Search questions"
        />
      </section>

      {groups.map((g) => (
        <section key={g.title} className="faq-group">
          <h2 className="site-chip"><span aria-hidden="true">{g.icon}</span>{g.title}</h2>
          {g.items.map((it) => (
            <details key={it.question}>
              <summary>
                <span>
                  <strong>{it.question}</strong>
                  {it.summary && <small>{it.summary}</small>}
                </span>
              </summary>
              <div className="faq-body"><p>{it.answer}</p></div>
            </details>
          ))}
        </section>
      ))}

      {groups.length === 0 && <p className="faq-empty">No questions match your search.</p>}

      <section className="faq-contact">
        <h2>Still stuck?</h2>
        <p>Email us and we'll get back to you.</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="site-cta">Email Support</a>
      </section>
    </div>
  );
};

export default Faq;
