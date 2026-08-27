create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('image', 'video')),
  image_url text,
  youtube_url text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_media_required check (
    (type = 'image' and image_url is not null and youtube_url is null)
    or
    (type = 'video' and youtube_url is not null)
  )
);

create index if not exists categories_display_order_idx
  on public.categories(display_order, created_at);

create index if not exists works_display_order_idx
  on public.works(display_order, created_at desc);

create index if not exists works_category_id_idx
  on public.works(category_id);

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_works_updated_at on public.works;
create trigger set_works_updated_at
before update on public.works
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.works enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users for select
using (public.is_admin());

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (true);

drop policy if exists "Public can read works" on public.works;
create policy "Public can read works"
on public.works for select
using (true);

drop policy if exists "Authenticated users can manage categories" on public.categories;
create policy "Authenticated users can manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated users can manage works" on public.works;
create policy "Authenticated users can manage works"
on public.works for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio images" on storage.objects;
create policy "Public can read portfolio images"
on storage.objects for select
using (bucket_id = 'portfolio');

drop policy if exists "Authenticated users can upload portfolio images" on storage.objects;
create policy "Authenticated users can upload portfolio images"
on storage.objects for insert
with check (
  bucket_id = 'portfolio'
  and public.is_admin()
);

drop policy if exists "Authenticated users can update portfolio images" on storage.objects;
create policy "Authenticated users can update portfolio images"
on storage.objects for update
using (
  bucket_id = 'portfolio'
  and public.is_admin()
)
with check (
  bucket_id = 'portfolio'
  and public.is_admin()
);

drop policy if exists "Authenticated users can delete portfolio images" on storage.objects;
create policy "Authenticated users can delete portfolio images"
on storage.objects for delete
using (
  bucket_id = 'portfolio'
  and public.is_admin()
);
