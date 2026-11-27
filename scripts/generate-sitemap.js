// Generates public/sitemap.xml (with hreflang alternates) and public/llms-full.txt before every build.
const fs = require('fs');
const path = require('path');
const {
  ROOT, SITE_URL, LOCALES, messages, STATIC_PAGES, LOCALIZED_PATHS,
  localizePath, absolute, readArticles, gitDate, plain,
} = require('./seo-lib');

const i18nDate = gitDate('src/i18n');
const articles = readArticles();
const urls = [];

// Translated pages: every language links to every other one (and x-default = English).
for (const p of LOCALIZED_PATHS) {
  const alternates = LOCALES.map((l) => ({ hreflang: l.hreflang, href: absolute(localizePath(l.code, p)) }));
  alternates.push({ hreflang: 'x-default', href: absolute(localizePath('en', p)) });
  for (const l of LOCALES) {
    urls.push({ loc: absolute(localizePath(l.code, p)), lastmod: i18nDate, alternates });
  }
}

const pagesDate = gitDate('src/pages');
for (const p of STATIC_PAGES) urls.push({ loc: absolute(p.path), lastmod: pagesDate });
urls.push({ loc: absolute('/ai-info'), lastmod: i18nDate });
for (const a of articles) {
  urls.push({ loc: absolute(`/articles/${a.slug}`), lastmod: (a.publishedDate || '').slice(0, 10) || pagesDate });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>${(u.alternates || [])
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
      .join('')}
  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'public/sitemap.xml'), xml);

// llms-full.txt: one plain-text file with the product facts and the whole FAQ, for AI assistants.
const en = messages.en;
const full = [
  '# Upshift',
  '',
  `> ${en.meta.home.description}`,
  '',
  `Website: ${SITE_URL}/`,
  'iPhone: https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316',
  'Android: https://play.google.com/store/apps/details?id=com.upshift.app',
  'Support: support@joinupshift.com',
  '',
  '## What Upshift does',
  '',
  plain(en.landing.statement),
  '',
  en.landing.heroText,
  '',
  ...en.landing.features.flatMap((f) => [`### ${f.chip.replace(/^\S+\s/, '')}: ${f.title.join(' ')}`, '', f.text, '']),
  '## Frequently asked questions',
  '',
  ...en.faq.groups.flatMap((g) => [
    `### ${g.title}`,
    '',
    ...g.items.flatMap((it) => [`**${it.question}**`, '', it.answer, '']),
  ]),
  '## Languages',
  '',
  'The home page, FAQ and download page are available in: ' +
    LOCALES.map((l) => `${l.name} (${absolute(localizePath(l.code, '/'))})`).join(', ') + '.',
  '',
  '## Guides',
  '',
  ...articles.map((a) => `- [${a.title}](${absolute(`/articles/${a.slug}`)}): ${a.subtitle}`),
  '',
].join('\n');
fs.writeFileSync(path.join(ROOT, 'public/llms-full.txt'), full);

console.log(`Sitemap generated with ${urls.length} URLs, llms-full.txt written`);
