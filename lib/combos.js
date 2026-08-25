// lib/combos.js
// Daftar kombinasi kategori × lokasi × modifier buat Agent 1 (programmatic SEO).
// Ini file yang paling gampang di-edit buat nambah/kurangin jangkauan —
// nggak perlu sentuh logic lain.

// Kategori yang kombinasinya masuk akal digabung dengan lokasi.
// Sengaja TIDAK termasuk kategori yang butuh data bisnis nyata (misal: tempat
// makan/toko spesifik) karena kita belum punya database lokasi real —
// lihat catatan di api/cron/generate-seo-pages.js.
const CATEGORIES_WITH_LOCATION = ['makan', 'jalan'];

const LOCATIONS = [
  'Jakarta', 'Bandung', 'Bali', 'Jogja', 'Surabaya',
  'Bekasi', 'Depok', 'Tangerang', 'Medan', 'Semarang',
];

const MODIFIERS = {
  makan: ['halal murah', 'halal enak', 'buat rombongan', 'buat healing sendirian'],
  jalan: ['budget pelajar', 'weekend santai', 'buat pasangan', 'gratisan'],
  kado: ['ulang tahun pacar budget 100rb', 'wisuda', 'ibu budget 50rb', 'anniversary'],
  gebetan: ['gerak pertama', 'PDKT', 'move on', 'ldr'],
  masak: ['bahan seadanya', 'anak kos', 'buat diet', 'praktis 15 menit'],
  nonton: ['malam minggu', 'lagi sedih', 'nemenin healing', 'yang bikin mikir'],
  baca: ['buat pemula', 'ringan sebelum tidur', 'yang bikin nangis', 'motivasi'],
  nulis: ['diary harian', 'caption ig', 'puisi galau', 'ide konten'],
};

function slugify(...parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Menghasilkan SEMUA kombinasi yang mungkin. Cron job yang memutuskan
// berapa banyak yang benar-benar di-generate per hari (lihat BATCH_SIZE).
function generateCandidates() {
  const out = [];
  for (const [category, mods] of Object.entries(MODIFIERS)) {
    const hasLocation = CATEGORIES_WITH_LOCATION.includes(category);
    for (const modifier of mods) {
      if (hasLocation) {
        for (const location of LOCATIONS) {
          out.push({
            category,
            modifier,
            location,
            slug: slugify('rekomendasi', category, modifier, 'di', location),
          });
        }
      } else {
        out.push({
          category,
          modifier,
          location: null,
          slug: slugify('rekomendasi', category, modifier),
        });
      }
    }
  }
  return out;
}

module.exports = { generateCandidates, CATEGORIES_WITH_LOCATION, LOCATIONS, MODIFIERS, slugify };
