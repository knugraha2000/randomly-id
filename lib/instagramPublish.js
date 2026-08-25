// lib/instagramPublish.js
//
// Publish 1 post ke Instagram lewat Graph API. Alur resminya 2 langkah:
// 1. POST /{ig-user-id}/media  -> bikin "container" (kirim image_url + caption)
// 2. POST /{ig-user-id}/media_publish -> publish container itu jadi post asli
//
// Instagram fetch gambar dari image_url SECARA LANGSUNG pas langkah 1, jadi
// endpoint /api/social/:id/image harus publik & udah bisa diakses saat ini
// dipanggil (bukan masalah buat kita karena di-generate on-demand dari data
// yang udah tersimpan di Supabase).

const GRAPH_VERSION = 'v21.0';

function buildCaption(post) {
  const p = post.payload || {};
  const hashtags = '#randomlyid #kuisrandom #funfact #triviaindonesia';

  if (post.type === 'quiz') {
    return `${p.question || ''}\n\n${(p.choices || []).join('\n')}\n\nJawaban: ${p.answer || '?'} — ${p.explanation || ''}\n\n${hashtags}`;
  }
  return `${p.nama || ''}\n\n${p.alasan || ''}\n\n${hashtags}`;
}

async function publishToInstagram(post) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !igUserId) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID belum diset');
  }

  const imageUrl = `https://randomly.id/api/social/${post.id}/image`;
  const caption = buildCaption(post);

  // Langkah 1 — bikin media container
  const createRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media?` +
      new URLSearchParams({ image_url: imageUrl, caption, access_token: token }).toString(),
    { method: 'POST' }
  );
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Gagal bikin media container: ${JSON.stringify(createData).slice(0, 300)}`);
  }
  const creationId = createData.id;

  // Langkah 2 — publish container-nya
  const publishRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media_publish?` +
      new URLSearchParams({ creation_id: creationId, access_token: token }).toString(),
    { method: 'POST' }
  );
  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(`Gagal publish: ${JSON.stringify(publishData).slice(0, 300)}`);
  }

  return { mediaId: publishData.id, imageUrl, caption };
}

module.exports = { publishToInstagram, buildCaption };
