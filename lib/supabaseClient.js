// lib/supabaseClient.js
// Client Supabase pakai service_role key — HANYA dipakai di server (api/*),
// jangan pernah di-expose ke browser.

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

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
    // Node 20 di Vercel belum punya native WebSocket — kita kasih polyfill
    // "ws" supaya realtime client di supabase-js nggak error saat init,
    // walaupun kita nggak pakai fitur realtime-nya sama sekali di sini.
    client = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { transport: ws },
    });
  }
  return client;
}

module.exports = { getSupabase };
