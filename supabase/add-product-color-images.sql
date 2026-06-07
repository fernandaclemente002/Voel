alter table public.products
add column if not exists color_images jsonb not null default '{}'::jsonb;

update public.products
set color_images = '{}'::jsonb
where color_images is null;

alter table public.products
alter column color_images set default '{}'::jsonb,
alter column color_images set not null;
