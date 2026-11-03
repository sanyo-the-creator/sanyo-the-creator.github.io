// Post-build step: write real HTML (head tags, hreflang, JSON-LD and a readable body) for every public page,
// so crawlers and AI bots that do not run JavaScript still get the content. React replaces the snapshot on load.
const fs = require('fs');
const path = require('path');
const {
  ROOT, SITE_URL, LOCALES, DEFAULT_LOCALE, messages, STATIC_PAGES, LOCALIZED_PATHS,
  localizePath, absolute, readArticles, escapeHtml: esc, plain,
} = require('./seo-lib');

const BUILD = path.join(ROOT, 'build');
const APP_STORE_URL = 'https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.upshift.app';
const SUPPORT_EMAIL = 'support@joinupshift.com';
const ICON = `${SITE_URL}/icon.png`;
const ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const template = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');

// Strip the page-specific tags from the built template; every page gets its own set below.
const stripHead = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta (?:name="(?:description|keywords|robots|author|title|twitter:[^"]*)"|property="(?:og|twitter):[^"]*")[^>]*>/gi, '')
    .replace(/<link rel="canonical"[^>]*>/gi, '')
    .replace(/<link rel="alternate" hreflang[^>]*>/gi, '');

const base = stripHead(template);

// Generic shell for client-only routes (tools, portal, redirects). Served by the Vercel rewrite in vercel.json.
const shell = base
  .replace('</head>', `<title>Upshift</title><meta name="robots" content="${ROBOTS}"></head>`);
fs.writeFileSync(path.join(BUILD, '_shell.html'), shell);

const ld = (type, obj) =>
  `<script type="application/ld+json" data-schema-type="${type}">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const orgLd = (description) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Upshift',
  url: SITE_URL,
  logo: ICON,
  description,
  sameAs: ['https://instagram.com/joinupshift', APP_STORE_URL, PLAY_STORE_URL],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: SUPPORT_EMAIL,
    availableLanguage: LOCALES.map((l) => l.hreflang),
  },
});
const websiteLd = (lang, description) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Upshift',
  url: SITE_URL,
  inLanguage: lang,
  description,
  publisher: { '@id': `${SITE_URL}/#organization` },
});
const appLd = (description) => ({
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Upshift',
  description,
  operatingSystem: 'iOS, Android',
  applicationCategory: 'LifestyleApplication',
  applicationSubCategory: 'Habit tracker and app blocker',
  installUrl: [APP_STORE_URL, PLAY_STORE_URL],
  downloadUrl: APP_STORE_URL,
  image: ICON,
  inLanguage: LOCALES.map((l) => l.hreflang),
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@id': `${SITE_URL}/#organization` },
});
const pageLd = (lang, title, description, url) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url,
  inLanguage: lang,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  publisher: { '@id': `${SITE_URL}/#organization` },
});
const crumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});

// ---- body snapshots (plain semantic HTML; hidden from nobody, replaced by React on load) ----
const wrap = (inner) =>
  `<div style="background:#010203;color:#fff;font-family:system-ui,sans-serif;line-height:1.55;min-height:100vh;padding:32px 24px"><div style="max-width:860px;margin:0 auto">${inner}</div></div>`;

const navHtml = (lang, t) =>
  `<nav aria-label="${esc(t.nav.mainNav)}"><a href="${localizePath(lang, '/')}">Upshift</a> | <a href="${localizePath(lang, '/')}#features">${esc(t.nav.features)}</a> | <a href="${localizePath(lang, '/faq')}">${esc(t.nav.faq)}</a> | <a href="${localizePath(lang, '/download')}">${esc(t.nav.download)}</a> | <a href="/articles">${esc(t.nav.blog)}</a></nav>`;

const storesHtml = (t) =>
  `<p><a href="${APP_STORE_URL}">${esc(t.stores.appStoreSmall)} App Store</a> | <a href="${PLAY_STORE_URL}">${esc(t.stores.playSmall)} Google Play</a></p>`;

const langsHtml = (t, p) =>
  `<nav aria-label="${esc(t.nav.language)}">${LOCALES.map((l) => `<a href="${localizePath(l.code, p)}" hreflang="${l.hreflang}" lang="${l.hreflang}">${esc(l.name)}</a>`).join(' | ')}</nav>`;

