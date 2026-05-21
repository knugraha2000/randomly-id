// ============================================
// content.js — Semua teks statis randomly.id
// Edit file ini untuk mengubah teks tanpa
// harus sentuh index.html
// ============================================

const CONTENT = {

  // ── HEADER & TAGLINE ──
  logo: 'randomly',
  logo_tld: '.id',
  tagline: 'Lagi random? Randomly aja.',

  // ── HERO ──
  hero_default: 'Lagi gabut?\nBiar kita putusin! 🎲',
  hero_sub_default: 'Pilih kategori, jawab 2 hal, langsung dapat rekomendasi.',
  hero_pagi: 'Pagi-pagi udah gabut? 😄',
  hero_pagi_sub: 'Sarapan dulu yuk, biar semangat!',
  hero_siang: 'Belum tau makan siang apa? 🍽️',
  hero_siang_sub: 'Biar kita yang putusin, kamu tinggal makan!',
  hero_sore: 'Sore-sore gabut? ☕',
  hero_sore_sub: 'Mau nonton, baca, atau ngemil? Yuk diputusin!',
  hero_malam: 'malam, mau ngapain? 🌙',
  hero_malam_sub: 'Makan malam atau nonton? Kita bantu putusin!',
  hero_tengahmalam: 'Masih melek tengah malam? 🦉',
  hero_tengahmalam_sub: 'Mau baca atau nonton apa? Kita suggest!',

  // ── KATEGORI ──
  cat_label: 'Mau dibantu putusin apa?',
  cats: {
    makan:  { icon: '🍜', label: 'Makan' },
    kado:   { icon: '🎁', label: 'Kado' },
    gebetan:{ icon: '💖', label: 'Cinta' },
    masak:  { icon: '🍳', label: 'Masak' },
    jalan:  { icon: '🚶', label: 'Jalan' },
    nonton: { icon: '🎬', label: 'Nonton' },
    baca:   { icon: '📚', label: 'Baca' },
    nulis:  { icon: '✍️', label: 'Nulis' },
  },

  // ── TOMBOL AKSI ──
  btn_rekomendasi: 'Rekomendasi →',
  btn_gabut: '🎲 Gabut Mode — acak semua!',
  btn_funfact: '🎲 Randomin Fun Fact Dong!',
  btn_ganti: '🔄 Gak cocok? Ganti!',
  btn_kategori_lain: '↩️ Coba kategori lain',
  btn_funfact_lain: '🔄 Fun Fact lain!',
  btn_kembali: '↩️ Kembali',

  // ── FILTER LABEL ──
  filter_toggle: '+ lebih spesifik',
  filter_toggle_close: '- lebih spesifik',

  // ── RESULT LABELS ──
  cat_labels: {
    makan:   'REKOMENDASI MAKAN',
    kado:    'REKOMENDASI KADO',
    gebetan: 'KEPUTUSAN CINTA',
    masak:   'MASAK APA HARI INI',
    jalan:   'REKOMENDASI JALAN',
    nonton:  'REKOMENDASI TONTONAN',
    baca:    'REKOMENDASI BACAAN',
    nulis:   'INSPIRASI NULIS',
    funfact: 'FUN FACT RANDOM',
  },

  // ── SHARE ──
  share_label: 'Share & dapat token gratis 👇',
  share_wa: 'WhatsApp',
  share_ig: 'Instagram',
  share_copy: 'Salin',
  share_footer: 'randomly.id — lagi random? randomly aja.',
  share_gebetan_header: '💘 KEPUTUSAN CINTA',
  share_gebetan_footer: 'randomly.id udah mutusin buat kamu 😄',

  // ── LOADING ──
  loading_msgs: [
    'Lagi mikir nih... 🤔',
    'Konsultasi sama hati nurani...',
    'Hampir jadi, sabar...',
    'Ini penting, jangan buru-buru... 😄'
  ],
  loading_funfact: 'Lagi korek-korek fakta unik...',

  // ── ERROR ──
  error_msg: 'Aduh, lagi error nih!',
  error_sub: 'API key belum dipasang atau ada masalah koneksi.',

  // ── PAYWALL ──
  paywall_soft_emoji: '🎟️',
  paywall_soft_title: '5 rekomendasi gratis habis!',
  paywall_soft_sub: 'Traktir kopi, atau earn token gratis dengan share! 😄',
  paywall_hard_emoji: '🙏',
  paywall_hard_title: '10 rekomendasi gratis habis!',
  paywall_hard_sub: 'Traktir dulu ya, atau tunggu 1 jam untuk lanjut gratis. Tetap sayang! 💛',
  paywall_saweria_url: 'https://saweria.co/randomlyid',
  paywall_btn_kopi: '☕ Traktir Kopi — Rp5.000',
  paywall_btn_wa: 'Share ke WA (+2 token)',
  paywall_btn_ig: 'Share ke IG Story (+3 token)',
  paywall_btn_skip: 'Nanti aja, lanjut 5 lagi dulu',
  paywall_unlock_1: '☕ Rp5.000 — Unlock 1 jam',
  paywall_unlock_3: '🍜 Rp10.000 — Unlock 3 jam',
  cooldown_title: 'Cooldown dulu ya 😅',
  cooldown_sub: 'Atau traktir kopi biar langsung bisa lanjut!',
  cooldown_reset_emoji: '🎉',
  cooldown_reset_title: 'Bisa lagi nih!',
  cooldown_reset_sub: '5 rekomendasi gratis sudah reset. Yuk lanjut!',
  cooldown_reset_btn: 'Lanjut! 🚀',

  // ── TOKEN ──
  token_label: 'Token kamu',
  token_sub: '1 token = 1 rekomendasi gratis',
  token_wa_reward: '+2 token didapat!',
  token_ig_reward: '+3 token didapat!',
  token_copy_reward: '+1 token didapat!',
  token_like_reward: 'Makasih! +1 token gratis!',

  // ── AD PLACEHOLDERS ──
  ad_label: 'Iklan',
  ad_text: 'Iklan — Google AdSense',

  // ── FOOTER ──
  footer_privacy: 'Privacy Policy',
  footer_copy: 'randomly.id — lagi random? randomly aja.',

  // ── TOAST ──
  toast_copied: '✓ Teks disalin!',
  toast_ig_copied: '✓ Disalin! Paste di Instagram 📸',
  toast_img_download: 'Gambar didownload! Upload ke IG Story kamu.',

  // ── FUN FACT ──
  funfact_topics: ['sains','sejarah Indonesia','psikologi manusia','makanan & kuliner','teknologi','alam & hewan','tubuh manusia','budaya dunia'],
};
