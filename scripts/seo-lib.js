// Shared helpers for the build-time SEO scripts (sitemap, llms.txt, prerender).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const config = require('../src/i18n/config.json');

const SITE_URL = config.siteUrl;
const LOCALES = config.locales;
const DEFAULT_LOCALE = config.defaultLocale;

const messages = {};
for (const l of LOCALES) {
  messages[l.code] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/messages', `${l.code}.json`), 'utf8'));
}

// "/" + "de" -> "/de", "/faq" + "de" -> "/de/faq", English keeps the plain path.
const localizePath = (lang, p) => {
  if (lang === DEFAULT_LOCALE) return p;
  return p === '/' ? `/${lang}` : `/${lang}${p}`;
};
const absolute = (p) => `${SITE_URL}${p}`;

// English-only pages (their copy lives in the React components, not in the locale files).
const STATIC_PAGES = [
  {
    path: '/about',
    title: 'About Upshift - Our Mission | Personal Development App',
    description:
      "Learn about Upshift's mission to transform lives through gamified personal development. Discover our story, vision, and commitment to helping you achieve your goals.",
    h1: 'About Upshift',
  },
  {
    path: '/articles',
    title: 'Articles - Productivity & Personal Development Tips | Upshift',
    description:
      'Read helpful articles about productivity, app blocking, screen time management, digital wellness, and personal development. Learn how to improve focus and achieve your goals.',
    h1: 'Guides for Less Scrolling',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy - Upshift | Your Data Protection & Privacy',
    description:
      "Read Upshift's Privacy Policy to understand how we collect, use, and protect your personal information. Your privacy is our priority.",
    h1: 'Privacy Policy',
  },
  {
    path: '/terms',
    title: 'Terms & Conditions - Upshift | User Agreement',
    description:
      "Read Upshift's Terms and Conditions to understand the rules and guidelines for using our productivity and personal development app.",
    h1: 'Terms & Conditions',
  },
];

const unescapeTs = (s) => s.replace(/\\(['"`\\])/g, '$1');

// articles.ts imports images, so it can't be required from node: pull the plain fields with a regex.
const readArticles = () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/articles.ts'), 'utf8');
  const blocks = src.split(/\n\s*\{\s*\n\s*id:/).slice(1);
  const field = (block, name) => {
    const m = block.match(new RegExp(`${name}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`));
    return m ? unescapeTs(m[2]) : '';
  };
  return blocks.map((b) => ({
    title: field(b, 'title'),
    subtitle: field(b, 'subtitle'),
    slug: field(b, 'slug'),
    htmlContentPath: field(b, 'htmlContentPath'),
    publishedDate: field(b, 'publishedDate'),
  })).filter((a) => a.slug);
};

const gitDate = (...files) => {
  try {
    const out = execSync(`git log -1 --format=%cs -- ${files.join(' ')}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (out) return out;
  } catch (e) {
    // not a git checkout (e.g. CI tarball): fall through
  }
  return new Date().toISOString().split('T')[0];
};

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Strip the [[blue]] {{orange}} | markers used in locale strings.
const plain = (s) => s.replace(/\[\[|\]\]|\{\{|\}\}/g, '').replace(/\s*\|\s*/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = {
  ROOT, config, SITE_URL, LOCALES, DEFAULT_LOCALE, messages, STATIC_PAGES,
  localizePath, absolute, readArticles, gitDate, escapeHtml, plain,
  LOCALIZED_PATHS: config.localizedPaths,
};
