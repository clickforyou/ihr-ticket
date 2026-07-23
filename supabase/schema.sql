-- =============================================================
-- iHR Ticket — Supabase schema
-- รันไฟล์นี้ใน Supabase Dashboard > SQL Editor (New query > paste > Run)
-- ปลอดภัยต่อการรันซ้ำ (idempotent)
-- =============================================================

-- ---------- Enums ----------
do $$ begin
  create type ticket_status as enum ('todo','in_progress','in_review','done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_priority as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin','dev','member');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        user_role not null default 'member',
  created_at  timestamptz not null default now()
);

-- ---------- projects ----------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  key         text not null unique,
  description text,
  color       text not null default '#7c3aed',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- labels ----------
create table if not exists public.labels (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  name        text not null,
  color       text not null default '#64748b'
);

-- ---------- tickets ----------
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  status      ticket_status not null default 'todo',
  priority    ticket_priority not null default 'medium',
  assignee_id uuid references public.profiles(id) on delete set null,
  reporter_id uuid references public.profiles(id) on delete set null,
  due_date    date,
  position    double precision not null default 1000,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tickets_project_idx  on public.tickets(project_id);
create index if not exists tickets_status_idx   on public.tickets(status);
create index if not exists tickets_assignee_idx on public.tickets(assignee_id);

-- ---------- ticket_labels (m2m) ----------
create table if not exists public.ticket_labels (
  ticket_id uuid references public.tickets(id) on delete cascade,
  label_id  uuid references public.labels(id) on delete cascade,
  primary key (ticket_id, label_id)
);

-- ---------- attachments (images) ----------
create table if not exists public.attachments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  mime_type   text,
  size        bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists attachments_ticket_idx on public.attachments(ticket_id);

-- ---------- comments ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_ticket_idx on public.comments(ticket_id);

-- ---------- activity log ----------
create table if not exists public.activity (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_ticket_idx on public.activity(ticket_id);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ---------- auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Row Level Security
-- โมเดล: ทีมภายใน — ผู้ใช้ที่ล็อกอินแล้ว (authenticated) เข้าถึงข้อมูลได้ทั้งหมด
-- แก้ profile ได้เฉพาะของตัวเอง
-- =============================================================
alter table public.profiles       enable row level security;
alter table public.projects       enable row level security;
alter table public.labels         enable row level security;
alter table public.tickets        enable row level security;
alter table public.ticket_labels  enable row level security;
alter table public.attachments    enable row level security;
alter table public.comments       enable row level security;
alter table public.activity       enable row level security;

-- profiles: ทุกคนที่ล็อกอินอ่านได้, แก้ได้เฉพาะของตัวเอง
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- helper macro: full access for authenticated on a table
do $$
declare t text;
begin
  foreach t in array array[
    'projects','labels','tickets','ticket_labels','attachments','comments','activity'
  ] loop
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format(
      'create policy %I_all on public.%I for all to authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- =============================================================
-- Storage bucket สำหรับรูปแนบ
-- =============================================================
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', true)
on conflict (id) do nothing;

-- อ่านรูปได้แบบ public (bucket public), อัปโหลด/ลบเฉพาะผู้ล็อกอิน
drop policy if exists ticket_attachments_read on storage.objects;
create policy ticket_attachments_read on storage.objects
  for select using (bucket_id = 'ticket-attachments');

drop policy if exists ticket_attachments_write on storage.objects;
create policy ticket_attachments_write on storage.objects
  for insert to authenticated with check (bucket_id = 'ticket-attachments');

drop policy if exists ticket_attachments_delete on storage.objects;
create policy ticket_attachments_delete on storage.objects
  for delete to authenticated using (bucket_id = 'ticket-attachments');

-- =============================================================
-- Seed ตัวอย่าง (จะเพิ่มก็ต่อเมื่อยังไม่มี project ใด ๆ)
-- =============================================================
insert into public.projects (name, key, description, color)
select * from (values
  ('iHR Core',        'IHR', 'งานหลักระบบ iHR',           '#7c3aed'),
  ('E-Learning',      'ELN', 'ระบบเรียนออนไลน์',           '#0ea5e9'),
  ('Website ทางการ',  'WEB', 'เว็บไซต์ทางการ iHR',         '#10b981')
) as v(name, key, description, color)
where not exists (select 1 from public.projects);

insert into public.labels (project_id, name, color)
select null, v.name, v.color from (values
  ('bug',        '#ef4444'),
  ('feature',    '#8b5cf6'),
  ('improvement','#3b82f6'),
  ('docs',       '#64748b')
) as v(name, color)
where not exists (select 1 from public.labels);
