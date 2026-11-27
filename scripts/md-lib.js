// Tiny HTML -> Markdown helpers for the "Markdown for agents" twins written next to each prerendered page.
const { SITE_URL } = require('./seo-lib');

const CR = String.fromCharCode(13);
const stripTags = (s) => s.replace(/<[^>]+>/g, '').trim();

const htmlToMd = (html) =>
  html
    .split(CR)
    .join('')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (m, alt) => (alt ? `\n\n![${alt}]\n\n` : ''))
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (m, n, t) => `\n\n${'#'.repeat(Math.max(2, Number(n)))} ${stripTags(t)}\n\n`)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, t) => `[${stripTags(t)}](${href.startsWith('/') ? SITE_URL + href : href})`)
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|ul|ol|blockquote|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    // keep consecutive list items together
    .filter((line, i, lines) => !(line === '' && lines[i + 1] && lines[i + 1].startsWith('- ') && lines[i - 1] && lines[i - 1].startsWith('- ')))
    .join('\n')
    .trim();

const faqMd = (groups) =>
  groups
    .map((g) => `## ${g.title}\n\n${g.items.map((it) => `### ${it.question}\n\n${it.answer}`).join('\n\n')}`)
    .join('\n\n');

module.exports = { htmlToMd, faqMd };
