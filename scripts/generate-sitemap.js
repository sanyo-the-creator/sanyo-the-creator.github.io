const fs = require('fs');
const path = require('path');

// Base URL of the website
const BASE_URL = 'https://joinupshift.com';

// Static routes
const routes = [
  '/',
  '/features',
  '/download',
  '/about',
  '/articles',
  '/privacy',
  '/terms',
  // Add other static routes here
];

// Read articles to generate dynamic routes
// Since we can't easily import TS files in a JS script without compilation, 
// we'll try to parse the file or require it if we can transpile on the fly.
// For simplicity in this environment, we'll read the file content and regex for slugs.
// A more robust solution would be to have a separate build step for this or use ts-node.

const articlesFilePath = path.join(__dirname, '../src/data/articles.ts');

try {
  const articlesContent = fs.readFileSync(articlesFilePath, 'utf8');
  
  // Regex to find slug: 'some-slug-here'
  // Looking for patterns like: slug: 'how-to-block-apps-iphone-upshift'
  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = slugRegex.exec(articlesContent)) !== null) {
    if (match[1]) {
      routes.push(`/articles/${match[1]}`);
    }
  }
} catch (error) {
  console.error('Error reading articles file:', error);
}

// Generate XML content
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(route => {
    return `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

// Write to public/sitemap.xml
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapContent);

console.log(`Sitemap generated with ${routes.length} URLs at ${sitemapPath}`);
