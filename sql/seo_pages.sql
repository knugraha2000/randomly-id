-- Agent 1 (Programmatic SEO) — tabel utama
-- Jalankan ini sekali di Supabase SQL Editor (Project → SQL Editor → New query)

create table if not exists seo_pages (
  id bigint generated always as identity primary key,
  slug text unique not null,
  category text not null,
  location text,              -- null kalau kategori ini tidak location-based
  modifier text not null,
  title text not null,
  meta_description text not null,
  intro text not null,
  criteria jsonb not null default '[]',   -- array of string
  faq jsonb not null default '[]',        -- array of {q, a}
  status text not null default 'draft',   -- draft | published
  clicks int not null default 0,
  impressions int not null default 0,
  gsc_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_pages_status_idx on seo_pages(status);
create index if not exists seo_pages_category_idx on seo_pages(category);

-- Trigger kecil biar updated_at otomatis ke-update
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_seo_pages_updated_at on seo_pages;
create trigger trg_seo_pages_updated_at
  before update on seo_pages
  for each row execute function set_updated_at();
