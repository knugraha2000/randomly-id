module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, max_tokens, fetch_poster, film_title, engine } = req.body;

    // ── TMDB POSTER FETCH ──
    if (fetch_poster && film_title) {
      const tmdbKey = process.env.TMDB_API_KEY;
      if (!tmdbKey) return res.status(200).json({ poster_url: null });
      try {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(film_title)}&api_key=${tmdbKey}&language=id-ID`
        );
        const tmdbData = await tmdbRes.json();
        const movie = tmdbData.results?.[0];
        const posterUrl = movie?.poster_path
          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
          : null;
        return res.status(200).json({ poster_url: posterUrl });
      } catch (e) {
        return res.status(200).json({ poster_url: null });
      }
    }

    // ── KEYS ──
    const claudeKey  = process.env.ANTHROPIC_API_KEY;
    const geminiKey  = process.env.GEMINI_API_KEY;
    const openaiKey  = process.env.OPENAI_API_KEY;

    // Tentukan engine: explicit | random | fallback
    let selected = (engine || 'openai').toLowerCase();

    if (selected === 'random') {
      const available = [];
      if (claudeKey)  available.push('claude');
      if (openaiKey)  available.push('openai');
      if (geminiKey)  available.push('gemini');
      if (!available.length) return res.status(500).json({ error: 'No API keys configured' });
      selected = available[Math.floor(Math.random() * available.length)];
    }

    // Fallback chain kalau key tidak ada
    if (selected === 'claude'  && !claudeKey)  selected = openaiKey  ? 'openai'  : 'gemini';
    if (selected === 'openai'  && !openaiKey)  selected = claudeKey  ? 'claude'  : 'gemini';
    if (selected === 'gemini'  && !geminiKey)  selected = claudeKey  ? 'claude'  : 'openai';

    const prompt = messages?.[messages.length - 1]?.content || '';
    const maxTok  = max_tokens || 600;
    const systemMsg = 'You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation. Just raw JSON.';

    // ── CLAUDE ──
    async function callClaude() {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTok,
          system: systemMsg,
          messages
        })
      });
      const d = await r.json();
      if (!r.ok) throw { status: r.status, data: d };
      return { ...d, engine_used: 'claude' };
    }

    // ── OPENAI ──
    async function callOpenAI() {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: maxTok,
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: prompt }
          ]
        })
      });
      const d = await r.json();
      if (!r.ok) throw { status: r.status, data: d };
      // Normalize ke format Claude
      const text = d.choices?.[0]?.message?.content || '';
      return { content: [{ type: 'text', text }], engine_used: 'openai' };
    }

    // ── GEMINI ──
    async function callGemini() {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTok, temperature: 0.9 },
          systemInstruction: { parts: [{ text: systemMsg }] }
        })
      });
      const d = await r.json();
      if (!r.ok) throw { status: r.status, data: d };
      let text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      return { content: [{ type: 'text', text }], engine_used: 'gemini' };
    }

    // ── CALL + AUTO FALLBACK ──
    const callers = { claude: callClaude, openai: callOpenAI, gemini: callGemini };
    const order = [selected, ...['claude','openai','gemini'].filter(e => e !== selected && process.env[
      e === 'claude' ? 'ANTHROPIC_API_KEY' : e === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'
    ])];

    let lastErr;
    for (const eng of order) {
      if (!callers[eng]) continue;
      try {
        const result = await callers[eng]();
        return res.status(200).json(result);
      } catch (err) {
        console.error(`[recommend] ${eng} failed:`, err?.status, JSON.stringify(err?.data)?.slice(0, 200));
        lastErr = err;
      }
    }

    return res.status(lastErr?.status || 500).json({ error: 'All engines failed', detail: lastErr?.data });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};
