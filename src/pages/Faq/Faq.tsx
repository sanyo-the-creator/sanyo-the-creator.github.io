import React, { useState } from 'react';
import { SEO, StructuredData } from '../../components/common/SEO';
import { SUPPORT_EMAIL } from '../../components/site/SiteChrome';
import { useLocale, rich } from '../../i18n';
import './Faq.css';

const Faq: React.FC = () => {
  const { t, lang } = useLocale();
  const F = t.faqPage;
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const faqGroups = t.faq.groups;
  const faqItems = faqGroups.flatMap((g) => g.items);

  const groups = faqGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !q || `${it.question} ${it.summary || ''} ${it.answer}`.toLowerCase().includes(q)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="faq-page">
      <SEO
        title={t.meta.faq.title}
        description={t.meta.faq.description}
        keywords={t.meta.faq.keywords}
        image="https://www.joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData type="faq" items={faqItems} />
      <StructuredData
        type="breadcrumb"
        items={[
          { name: 'Upshift', url: `https://www.joinupshift.com${lang === 'en' ? '/' : `/${lang}`}` },
          { name: t.nav.faq, url: `https://www.joinupshift.com${lang === 'en' ? '' : `/${lang}`}/faq` },
        ]}
      />

      <section className="faq-intro">
        <span className="site-eyebrow">{F.eyebrow}</span>
        <h1>{rich(F.h1, 'faq-grad')}</h1>
        <p>{F.intro}</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={F.search}
          aria-label={F.search}
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

      {groups.length === 0 && <p className="faq-empty">{F.empty}</p>}

      <section className="faq-contact">
        <h2>{F.stuckTitle}</h2>
        <p>{F.stuckText}</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="site-cta">{F.stuckCta}</a>
      </section>
    </div>
  );
};

export default Faq;
