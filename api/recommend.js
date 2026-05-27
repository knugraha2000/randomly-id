export default async function handler(req, res) {
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
      } catch(e) {
        return res.status(200).json({ poster_url: null });
      }
    }

    // ── ENGINE SELECTION ──
    // 'claude' | 'gemini' | 'random'
    // Default: random (50/50 Claude vs Gemini) kalau kedua key tersedia
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let selectedEngine = engine || 'gemini';

    // Auto random kalau ada kedua key
    if (selectedEngine === 'random') {
      if (claudeKey && geminiKey) {
        selectedEngine = Math.random() < 0.5 ? 'claude' : 'gemini';
      } else if (geminiKey) {
        selectedEngine = 'gemini';
      } else {
        selectedEngine = 'claude';
      }
    }

    // Fallback ke claude kalau gemini key tidak ada
    if (selectedEngine === 'gemini' && !geminiKey) selectedEngine = 'claude';
    // Fallback ke gemini kalau claude key tidak ada
    if (selectedEngine === 'claude' && !claudeKey) selectedEngine = 'gemini';

    const prompt = messages?.[messages.length - 1]?.content || '';

    // ── GEMINI ──
    if (selectedEngine === 'gemini') {
      const geminiModel = 'gemini-2.0-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

      const geminiBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: max_tokens || 600,
          temperature: 0.9,
        },
        systemInstruction: {
          parts: [{ text: 'You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation. Just raw JSON.' }]
        }
      };

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      });

      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) return res.status(geminiRes.status).json({ error: geminiData });

      // Normalize ke format Claude supaya frontend tidak perlu ubah
      let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Strip markdown backticks yang sering ditambah Gemini
      text = text.replace(/```json
?/gi, '').replace(/```
?/gi, '').trim();
      return res.status(200).json({
        content: [{ type: 'text', text }],
        engine_used: 'gemini'
      });
    }

    // ── CLAUDE ──
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
    if (!claudeRes.ok) return res.status(claudeRes.status).json({ error: claudeData });

    return res.status(200).json({ ...claudeData, engine_used: 'claude' });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
