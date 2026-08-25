// api/rekomendasi/[slug].js
//
// Halaman etalase — dibaca lewat rewrite di vercel.json dari
// /rekomendasi/:slug ke sini. Ambil konten dari Supabase, render HTML.

const { getSupabase } = require('../../lib/supabaseClient');

module.exports = async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.status(400).send('Missing slug');

  try {
    const supabase = getSupabase();
    const { data: page, error } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;

    if (!page) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(renderNotFoundHtml());
    }

    // Catat impression secara best-effort — jangan sampai gagalkan request
    // kalau update ini error (misal race condition kecil, gak masalah).
    supabase
      .from('seo_pages')
      .update({ impressions: (page.impressions || 0) + 1 })
      .eq('slug', slug)
      .then(
        () => {},
        () => {}
      );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res.status(200).send(renderPageHtml(page));
  } catch (err) {
    console.error('[rekomendasi/:slug] error:', err);
    res.status(500);
    return res.send('Internal server error');
  }
};

function renderPageHtml(page) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (page.faq || []).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  // BreadcrumbList — bantu Google/AI ngerti halaman ini "di bawah" apa,
  // bagian dari Agent 4 (AI-answer-engine visibility). Cuma 2 level,
  // sesuai struktur situs asli (nggak ada halaman listing kategori nyata).
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'randomly.id', item: 'https://randomly.id/' },
      { '@type': 'ListItem', position: 2, name: page.title, item: `https://randomly.id/rekomendasi/${page.slug}` },
    ],
  };

  const criteriaHtml = (page.criteria || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('\n');

  const faqHtml = (page.faq || [])
    .map((f) => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.title)} | randomly.id</title>
<meta name="description" content="${escapeHtml(page.meta_description)}">
<link rel="canonical" href="https://randomly.id/rekomendasi/${page.slug}">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(page.meta_description)}">
<meta property="og:type" content="website">
<link rel="icon" href="/icon-192.png">
<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
<style>
  body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #0D0D0D; }
  h1 { font-size: 26px; margin-bottom: 8px; }
  h2 { font-size: 19px; margin-top: 32px; }
  .intro { font-size: 16px; color: #333; margin-bottom: 8px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; }
  .cta { display: block; text-align: center; background: #FFD60A; color: #0D0D0D; border: 2px solid #0D0D0D; border-radius: 16px; padding: 16px; font-weight: 700; text-decoration: none; margin: 28px 0; }
  .faq-item { margin-bottom: 16px; }
  .faq-item h3 { font-size: 16px; margin-bottom: 4px; }
  .faq-item p { font-size: 14px; color: #444; margin: 0; }
  footer { margin-top: 40px; font-size: 13px; color: #888; text-align: center; }
  footer a { color: #888; }
</style>
</head>
<body>
<h1>${escapeHtml(page.title)}</h1>
<p class="intro">${escapeHtml(page.intro)}</p>
<h2>Kriteria buat mutusin</h2>
<ul>${criteriaHtml}</ul>
<a class="cta" href="/?category=${encodeURIComponent(page.category)}">🎲 Coba langsung — biar randomly.id yang mutusin buat kamu</a>
<h2>Pertanyaan umum</h2>
${faqHtml}
<footer>randomly.id — lagi random? randomly aja. · <a href="/privacy.html">Privacy</a></footer>
</body>
</html>`;
}

function renderNotFoundHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Halaman tidak ditemukan | randomly.id</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;">
<h1>Halaman tidak ditemukan</h1>
<p>Coba <a href="/">kembali ke randomly.id</a>.</p>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
