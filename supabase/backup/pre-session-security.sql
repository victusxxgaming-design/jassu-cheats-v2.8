-- policies
CREATE POLICY profiles_update_own ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id));
CREATE POLICY profiles_select_own ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY products_admin_write ON public.products AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY products_public_read ON public.products AS PERMISSIVE FOR SELECT TO anon,authenticated USING (((published = true) OR is_admin()));
CREATE POLICY versions_admin_write ON public.product_versions AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY versions_public_read ON public.product_versions AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY orders_admin_update ON public.orders AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY orders_insert_own ON public.orders AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY orders_select_own ON public.orders AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR is_admin()));
CREATE POLICY order_items_insert_own ON public.order_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))));
CREATE POLICY order_items_select_own ON public.order_items AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND ((o.user_id = auth.uid()) OR is_admin())))));
CREATE POLICY keys_admin_write ON public.license_keys AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY keys_select_own ON public.license_keys AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR (EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = license_keys.order_id) AND (o.user_id = auth.uid()))))));
CREATE POLICY coupons_admin_write ON public.coupons AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY coupons_read_active ON public.coupons AS PERMISSIVE FOR SELECT TO authenticated USING (((active = true) OR is_admin()));
CREATE POLICY tickets_admin_update ON public.support_tickets AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY tickets_insert_own ON public.support_tickets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY tickets_select_own ON public.support_tickets AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR is_admin()));
CREATE POLICY settings_admin_write ON public.store_settings AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY settings_public_read ON public.store_settings AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);
-- functions
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$function$
;
CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$
;
