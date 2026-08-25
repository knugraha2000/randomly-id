// api/cron/generate-social-post.js
//
// Ini "Agent 2" — bagian generate konten (belum termasuk posting beneran,
// itu nyusul setelah akun Instagram/TikTok siap). Dipanggil otomatis oleh
// Vercel Cron (lihat vercel.json), generate 1 konten (quiz atau fun fact
// secara acak), simpan ke Supabase sebagai draft.

const { getSupabase } = require('../../lib/supabaseClient');
const { generateQuiz, generateFunFact } = require('../../lib/socialContent');
const { publishToInstagram } = require('../../lib/instagramPublish');

module.exports.config = { maxDuration: 10 }; // batas Hobby plan

module.exports = async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabase();
    const type = Math.random() < 0.5 ? 'quiz' : 'funfact';
    const { topic, payload } = type === 'quiz' ? await generateQuiz() : await generateFunFact();

    const { data, error } = await supabase
      .from('social_posts')
      .insert({ type, topic, payload, status: 'draft' })
      .select('*')
      .single();

    if (error) throw error;

    const result = {
      generated: 1,
      id: data.id,
      type,
      topic,
      preview_url: `https://randomly.id/api/social/${data.id}`,
    };

    // Coba publish ke Instagram. Kalau env var belum diset atau gagal
    // (misal rate limit, token expired), draft-nya TETAP tersimpan —
    // cron ini nggak boleh crash gara-gara publish gagal.
    try {
      const published = await publishToInstagram(data);
      await supabase
        .from('social_posts')
        .update({ status: 'posted', platform: 'instagram', posted_at: new Date().toISOString() })
        .eq('id', data.id);
      result.instagram = { posted: true, mediaId: published.mediaId };
    } catch (publishErr) {
      console.error('[generate-social-post] publish ke Instagram gagal:', publishErr.message);
      result.instagram = { posted: false, error: publishErr.message };
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[generate-social-post] error:', error);
    return res.status(500).json({ error: error.message });
  }
};
