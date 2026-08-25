// api/cron/generate-seo-pages.js
//
// Ini "Agent 1" — dipanggil otomatis oleh Vercel Cron (lihat vercel.json).
// Tugasnya: cari kombinasi kategori × lokasi × modifier yang belum punya
// halaman, generate konten via Claude, simpan ke Supabase.
//
// PENTING soal konten yang digenerate: karena randomly.id belum punya
// database restoran/toko/lokasi yang nyata, prompt di bawah SENGAJA
// melarang Claude menyebut nama bisnis spesifik. Halaman ini adalah
// panduan kriteria (evergreen guide), bukan direktori bisnis — supaya
// tidak ada risiko halusinasi nama tempat yang salah/tidak ada.

const { getSupabase } = require('../../lib/supabaseClient');
const { generateCandidates } = require('../../lib/combos');

// Mulai kecil: 5 halaman baru/hari. Naikin pelan-pelan setelah lihat
// beberapa batch pertama ke-index dengan baik di Search Console.
const BATCH_SIZE = 5;

module.exports = async function handler(req, res) {
  // Vercel Cron otomatis kirim header Authorization: Bearer <CRON_SECRET>.
  // Kalau CRON_SECRET di-set di env vars, kita verifikasi supaya endpoint
  // ini nggak bisa dipicu sembarang orang dari luar.
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabase();
    const candidates = generateCandidates();

    const { data: existing, error: fetchErr } = await supabase
      .from('seo_pages')
      .select('slug');
    if (fetchErr) throw fetchErr;

    const existingSlugs = new Set((existing || []).map((r) => r.slug));
    const toGenerate = candidates.filter((c) => !existingSlugs.has(c.slug)).slice(0, BATCH_SIZE);

    if (toGenerate.length === 0) {
      return res.status(200).json({ message: 'Semua kombinasi yang ada sudah ter-generate.', generated: 0 });
    }

    const results = [];
    for (const combo of toGenerate) {
      try {
        const page = await generatePageContent(combo);
        const { error: insertErr } = await supabase.from('seo_pages').insert({
          slug: combo.slug,
          category: combo.category,
          location: combo.location,
          modifier: combo.modifier,
          title: page.title,
          meta_description: page.meta_description,
          intro: page.intro,
          criteria: page.criteria,
          faq: page.faq,
          status: 'published',
        });
        if (insertErr) throw insertErr;
        results.push({ slug: combo.slug, status: 'ok' });
      } catch (err) {
        console.error(`[generate-seo-pages] gagal generate ${combo.slug}:`, err.message);
        results.push({ slug: combo.slug, status: 'error', message: err.message });
      }
    }

    return res.status(200).json({
      generated: results.filter((r) => r.status === 'ok').length,
      results,
    });
  } catch (error) {
    console.error('[generate-seo-pages] error:', error);
    return res.status(500).json({ error: error.message });
  }
};

async function generatePageContent(combo) {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) throw new Error('ANTHROPIC_API_KEY belum diset');

  const locationText = combo.location ? ` di ${combo.location}` : '';
  const userPrompt = `Kamu menulis konten halaman landing SEO untuk randomly.id, web app yang membantu orang Indonesia memutuskan hal sehari-hari secara random/cepat — BUKAN direktori bisnis atau restoran.

Topik halaman: panduan "${combo.category}" dengan tema "${combo.modifier}"${locationText}.

ATURAN KETAT: JANGAN sebut nama restoran, kafe, toko, atau bisnis spesifik apapun yang seolah nyata — kita tidak punya data lokasi real-time dan itu bisa salah/menyesatkan. Fokus ke KRITERIA dan cara memutuskan, bukan daftar tempat.

Balas HANYA dengan JSON valid, persis format ini, tanpa markdown/backticks:
{
  "title": "judul halaman, maksimal 60 karakter, mengandung kata kunci utama topik ini",
  "meta_description": "meta description maksimal 155 karakter",
  "intro": "1-2 paragraf pembuka bergaya santai khas randomly.id, menjelaskan kenapa topik ini bikin bingung mutusin",
  "criteria": ["4 sampai 6 poin kriteria/tips singkat buat mutusin, tiap poin cukup 1 kalimat"],
  "faq": [{"q": "pertanyaan singkat terkait topik", "a": "jawaban 1-2 kalimat"}]
}
Buat tepat 3 item di "faq".`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: 'Kamu adalah copywriter SEO Bahasa Indonesia. Selalu balas HANYA dengan JSON valid, tanpa markdown, tanpa backticks, tanpa penjelasan tambahan.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(`Claude API error: ${JSON.stringify(data).slice(0, 300)}`);

  const raw = data.content?.[0]?.text || '';
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gagal parse JSON dari Claude: ${cleaned.slice(0, 200)}`);
  }

  if (!parsed.title || !parsed.meta_description || !parsed.intro || !Array.isArray(parsed.criteria)) {
    throw new Error('Response Claude tidak lengkap/format salah.');
  }
  return parsed;
}
