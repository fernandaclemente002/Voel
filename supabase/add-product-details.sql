alter table public.products
add column if not exists max_installments integer default 1;

alter table public.products
add column if not exists available_sizes text[] default '{}';

alter table public.products
add column if not exists available_colors text[] default '{}';

alter table public.products
add column if not exists sku text;

alter table public.products
add column if not exists details text;

update public.products
set max_installments = 1
where max_installments is null or max_installments < 1;

update public.products
set available_sizes = '{}'
where available_sizes is null;

update public.products
set available_colors = '{}'
where available_colors is null;

alter table public.products
alter column max_installments set default 1,
alter column max_installments set not null,
alter column available_sizes set default '{}',
alter column available_sizes set not null,
alter column available_colors set default '{}',
alter column available_colors set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_max_installments_positive'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_max_installments_positive
    check (max_installments >= 1);
  end if;
end $$;
