// api/cron/generate-social-post.js
//
// Ini "Agent 2" bagian generate — bikin 1 konten (quiz/fun fact) & simpan
// sebagai draft. Publish-nya dipisah ke api/cron/publish-social-post.js
// (jalan beberapa menit setelah ini) karena Instagram butuh waktu proses
// container sebelum bisa di-publish, dan itu butuh budget waktu sendiri.

const { getSupabase } = require('../../lib/supabaseClient');
const { generateQuiz, generateFunFact } = require('../../lib/socialContent');

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
      .select('id')
      .single();

    if (error) throw error;

    return res.status(200).json({
      generated: 1,
      id: data.id,
      type,
      topic,
      preview_url: `https://randomly.id/api/social/${data.id}`,
    });
  } catch (error) {
    console.error('[generate-social-post] error:', error);
    return res.status(500).json({ error: error.message });
  }
};
