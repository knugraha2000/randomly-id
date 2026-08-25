-- Agent 2 (Auto-posting) — tabel draft konten sosmed harian.
-- Jalankan ini sekali di Supabase SQL Editor.

create table if not exists social_posts (
  id bigint generated always as identity primary key,
  type text not null,               -- 'quiz' | 'funfact'
  topic text not null,               -- domain/topik yang dipakai
  payload jsonb not null,            -- isi lengkap hasil generate (lihat lib/socialContent.js)
  status text not null default 'draft',  -- draft | posted
  platform text,                     -- diisi nanti pas Agent 2 posting beneran jalan
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists social_posts_status_idx on social_posts(status);
create index if not exists social_posts_type_idx on social_posts(type);
