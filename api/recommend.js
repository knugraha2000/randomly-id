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

    // ── ENGINE SELECTION ──
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let selectedEngine = engine || 'gemini';

    if (selectedEngine === 'random') {
      if (claudeKey && geminiKey) {
        selectedEngine = Math.random() < 0.5 ? 'claude' : 'gemini';
      } else if (geminiKey) {
        selectedEngine = 'gemini';
      } else {
        selectedEngine = 'claude';
      }
    }

    if (selectedEngine === 'gemini' && !geminiKey) selectedEngine = 'claude';
    if (selectedEngine === 'claude' && !claudeKey) selectedEngine = 'gemini';

    const prompt = messages?.[messages.length - 1]?.content || '';

    // ── GEMINI ──
    async function callGemini() {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: max_tokens || 600, temperature: 0.9 },
          systemInstruction: {
            parts: [{ text: 'You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation. Just raw JSON.' }]
          }
        })
      });
      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) throw { status: geminiRes.status, data: geminiData };
      let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      return { content: [{ type: 'text', text }], engine_used: 'gemini' };
    }

    // ── CLAUDE ──
    async function callClaude() {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: max_tokens || 600,
          system: 'You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation. Just raw JSON.',
          messages: messages
        })
      });
      const claudeData = await claudeRes.json();
      if (!claudeRes.ok) throw { status: claudeRes.status, data: claudeData };
      return { ...claudeData, engine_used: 'claude' };
    }

    // ── CALL WITH AUTO-FALLBACK ──
    try {
      if (selectedEngine === 'gemini') {
        const result = await callGemini();
        return res.status(200).json(result);
      } else {
        const result = await callClaude();
        return res.status(200).json(result);
      }
    } catch (primaryErr) {
      // Auto-fallback: kalau Gemini 429/500, coba Claude — dan sebaliknya
      console.error('Primary engine failed:', primaryErr?.status, JSON.stringify(primaryErr?.data));
      try {
        if (selectedEngine === 'gemini' && claudeKey) {
          const result = await callClaude();
          return res.status(200).json(result);
        } else if (selectedEngine === 'claude' && geminiKey) {
          const result = await callGemini();
          return res.status(200).json(result);
        }
        throw primaryErr;
      } catch (fallbackErr) {
        console.error('Fallback engine also failed:', fallbackErr?.status);
        return res.status(primaryErr?.status || 500).json({ error: primaryErr?.data || 'Both engines failed' });
      }
    }

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};
