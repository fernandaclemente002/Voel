begin;

alter table public.products
add column if not exists installment_rate_2 numeric not null default 0,
add column if not exists installment_rate_3 numeric not null default 0;

update public.products
set max_installments = least(3, greatest(1, coalesce(max_installments, 1)))
where max_installments is null or max_installments not between 1 and 3;

alter table public.products
drop constraint if exists products_installment_settings_valid;

alter table public.products
add constraint products_installment_settings_valid check (
  max_installments between 1 and 3
  and installment_rate_2 >= 0 and installment_rate_2 < 'Infinity'::numeric
  and installment_rate_3 >= 0 and installment_rate_3 < 'Infinity'::numeric
  and installment_rate_2 = round(installment_rate_2, 2)
  and installment_rate_3 = round(installment_rate_3, 2)
  and installment_rate_2 * 100 <= 9007199254740991
  and installment_rate_3 * 100 <= 9007199254740991
  and round(price * (1 + installment_rate_2 / 100), 2) * 100 <= 9007199254740991
  and round(price * (1 + installment_rate_3 / 100), 2) * 100 <= 9007199254740991
);

commit;
