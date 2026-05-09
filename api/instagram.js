const https = require('https');

function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const { body, ...restOptions } = options;
        const req = https.request(url, restOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data.substring(0, 100)}`));
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

module.exports = async function (req, res) {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
        }

        const shortcodeMatch = videoUrl.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
        if (!shortcodeMatch) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Could not extract shortcode from URL" }));
            return;
        }
        
        const shortcode = shortcodeMatch[1];
        const appId = "936619743392459";
        
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "x-ig-app-id": appId,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "*/*",
            "Origin": "https://www.instagram.com",
            "Referer": `https://www.instagram.com/reels/${shortcode}/`,
        };

        const graphqlUrl = "https://www.instagram.com/api/v1/web/graphql/query";
        const variables = JSON.stringify({
            shortcode: shortcode,
            fetch_comment_count: null,
            fetch_related_profile_media_count: null,
            parent_comment_count: null,
            child_comment_count: null,
            fetch_like_count: null,
            fetch_tagged_user_count: null,
            fetch_preview_comment_count: null,
            has_threaded_comments: false,
            hoisted_comment_id: null,
            hoisted_reply_id: null
        });

        const body = `doc_id=8845758582119845&variables=${encodeURIComponent(variables)}`;

        // 1. Fetch Reel Data
        let data;
        try {
            data = await fetchJson(graphqlUrl, {
                method: "POST",
                headers,
                body: body
            });
        } catch (e) {
            // Try fallback doc_id
            const fallbackBody = `doc_id=10015921899073305&variables=${encodeURIComponent(variables)}`;
            data = await fetchJson(graphqlUrl, {
                method: "POST",
                headers,
                body: fallbackBody
            });
        }
        
        const media = data?.data?.xdt_shortcode_media;

        if (!media) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to fetch Reel data from Instagram. The video might be private or deleted." }));
            return;
        }

        const views = media.play_count || media.video_view_count || 0;
        const thumb = media.display_url || "";
        const username = media.owner?.username;
        
        // 2. Fetch Profile Info for Bio Link
        let biography = "";
        let externalUrl = "";
        if (username) {
            try {
                const profileUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
                const profileData = await fetchJson(profileUrl, { headers });
                const userInfo = profileData?.data?.user || {};
                biography = userInfo.biography || "";
                externalUrl = userInfo.external_url || "";
            } catch (e) {
                console.error("Profile fetch failed:", e);
            }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            views,
            thumbnail: thumb,
            username,
            biography,
            external_url: externalUrl
        }));

    } catch (e) {
        console.error("Scraper Error:", e);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
    }
}
