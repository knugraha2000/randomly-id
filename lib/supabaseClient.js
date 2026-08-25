// lib/supabaseClient.js
// Client Supabase pakai service_role key — HANYA dipakai di server (api/*),
// jangan pernah di-expose ke browser.

const { createClient } = require('@supabase/supabase-js');

let client;

function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'Supabase belum dikonfigurasi. Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Environment Variables Vercel.'
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

module.exports = { getSupabase };
