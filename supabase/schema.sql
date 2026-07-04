-- RTL8192EU quiz leaderboard — run once in the Supabase SQL editor.
-- Namespaced table (safe to add alongside other projects in the same database).
-- Hardened: RLS on, public read, guarded insert, no update/delete (denied by default).

create table if not exists public.rtl8192eu_scores (
  id          uuid primary key default gen_random_uuid(),
  handle      text not null check (char_length(handle) between 1 and 24),
  score       int  not null check (score >= 0),
  total       int  not null check (total between 1 and 100),
  created_at  timestamptz not null default now(),
  constraint  score_le_total check (score <= total)
);

alter table public.rtl8192eu_scores enable row level security;

drop policy if exists "rtl8192eu public read" on public.rtl8192eu_scores;
create policy "rtl8192eu public read"
  on public.rtl8192eu_scores for select
  using (true);

-- anon may insert only well-formed rows; no update/delete policies => those are denied.
drop policy if exists "rtl8192eu guarded insert" on public.rtl8192eu_scores;
create policy "rtl8192eu guarded insert"
  on public.rtl8192eu_scores for insert
  with check (
    char_length(handle) between 1 and 24
    and score >= 0
    and total between 1 and 100
    and score <= total
  );

create index if not exists rtl8192eu_scores_rank_idx
  on public.rtl8192eu_scores (score desc, created_at asc);
