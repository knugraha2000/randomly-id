# Setup Agent 1 (Programmatic SEO) — langkah yang cuma bisa kamu lakukan

Semua kode udah jadi. Ini bagian yang butuh akses akun kamu, jadi aku nggak
bisa lakuin otomatis.

## 1. Bikin project Supabase (gratis, ~2 menit)
1. Buka https://supabase.com → New project.
2. Setelah project jadi, buka **SQL Editor** → New query.
3. Copy-paste isi file `sql/seo_pages.sql` di repo ini → Run.
4. Buka **Settings → API** → catat dua nilai ini:
   - `Project URL` → nanti jadi `SUPABASE_URL`
   - `service_role` key (bukan `anon` key!) → nanti jadi `SUPABASE_SERVICE_ROLE_KEY`

`service_role` key itu bypass semua permission — **jangan pernah** taruh di
kode frontend/browser. Di setup ini dia cuma dipakai di `api/*` (server-side),
itu sudah aman.

## 2. Tambah Environment Variables di Vercel
Di dashboard project randomly.id di Vercel → **Settings → Environment Variables**,
tambahin (untuk Production dan Preview):

| Key | Value |
|---|---|
| `SUPABASE_URL` | dari langkah 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | dari langkah 1 |

`ANTHROPIC_API_KEY` harusnya udah ada (dipakai `api/recommend.js`) — cron job
baru ini pakai key yang sama, nggak perlu key baru.

`CRON_SECRET` **tidak perlu kamu set manual** — Vercel otomatis provision dan
inject ini begitu ada `crons` di `vercel.json`, lalu otomatis dikirim sebagai
header saat memanggil cron kamu.

## 3. Deploy
Push perubahan ini ke repo yang tersambung ke Vercel (atau upload manual kalau
belum pakai Git). Setelah deploy:
- Cron otomatis jalan sesuai jadwal di `vercel.json` (`0 20 * * *` UTC = kira-kira
  jam 3 pagi WIB). Di plan Hobby, cron cuma bisa 1x/hari — itu memang pas
  dengan niatnya (nambah beberapa halaman per hari, bukan real-time).
- Mau tes manual tanpa nunggu jadwal? Buka
  **Vercel dashboard → project → Cron Jobs tab** → ada tombol run manual di sana.

## 4. Cek hasilnya
- Setelah cron jalan sekali, cek tabel `seo_pages` di Supabase — harusnya ada
  5 baris baru.
- Buka `https://randomly.id/rekomendasi/<salah-satu-slug>` — harus muncul
  halamannya.
- Buka `https://randomly.id/sitemap.xml` — harus muncul URL-URL baru itu.

## 5. Submit ke Google Search Console (manual, sekali di awal)
1. Kalau belum, verifikasi property `randomly.id` di
   https://search.google.com/search-console
2. Submit sitemap: masukin `https://randomly.id/sitemap.xml` di menu Sitemaps.
   Setelah itu Google akan re-crawl sitemap ini secara berkala sendiri.

**Belum diotomatisasi (sengaja, biar nggak over-engineering di awal):**
auto-submit URL individual ke Search Console API (butuh OAuth service account
+ verifikasi domain lewat API, bukan cuma UI). Worth ditambahin setelah kamu
lihat batch pertama ke-index dengan baik lewat cara manual ini — kasih tau aku
kalau udah siap ke langkah itu.

## Yang paling gampang buat kamu tuning sendiri
Edit `lib/combos.js` — di situ semua kategori, kota, dan modifier/tema diatur.
Nambah kota atau tema baru tidak perlu sentuh file lain sama sekali.
