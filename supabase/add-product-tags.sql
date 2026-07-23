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

create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.product_tags (name, slug, active, sort_order)
values
  ('Destaque', 'destaque', true, 0),
  ('Novo', 'novo', true, 1),
  ('Promoção', 'promocao', true, 2),
  ('Sale', 'sale', true, 3),
  ('Exclusivo', 'exclusivo', true, 4)
on conflict (slug) do nothing;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tag%'
  loop
    execute format('alter table public.products drop constraint if exists %I', constraint_name);
  end loop;
end $$;

drop trigger if exists product_tags_set_updated_at on public.product_tags;
create trigger product_tags_set_updated_at
before update on public.product_tags
for each row execute function public.set_updated_at();

alter table public.product_tags enable row level security;

drop policy if exists "Public can read active product tags" on public.product_tags;
create policy "Public can read active product tags"
on public.product_tags
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can read all product tags" on public.product_tags;
create policy "Admins can read all product tags"
on public.product_tags
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert product tags" on public.product_tags;
create policy "Admins can insert product tags"
on public.product_tags
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update product tags" on public.product_tags;
create policy "Admins can update product tags"
on public.product_tags
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete product tags" on public.product_tags;
create policy "Admins can delete product tags"
on public.product_tags
for delete
to authenticated
using (public.is_admin());

do $$
begin
  if to_regclass('public.site_banners') is not null then
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
  end if;
end $$;
