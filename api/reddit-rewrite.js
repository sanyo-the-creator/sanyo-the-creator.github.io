// Vercel serverless function: rewrite a Reddit post so it reads like a
// different real person wrote it from scratch about the same thing.
// Ported from the SlideSmith "rewrite" tool. All generation goes through
// OpenRouter using a server-side key (OPENROUTER_API_KEY) so it is never
// exposed to the browser.

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

// A shared set of instructions that make output read like a real person.
const HUMAN_RULES = `Write like a normal person typing casually on their phone. Rules:
- Plain everyday words, contractions, short sentences.
- Do NOT use the double-quote character (") anywhere.
- Avoid AI/marketing words and phrases (delve, moreover, furthermore, tapestry, elevate, unleash, seamless, in conclusion, "as an AI", etc.).
- No corporate or overly polished tone. A tiny grammar slip or lowercase here and there is fine — it should feel human, not perfect.
- No emojis unless it genuinely fits. No hashtags.`;

function buildRewritePrompt(title, body) {
  return `You are rewriting a Reddit post so it reads like a DIFFERENT real person wrote it from scratch about the same thing.

Original title:
${title || '(none)'}

Original body:
${body || '(none)'}

Keep the same topic, meaning and rough structure of both the title and the body, but change the wording enough that it is clearly not a copy. Match the original's length and vibe.

${HUMAN_RULES}

Return ONLY a JSON object: {"title": "the rewritten title", "body": "the rewritten body"}. If the original had no body, return an empty string for body.`;
}

// Pull a JSON object out of a model response, tolerating code fences / prose.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON.');
  return JSON.parse(candidate.slice(start, end + 1));
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) {
      resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server is missing OPENROUTER_API_KEY.' }));
    return;
  }

  try {
    const { title = '', body = '', model } = await readBody(req);

    if (!String(title).trim() && !String(body).trim()) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Add a title or body first.' }));
      return;
    }

    const or = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'HTTP-Referer': 'https://joinupshift.com',
        'X-Title': 'Upshift Creator Tools',
      },
      body: JSON.stringify({
        model: String(model || '').trim() || DEFAULT_MODEL,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildRewritePrompt(title, body) }],
      }),
    });

    const data = await or.json().catch(() => null);
    if (!or.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: `OpenRouter ${or.status}: ${data?.error?.message || or.statusText}` }));
      return;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'OpenRouter returned no content.' }));
      return;
    }

    const out = extractJson(content);
    res.statusCode = 200;
    res.end(JSON.stringify({ title: String(out.title || ''), body: String(out.body || '') }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
  }
};
