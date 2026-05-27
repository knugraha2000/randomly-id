module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, max_tokens, fetch_poster, film_title } = req.body;

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

    // ── CLAUDE ONLY ──
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    if (!claudeKey) return res.status(500).json({ error: 'API key not configured' });

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
};
