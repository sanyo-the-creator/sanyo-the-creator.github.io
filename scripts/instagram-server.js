const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');

// Load env from .env.local (then .env) so serverless handlers that read
// process.env (e.g. OPENROUTER_API_KEY) work when run through this dev server.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Reuse the actual Vercel serverless handler so local and prod share one code path.
const redditRewriteHandler = require('../api/reddit-rewrite.js');

function fetchText(targetUrl, options = {}) {
    return new Promise((resolve, reject) => {
        const { body, ...restOptions } = options;
        const req = https.request(targetUrl, restOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] GET ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    try {
        const parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname.includes('/api/reddit-rewrite')) {
            await redditRewriteHandler(req, res);
            return;
        }
        if (parsedUrl.pathname.includes('/api/instagram')) {
            const videoUrl = parsedUrl.query.url;
            if (!videoUrl) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'URL is required' }));
                return;
            }

            const shortcodeMatch = videoUrl.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
            if (!shortcodeMatch) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Invalid URL" }));
                return;
            }
            const shortcode = shortcodeMatch[1];
            
            console.log(`  => Scraping Real Data for: ${shortcode}`);

            // TRY TIKWM API (Often works for Instagram too)
            try {
                console.log("  => Trying TikWM API...");
                const tikwmUrl = `https://www.tikwm.com/api/ig/posts?url=${encodeURIComponent(videoUrl)}`;
                const tikRes = await fetchText(tikwmUrl);
                const tikData = JSON.parse(tikRes);
                if (tikData.data && tikData.data.length > 0) {
                    const post = tikData.data[0];
                    console.log("  => TikWM Success!");
                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        views: post.play_count || post.view_count || 0,
                        thumbnail: post.cover || "",
                        username: post.author?.username || "user",
                        biography: "",
                        external_url: "joinupshift.com/download/instagram?ref=upshift"
                    }));
                    return;
                }
            } catch (e) { console.log(`  => TikWM Failed`); }

            // TRY HTML META SCRAPE (Mobile UA)
            try {
                console.log("  => Trying HTML Meta Scrape (Mobile UA)...");
                const html = await fetchText(`https://www.instagram.com/reels/${shortcode}/`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
                        "Accept-Language": "en-US,en;q=0.9"
                    }
                });

                // Instagram often puts views in the "og:description" or "description" meta tags
                // Pattern: "1M views, 2,345 likes..."
                const metaDesc = html.match(/<meta content="([^"]+ views[^"]+)" name="description"/i);
                if (metaDesc) {
                    const content = metaDesc[1].toLowerCase();
                    const viewMatch = content.match(/([\d,.]+[km]?)\s*views/);
                    if (viewMatch) {
                        let viewStr = viewMatch[1].replace(/,/g, '');
                        let views = 0;
                        if (viewStr.endsWith('k')) views = parseFloat(viewStr) * 1000;
                        else if (viewStr.endsWith('m')) views = parseFloat(viewStr) * 1000000;
                        else views = parseInt(viewStr);

                        console.log(`  => HTML Meta Success! Found: ${viewStr}`);
                        res.statusCode = 200;
                        res.end(JSON.stringify({
                            views,
                            thumbnail: "",
                            username: "user",
                            biography: "",
                            external_url: "joinupshift.com/download/instagram?ref=upshift"
                        }));
                        return;
                    }
                }
                
                // Try searching for play_count in the JS state
                const playCountMatch = html.match(/"play_count":(\d+)/);
                if (playCountMatch) {
                    console.log("  => Found play_count in JS!");
                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        views: parseInt(playCountMatch[1]),
                        thumbnail: "",
                        username: "user",
                        biography: "",
                        external_url: "joinupshift.com/download/instagram?ref=upshift"
                    }));
                    return;
                }
            } catch (e) { console.log(`  => HTML Scrape Failed`); }

            // IF ALL ELSE FAILS, TRY THE GITHUB DOC_ID ONE LAST TIME WITH BETTER HEADERS
            try {
                console.log("  => Trying GraphQL (Method 1) with better headers...");
                const appId = "936619743392459";
                const variables = JSON.stringify({ shortcode });
                const body = `doc_id=8845758582119845&variables=${encodeURIComponent(variables)}`;
                const graphqlUrl = "https://www.instagram.com/api/v1/web/graphql/query";
                
                const igRes = await fetchText(graphqlUrl, {
                    method: "POST",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "x-ig-app-id": appId,
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "*/*",
                        "X-ASBD-ID": "129477",
                        "X-IG-WWW-Claim": "0",
                        "X-Requested-With": "XMLHttpRequest",
                        "Origin": "https://www.instagram.com",
                        "Referer": `https://www.instagram.com/reels/${shortcode}/`
                    },
                    body: body
                });
                
                const data = JSON.parse(igRes);
                const media = data?.data?.xdt_shortcode_media;
                if (media) {
                    console.log("  => GraphQL Success!");
                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        views: media.play_count || media.video_view_count || 0,
                        thumbnail: media.display_url || "",
                        username: media.owner?.username,
                        biography: "",
                        external_url: "joinupshift.com/download/instagram?ref=upshift"
                    }));
                    return;
                }
            } catch (e) { console.log(`  => GraphQL Failed`); }

            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Could not fetch real data. Instagram might be blocking us." }));
        }
    } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`\nREAL-TIME SCRAPER READY ON PORT ${PORT}`);
});