const footerHtml = (lang, t, p) =>
  `<footer>${langsHtml(t, p)}<p><a href="/privacy">${esc(t.nav.privacy)}</a> | <a href="/terms">${esc(t.nav.terms)}</a> | <a href="mailto:${SUPPORT_EMAIL}">${esc(t.nav.contact)}</a></p></footer>`;

const faqHtml = (groups) =>
  groups
    .map(
      (g) =>
        `<section><h2>${esc(g.title)}</h2>${g.items.map((it) => `<h3>${esc(it.question)}</h3><p>${esc(it.answer)}</p>`).join('')}</section>`
    )
    .join('');

const pages = [];

for (const l of LOCALES) {
  const t = messages[l.code];
  const L = t.landing;
  const allFaq = t.faq.groups.flatMap((g) => g.items);

  // Home
  pages.push({
    lang: l.code,
    path: localizePath(l.code, '/'),
    basePath: '/',
    meta: t.meta.home,
    ld: [
      ld('organization', orgLd(t.meta.home.description)),
      ld('website', websiteLd(l.code, t.meta.home.description)),
      ld('software', appLd(t.meta.home.description)),
    ],
    body: wrap(
      `${navHtml(l.code, t)}<h1>${esc(plain(L.h1))}</h1><p>${esc(L.heroText)}</p>${storesHtml(t)}` +
        `<h2>${esc(plain(L.statement))}</h2>` +
        `<section><h2>${esc(L.featuresTitle)}</h2>${L.features
          .map((f) => `<h3>${esc(f.chip)}: ${esc(f.title.join(' '))}</h3><p>${esc(f.text)}</p>`)
          .join('')}</section>` +
        `<section><h2>${esc(L.faqTitle)}</h2>${allFaq
          .slice(0, 6)
          .map((it) => `<h3>${esc(it.question)}</h3><p>${esc(it.answer)}</p>`)
          .join('')}<p><a href="${localizePath(l.code, '/faq')}">${esc(L.seeAll)}</a></p></section>` +
        `<h2>${esc(plain(L.ctaTitle))}</h2>${storesHtml(t)}${footerHtml(l.code, t, '/')}`
    ),
  });

  // FAQ
  const faqUrl = absolute(localizePath(l.code, '/faq'));
  pages.push({
    lang: l.code,
    path: localizePath(l.code, '/faq'),
    basePath: '/faq',
    meta: t.meta.faq,
    ld: [
      ld('faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: l.code,
        mainEntity: allFaq.map((it) => ({
          '@type': 'Question',
          name: it.question,
          acceptedAnswer: { '@type': 'Answer', text: it.answer },
        })),
      }),
      ld(
        'breadcrumb',
        crumbLd([
          { name: 'Upshift', url: absolute(localizePath(l.code, '/')) },
          { name: t.nav.faq, url: faqUrl },
        ])
      ),
    ],
    body: wrap(
      `${navHtml(l.code, t)}<h1>${esc(plain(t.faqPage.h1))}</h1><p>${esc(t.faqPage.intro)}</p>${faqHtml(t.faq.groups)}` +
        `<h2>${esc(t.faqPage.stuckTitle)}</h2><p>${esc(t.faqPage.stuckText)} <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>${footerHtml(l.code, t, '/faq')}`
    ),
  });

  // Download
  pages.push({
    lang: l.code,
    path: localizePath(l.code, '/download'),
    basePath: '/download',
    meta: t.meta.download,
    ld: [ld('webpage', pageLd(l.code, t.meta.download.title, t.meta.download.description, absolute(localizePath(l.code, '/download'))))],
    body: wrap(
      `${navHtml(l.code, t)}<h1>${esc(plain(t.downloadPage.h1))}</h1><p>${esc(t.downloadPage.text)}</p>${storesHtml(t)}${footerHtml(l.code, t, '/download')}`
    ),
  });
}

// English-only pages
const en = messages.en;
for (const p of STATIC_PAGES) {
  pages.push({
    lang: 'en',
    path: p.path,
    meta: { title: p.title, description: p.description, keywords: '' },
    ld: [ld('webpage', pageLd('en', p.title, p.description, absolute(p.path)))],
    body: wrap(`${navHtml('en', en)}<h1>${esc(p.h1)}</h1><p>${esc(p.description)}</p>${footerHtml('en', en, '/')}`),
  });
}

