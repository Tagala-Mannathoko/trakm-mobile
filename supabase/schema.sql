-- Community comments table
create table if not exists public.community_comments (
  comment_id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(post_id) on delete cascade,
  member_id uuid not null references public.neighborhood_members(member_id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful index for fetching by post
create index if not exists idx_community_comments_post on public.community_comments(post_id, created_at);

-- Optional: link qr_codes directly to a member's house
-- Adds a nullable foreign key for clarity if you wish to tie a QR to a member
alter table public.qr_codes
  add column if not exists member_id uuid references public.neighborhood_members(member_id) on delete set null;

-- Optional: ensure patrol_scans references are indexed
create index if not exists idx_patrol_scans_qr on public.patrol_scans(qr_code_id);
create index if not exists idx_patrol_scans_officer on public.patrol_scans(officer_id);


