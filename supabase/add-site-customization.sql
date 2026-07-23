create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  title text,
  subtitle text,
  text_color text,
  image_fit text not null default 'cover',
  content_position text not null default 'bottom_center',
  show_text boolean not null default false,
  button_enabled boolean not null default false,
  button_label text,
  target_type text not null default 'all',
  target_value text,
  external_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_banners_target_type_check
    check (target_type in ('all', 'featured', 'tag', 'category', 'external')),
  constraint site_banners_image_fit_check
    check (image_fit in ('cover', 'contain')),
  constraint site_banners_content_position_check
    check (content_position in ('center', 'bottom_center', 'bottom_left', 'bottom_right'))
);

create table if not exists public.site_settings (
  id text primary key default 'site',
  contact_email text not null default 'voel.levezaeessencia@gmail.com',
  whatsapp_number text not null default '5511930224490',
  instagram_url text not null default 'https://www.instagram.com/voel.oficial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, contact_email, whatsapp_number, instagram_url)
values ('site', 'voel.levezaeessencia@gmail.com', '5511930224490', 'https://www.instagram.com/voel.oficial')
on conflict (id) do nothing;

alter table public.site_banners
  add column if not exists image_fit text not null default 'cover',
  add column if not exists content_position text not null default 'bottom_center';

alter table public.site_banners
  drop constraint if exists site_banners_target_type_check;

update public.site_banners
set target_value = case target_type
  when 'tag_new' then 'Novo'
  when 'tag_promotion' then 'Promoção'
  when 'tag_sale' then 'Sale'
  else target_value
end,
target_type = case
  when target_type in ('tag_new', 'tag_promotion', 'tag_sale') then 'tag'
  else target_type
end;

alter table public.site_banners
  add constraint site_banners_target_type_check
  check (target_type in ('all', 'featured', 'tag', 'category', 'external'));

alter table public.site_banners
  drop constraint if exists site_banners_image_fit_check;

alter table public.site_banners
  add constraint site_banners_image_fit_check
  check (image_fit in ('cover', 'contain'));

alter table public.site_banners
  drop constraint if exists site_banners_content_position_check;

alter table public.site_banners
  add constraint site_banners_content_position_check
  check (content_position in ('center', 'bottom_center', 'bottom_left', 'bottom_right'));

drop trigger if exists site_banners_set_updated_at on public.site_banners;
create trigger site_banners_set_updated_at
before update on public.site_banners
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.site_banners enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public can read active site banners" on public.site_banners;
create policy "Public can read active site banners"
on public.site_banners
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can read all site banners" on public.site_banners;
create policy "Admins can read all site banners"
on public.site_banners
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert site banners" on public.site_banners;
create policy "Admins can insert site banners"
on public.site_banners
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update site banners" on public.site_banners;
create policy "Admins can update site banners"
on public.site_banners
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete site banners" on public.site_banners;
create policy "Admins can delete site banners"
on public.site_banners
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can read site settings" on public.site_settings;
create policy "Admins can read site settings"
on public.site_settings
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
on public.site_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
