// api/cron/publish-social-post.js
//
// Dipisah dari generate-social-post.js karena publish ke Instagram butuh
// nunggu (polling status container) — proses itu perlu budget waktu
// sendiri, terpisah dari waktu generate teks via Claude.
//
// Ambil draft TERTUA yang belum di-publish, coba publish. Kalau nggak
// ada draft, ya diem aja (nggak error) — itu normal kalau semua udah
// ke-publish atau belum ada yang di-generate hari itu.

const { getSupabase } = require('../../lib/supabaseClient');
const { publishToInstagram } = require('../../lib/instagramPublish');

module.exports.config = { maxDuration: 10 }; // batas Hobby plan

module.exports = async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabase();
    const { data: draft, error: fetchErr } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!draft) {
      return res.status(200).json({ message: 'Tidak ada draft yang menunggu di-publish.', posted: false });
    }

    try {
      const published = await publishToInstagram(draft);
      await supabase
        .from('social_posts')
        .update({ status: 'posted', platform: 'instagram', posted_at: new Date().toISOString() })
        .eq('id', draft.id);
      return res.status(200).json({ posted: true, id: draft.id, mediaId: published.mediaId });
    } catch (publishErr) {
      console.error('[publish-social-post] gagal publish:', publishErr.message);
      // Draft TETAP status 'draft' — akan dicoba lagi di run berikutnya.
      return res.status(200).json({ posted: false, id: draft.id, error: publishErr.message });
    }
  } catch (error) {
    console.error('[publish-social-post] error:', error);
    return res.status(500).json({ error: error.message });
  }
};
