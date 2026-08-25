// api/social/[id]/image.js
//
// Endpoint publik yang menghasilkan PNG kartu quiz/fun fact. Instagram API
// butuh URL gambar publik pas bikin media container, dan endpoint inilah
// yang dipanggil (lihat lib/instagramPublish.js).

const { getSupabase } = require('../../../lib/supabaseClient');
const { renderCardImage } = require('../../../lib/renderCardImage');

module.exports.config = { maxDuration: 10 };

module.exports = async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing id');

  try {
    const supabase = getSupabase();
    const { data: post, error } = await supabase.from('social_posts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!post) return res.status(404).send('Not found');

    const png = await renderCardImage(post);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(png);
  } catch (err) {
    console.error('[social/:id/image] error:', err);
    return res.status(500).send('Internal server error');
  }
};
