import React from 'react';
import { SEO, StructuredData } from '../../components/common/SEO';
import { SITE_URL } from '../../i18n';
import info from '../../i18n/aiInfo.json';

const AiInfo: React.FC = () => (
  <div className="faq-page">
    <SEO title={info.title} description={info.description} image={`${SITE_URL}/icon.png`} type="website" />
    <StructuredData type="webpage" title={info.title} description={info.description} url={`${SITE_URL}/ai-info`} />

    <section className="faq-intro">
      <span className="site-eyebrow">Facts</span>
      <h1>{info.title}</h1>
      <p>Last updated {info.updated}.</p>
    </section>

    {info.sections.map((s) => (
      <section key={s.heading} className="faq-group">
        <h2 className="site-chip">{s.heading}</h2>
        <div className="faq-body">
          {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
          {s.list && (
            <ul>
              {s.list.map((li) => <li key={li}>{li}</li>)}
            </ul>
          )}
        </div>
      </section>
    ))}
  </div>
);

export default AiInfo;
