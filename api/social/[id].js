// api/social/[id].js
//
// Halaman preview buat draft konten Agent 2 (belum di-posting otomatis,
// ini cuma buat lihat/cek kualitas hasil generate sebelum ada integrasi
// posting beneran ke Instagram/TikTok).

const { getSupabase } = require('../../lib/supabaseClient');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing id');

  try {
    const supabase = getSupabase();
    const { data: post, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!post) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send('<h1>Draft tidak ditemukan</h1>');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderCardHtml(post));
  } catch (err) {
    console.error('[social/:id] error:', err);
    res.status(500);
    return res.send('Internal server error');
  }
};

function renderCardHtml(post) {
  const body = post.type === 'quiz' ? renderQuizCard(post.payload) : renderFunFactCard(post.payload);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Draft #${post.id} (${escapeHtml(post.type)}) — randomly.id</title>
<meta name="robots" content="noindex">
<style>
  body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background: #F5F0E6; margin: 0; padding: 24px; display: flex; flex-direction: column; align-items: center; }
  .meta { font-size: 13px; color: #777; margin-bottom: 16px; }
  .card { width: 100%; max-width: 420px; background: #FFD60A; border: 3px solid #0D0D0D; border-radius: 24px; padding: 28px; box-sizing: border-box; }
  .emoji { font-size: 40px; margin-bottom: 12px; }
  .title { font-size: 22px; font-weight: 800; color: #0D0D0D; margin-bottom: 12px; line-height: 1.3; }
  .body-text { font-size: 16px; color: #0D0D0D; line-height: 1.5; }
  .choices { list-style: none; padding: 0; margin: 16px 0 0; }
  .choices li { background: #fff; border: 2px solid #0D0D0D; border-radius: 12px; padding: 10px 14px; margin-bottom: 8px; font-size: 15px; }
  .choices li.correct { background: #C8F7C5; }
  .explanation { margin-top: 16px; font-size: 14px; color: #333; background: rgba(255,255,255,0.5); border-radius: 12px; padding: 12px; }
  .tags { margin-top: 12px; font-size: 13px; color: #555; }
  footer { margin-top: 20px; font-size: 13px; color: #999; }
</style>
</head>
<body>
<div class="meta">Draft #${post.id} · ${escapeHtml(post.type)} · topik: ${escapeHtml(post.topic)} · status: ${escapeHtml(post.status)}</div>
<img src="/api/social/${post.id}/image" alt="Kartu ${escapeHtml(post.type)}" style="width:100%;max-width:420px;border-radius:24px;border:3px solid #0D0D0D;margin-bottom:20px;">
<div class="card">${body}</div>
<footer>randomly.id — preview internal, belum di-posting otomatis</footer>
</body>
</html>`;
}

function renderQuizCard(p) {
  const choicesHtml = (p.choices || [])
    .map((c) => `<li class="${c.startsWith(p.answer) ? 'correct' : ''}">${escapeHtml(c)}</li>`)
    .join('\n');
  return `
    <div class="title">🧠 ${escapeHtml(p.question || '')}</div>
    <ul class="choices">${choicesHtml}</ul>
    <div class="explanation"><strong>Jawaban: ${escapeHtml(p.answer || '')}</strong><br>${escapeHtml(p.explanation || '')}</div>
  `;
}

function renderFunFactCard(p) {
  const tagsHtml = (p.tags || []).map((t) => `#${escapeHtml(t)}`).join(' ');
  return `
    <div class="emoji">${escapeHtml(p.emoji || '✨')}</div>
    <div class="title">${escapeHtml(p.nama || '')}</div>
    <div class="body-text">${escapeHtml(p.alasan || '')}</div>
    <div class="tags">${tagsHtml}</div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
