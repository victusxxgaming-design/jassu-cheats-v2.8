-- Session security: 12h absolute session lifetime, server-side logout,
-- locked-down checkout/admin paths. Backup of prior state:
-- supabase/backup/pre-session-security.sql
begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- Rollout cutoff: sessions created before this must sign in again.
create table if not exists app_private.config (
  id int primary key default 1 check (id = 1),
  session_cutoff timestamptz not null default now(),
  session_hours int not null default 12
);
insert into app_private.config (id) values (1) on conflict (id) do nothing;

-- Active session = the JWT's provider session still exists (logout deletes it),
-- was created after the cutoff, and is younger than 12h since original login.
create or replace function public.session_expires_at()
returns timestamptz language sql stable security definer
set search_path = '' as $$
  select s.created_at + make_interval(hours => c.session_hours)
  from auth.sessions s, app_private.config c
  where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    and s.user_id = auth.uid()
    and s.created_at >= c.session_cutoff
$$;

create or replace function public.session_ok()
returns boolean language sql stable security definer
set search_path = '' as $$
  select coalesce(public.session_expires_at() > now(), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = '' as $$
  select public.session_ok() and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

revoke execute on function public.session_expires_at(), public.session_ok(), public.is_admin() from public, anon;
grant execute on function public.session_expires_at(), public.session_ok(), public.is_admin() to authenticated;

-- ---------- policies ----------
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using (public.session_ok() and (auth.uid() = id or public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (public.session_ok() and auth.uid() = id) with check (public.session_ok() and auth.uid() = id);
-- Users must never change their own role.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, avatar_url, discord) on public.profiles to authenticated;

drop policy if exists orders_insert_own on public.orders;
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders for select to authenticated
  using (public.session_ok() and (auth.uid() = user_id or public.is_admin()));
revoke insert on public.orders from authenticated, anon;

drop policy if exists order_items_insert_own on public.order_items;
drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own on public.order_items for select to authenticated
  using (public.session_ok() and exists (select 1 from public.orders o
    where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())));
revoke insert, update, delete on public.order_items from authenticated, anon;

drop policy if exists keys_select_own on public.license_keys;
create policy keys_select_own on public.license_keys for select to authenticated
  using (public.session_ok() and (public.is_admin() or exists (select 1 from public.orders o
    where o.id = license_keys.order_id and o.user_id = auth.uid() and o.payment_status = 'paid')));

drop policy if exists coupons_read_active on public.coupons;
create policy coupons_read_admin on public.coupons for select to authenticated using (public.is_admin());

drop policy if exists tickets_insert_own on public.support_tickets;
drop policy if exists tickets_select_own on public.support_tickets;
create policy tickets_insert_own on public.support_tickets for insert to authenticated
  with check (public.session_ok() and auth.uid() = user_id);
create policy tickets_select_own on public.support_tickets for select to authenticated
  using (public.session_ok() and (auth.uid() = user_id or public.is_admin()));

-- Download links are private.
revoke select on public.products from anon, authenticated;
grant select (id, slug, name, tagline, description, price, platform, version, stock, hue,
  rating, sales, features, image_url, published, created_at, updated_at)
  on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- ---------- checkout ----------
create or replace function public.check_coupon(p_code text)
returns table (code text, percent_off int) language sql stable security definer
set search_path = '' as $$
  select c.code, c.percent_off from public.coupons c
  where public.session_ok() and c.code = upper(p_code) and c.active
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null or c.uses < c.max_uses)
$$;

create or replace function public.place_order(
  p_product_ids uuid[], p_coupon text, p_full_name text, p_country text,
  p_discord text, p_method text)
returns text language plpgsql security definer
set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_sub numeric; v_cnt int; v_pct int := 0; v_code text; v_disc numeric; v_fee numeric;
  v_rate numeric; v_num text; v_id uuid; v_email text;
begin
  if v_uid is null or not public.session_ok() then raise exception 'session expired' using errcode = '28000'; end if;
  if coalesce(array_length(p_product_ids, 1), 0) = 0 or array_length(p_product_ids, 1) > 20 then raise exception 'invalid cart'; end if;
  select sum(p.price), count(*) into v_sub, v_cnt from unnest(p_product_ids) x(pid)
    join public.products p on p.id = x.pid and p.published;
  if v_cnt <> array_length(p_product_ids, 1) then raise exception 'invalid product'; end if;
  if p_coupon is not null and p_coupon <> '' then
    select c.code, c.percent_off into v_code, v_pct from public.check_coupon(p_coupon) c;
    if v_code is null then raise exception 'invalid coupon'; end if;
  end if;
  select coalesce(fee_rate, 0) into v_rate from public.store_settings where id = 1;
  v_disc := round(v_sub * coalesce(v_pct, 0) / 100.0, 2);
  v_fee := round((v_sub - v_disc) * coalesce(v_rate, 0), 2);
  select email into v_email from auth.users where id = v_uid;
  loop
    v_num := 'VX-' || (10000 + floor(random() * 90000))::int;
    exit when not exists (select 1 from public.orders where order_number = v_num);
  end loop;
  insert into public.orders (order_number, user_id, email, full_name, country, discord,
    subtotal, discount, fee, total, coupon_code, payment_method, payment_status)
  values (v_num, v_uid, v_email, left(p_full_name, 120), left(p_country, 80), nullif(left(coalesce(p_discord, ''), 80), ''),
    v_sub, v_disc, v_fee, v_sub - v_disc + v_fee, v_code, p_method, 'pending')
  returning id into v_id;
  insert into public.order_items (order_id, product_id, price)
    select v_id, p.id, p.price from unnest(p_product_ids) x(pid) join public.products p on p.id = x.pid;
  return v_num;
end $$;

-- Admin-only: mark paid and assign one unused key per item.
create or replace function public.complete_order(p_order_id uuid)
returns void language plpgsql security definer
set search_path = '' as $$
declare r record; v_key uuid; v_coupon text;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.orders set payment_status = 'paid'
    where id = p_order_id and payment_status <> 'paid' returning coupon_code into v_coupon;
  if not found then return; end if;
  if v_coupon is not null then update public.coupons set uses = uses + 1 where code = v_coupon; end if;
  for r in select product_id from public.order_items where order_id = p_order_id loop
    v_key := null;
    select id into v_key from public.license_keys
      where product_id = r.product_id and status = 'unassigned' and order_id is null
      order by created_at limit 1 for update skip locked;
    if v_key is not null then
      update public.license_keys set order_id = p_order_id, status = 'active' where id = v_key;
    end if;
    update public.products set sales = sales + 1 where id = r.product_id;
  end loop;
end $$;

create or replace function public.get_download_url(p_product_id uuid)
returns text language sql stable security definer
set search_path = '' as $$
  select p.download_url from public.products p
  where public.session_ok() and p.id = p_product_id and (public.is_admin() or exists (
    select 1 from public.orders o join public.order_items i on i.order_id = o.id
    where o.user_id = auth.uid() and o.payment_status = 'paid' and i.product_id = p.id))
$$;

revoke execute on function public.check_coupon(text), public.place_order(uuid[], text, text, text, text, text),
  public.complete_order(uuid), public.get_download_url(uuid) from public, anon;
grant execute on function public.check_coupon(text), public.place_order(uuid[], text, text, text, text, text),
  public.complete_order(uuid), public.get_download_url(uuid) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;
