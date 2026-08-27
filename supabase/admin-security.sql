create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

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

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users for select
using (public.is_admin());

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

-- Replace this email with the Supabase Auth user you created for /admin.
insert into public.admin_users (email)
values ('your-admin-email@example.com')
on conflict (email) do nothing;
