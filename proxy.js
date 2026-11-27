// Vercel Routing Middleware (configured as proxy.entrypoint in vercel.json, matcher lives there too): "Markdown for agents".
// When a client sends `Accept: text/markdown`, answer with the Markdown twin of the page that the build step
// (scripts/prerender.js) wrote to /md/. Everyone else, including browsers and search crawlers, gets the normal HTML.
// Static files are served before vercel.json rewrites, which is why this is middleware and not a rewrite rule.
import { next, rewrite } from '@vercel/functions';

export default function proxy(request) {
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/markdown')) {
    return next({ headers: { Vary: 'Accept' } });
  }

  const url = new URL(request.url);
  const clean = url.pathname.replace(/\/+$/, '');
  url.pathname = clean === '' ? '/md/index.md' : `/md${clean}.md`;
  return rewrite(url);
}