for (const a of readArticles()) {
  const file = path.join(BUILD, a.htmlContentPath.replace(/^\//, ''));
  if (!fs.existsSync(file)) {
    console.warn(`prerender: missing article body ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const firstImg = (content.match(/<img[^>]+src="([^"]+)"/) || [])[1];
  const url = absolute(`/articles/${a.slug}`);
  const title = `${a.title} | Upshift`;
  pages.push({
    lang: 'en',
    path: `/articles/${a.slug}`,
    type: 'article',
    image: firstImg ? absolute(firstImg) : ICON,
    published: a.publishedDate,
    meta: { title, description: a.subtitle, keywords: '' },
    ld: [
      ld('article', {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        description: a.subtitle,
        image: firstImg ? absolute(firstImg) : ICON,
        datePublished: a.publishedDate,
        dateModified: a.publishedDate,
        inLanguage: 'en',
        author: { '@type': 'Person', name: 'Upshift Team' },
        publisher: { '@type': 'Organization', name: 'Upshift', logo: { '@type': 'ImageObject', url: ICON } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      }),
      ld(
        'breadcrumb',
        crumbLd([
          { name: 'Home', url: absolute('/') },
          { name: 'Articles', url: absolute('/articles') },
          { name: a.title, url },
        ])
      ),
    ],
    body: wrap(`${navHtml('en', en)}<article><h1>${esc(a.title)}</h1><p>${esc(a.subtitle)}</p>${content}</article>${footerHtml('en', en, '/')}`),
  });
}

// ---- write files ----
const metaTag = (attr, name, content) => `<meta ${attr}="${esc(name)}" content="${esc(content)}">`;

for (const pg of pages) {
  const locale = LOCALES.find((l) => l.code === pg.lang);
  const canonical = absolute(pg.path === '/' ? '/' : pg.path);
  const tags = [
    `<title>${esc(pg.meta.title)}</title>`,
    metaTag('name', 'description', pg.meta.description),
    pg.meta.keywords ? metaTag('name', 'keywords', pg.meta.keywords) : '',
    metaTag('name', 'robots', ROBOTS),
    `<link rel="canonical" href="${canonical}">`,
  ];

  if (pg.basePath && LOCALIZED_PATHS.includes(pg.basePath)) {
    for (const l of LOCALES) {
      tags.push(`<link rel="alternate" hreflang="${l.hreflang}" href="${absolute(localizePath(l.code, pg.basePath))}">`);
    }
    tags.push(`<link rel="alternate" hreflang="x-default" href="${absolute(localizePath(DEFAULT_LOCALE, pg.basePath))}">`);
  }

  tags.push(
    metaTag('property', 'og:type', pg.type || 'website'),
    metaTag('property', 'og:site_name', 'Upshift'),
    metaTag('property', 'og:title', pg.meta.title),
    metaTag('property', 'og:description', pg.meta.description),
    metaTag('property', 'og:url', canonical),
    metaTag('property', 'og:image', pg.image || ICON),
    metaTag('property', 'og:locale', locale.ogLocale)
  );
  if (pg.basePath && LOCALIZED_PATHS.includes(pg.basePath)) {
    for (const l of LOCALES.filter((x) => x.code !== pg.lang)) tags.push(metaTag('property', 'og:locale:alternate', l.ogLocale));
  }
  if (pg.published) tags.push(metaTag('property', 'article:published_time', pg.published));
  tags.push(
    metaTag('name', 'twitter:card', 'summary_large_image'),
    metaTag('name', 'twitter:title', pg.meta.title),
    metaTag('name', 'twitter:description', pg.meta.description),
    metaTag('name', 'twitter:image', pg.image || ICON),
    ...pg.ld
  );

  const html = base
    .replace(/<html lang="[^"]*"/, `<html lang="${pg.lang}"`)
    .replace('</head>', `${tags.filter(Boolean).join('')}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${pg.body}</div>`);

  if (!html.includes('<div id="root">' + pg.body.slice(0, 20))) throw new Error(`prerender: could not inject body for ${pg.path}`);

  const out = pg.path === '/' ? path.join(BUILD, 'index.html') : path.join(BUILD, pg.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

console.log(`Prerendered ${pages.length} pages (+ _shell.html)`);
