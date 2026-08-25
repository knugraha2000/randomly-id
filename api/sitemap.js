// api/sitemap.js
// Sitemap dinamis — otomatis nambah tiap ada halaman SEO baru yang published.
// Diakses lewat rewrite /sitemap.xml -> /api/sitemap (lihat vercel.json).

const { getSupabase } = require('../lib/supabaseClient');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const { data: pages, error } = await supabase
      .from('seo_pages')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (error) throw error;

    const staticUrls = [
      { loc: 'https://randomly.id/', priority: '1.0', changefreq: 'weekly' },
      { loc: 'https://randomly.id/privacy.html', priority: '0.5', changefreq: 'monthly' },
    ];

    const dynamicUrls = (pages || []).map((p) => ({
      loc: `https://randomly.id/rekomendasi/${p.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: p.updated_at ? p.updated_at.split('T')[0] : undefined,
    }));

    const all = [...staticUrls, ...dynamicUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('[sitemap] error:', err);
    res.status(500).send('Internal server error');
  }
};
