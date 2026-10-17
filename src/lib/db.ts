// Database access layer — all live store data flows through here.
import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order, Platform, Product } from "@/lib/data";

// ---------- types ----------

export type DbProduct = Product & {
  id: string;
  description: string;
  image_url: string | null;
  download_url: string | null;
  published: boolean;
};

export type MyOrder = Order & {
  dbId: string;
  method: string | null;
  keyValue: string | null;
  keyExpires: string | null;
};

export type AdminOrder = {
  dbId: string;
  id: string; // order_number
  customer: string;
  email: string;
  product: string;
  total: number;
  pay: string;
  method: string;
  date: string;
};

export type AdminKey = {
  id: string;
  key: string;
  product: string;
  productId: string;
  status: string;
  order: string;
  expires: string;
};

export type Coupon = {
  id: string;
  code: string;
  percent_off: number;
  uses: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  joined: string;
  role: string;
};

export type StoreSettings = {
  store_name: string;
  currency: string;
  fee_rate: number;
  maintenance_mode: boolean;
  support_email: string | null;
  discord_invite: string | null;
  auto_reply: string | null;
};

// ---------- mappers ----------

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProduct(r: any, versions: any[]): DbProduct {
  const current = versions.find((v) => v.is_current) ?? versions[0];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    price: Number(r.price),
    platform: r.platform as Platform,
    version: r.version,
    released: current ? fmtDate(current.released_at) : fmtDate(r.created_at),
    stock: r.stock,
    hue: r.hue ?? 220,
    rating: Number(r.rating ?? 5),
    sales: r.sales ?? 0,
    features: r.features ?? [],
    notes: current?.notes ?? [],
    image_url: r.image_url,
    download_url: r.download_url,
    published: r.published,
  };
}

function mapOrder(r: any): MyOrder {
  const items = (r.order_items ?? []).map((i: any) => i.products?.slug).filter(Boolean);
  const keyRow = (r.license_keys ?? [])[0];
  const keyState = !keyRow
    ? r.payment_status === "paid" ? "unavailable" : "pending"
    : keyRow.status === "active" ? "active" : keyRow.status === "expired" ? "expired" : "unavailable";
  return {
    dbId: r.id,
    id: r.order_number,
    date: fmtDate(r.created_at),
    items,
    total: Number(r.total),
    payment: r.payment_status === "refunded" ? "failed" : r.payment_status,
    key: keyState,
    method: r.payment_method,
    keyValue: keyRow?.key ?? null,
    keyExpires: keyRow?.expires_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- products ----------

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<DbProduct[]> => {
    const { data: prows, error } = await supabase.from("products").select("*").order("created_at");
    if (error) throw error;
    const { data: vrows } = await supabase.from("product_versions").select("*").order("released_at", { ascending: false });
    return (prows ?? []).map((p) => mapProduct(p, (vrows ?? []).filter((v) => v.product_id === p.id)));
  },
});

export const useProducts = () => useQuery(productsQuery);

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<DbProduct | null> => {
      const { data: p, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!p) return null;
      const { data: vrows } = await supabase.from("product_versions").select("*").eq("product_id", p.id).order("released_at", { ascending: false });
      return mapProduct(p, vrows ?? []);
    },
  });

// ---------- orders (customer) ----------

const ORDER_SELECT = "*, order_items(price, products(slug, name)), license_keys(key, status, expires_at)";

export const myOrdersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyOrder[]> => {
      const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("user_id", userId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapOrder);
    },
  });

export const orderQuery = (orderNumber: string) =>
  queryOptions({
    queryKey: ["order", orderNumber],
    queryFn: async (): Promise<MyOrder | null> => {
      const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("order_number", orderNumber).maybeSingle();
      if (error) throw error;
      return data ? mapOrder(data) : null;
    },
  });

export type CheckoutInput = {
  userId: string;
  email: string;
  fullName: string;
  country: string;
  discord: string;
  method: string;
  couponCode: string | null;
  items: DbProduct[];
  subtotal: number;
  discount: number;
  fee: number;
  total: number;
  outcome: "success" | "pending" | "failed";
};

export async function createOrder(input: CheckoutInput): Promise<string> {
  const orderNumber = `VX-${Math.floor(10000 + Math.random() * 90000)}`;
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: input.userId,
      email: input.email,
      full_name: input.fullName,
      country: input.country,
      discord: input.discord || null,
      subtotal: input.subtotal,
      discount: input.discount,
      fee: input.fee,
      total: input.total,
      coupon_code: input.couponCode,
      payment_method: input.method,
      payment_status: input.outcome === "success" ? "pending" : input.outcome === "pending" ? "pending" : "failed",
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((p) => ({ order_id: order.id, product_id: p.id, price: p.price })),
  );
  if (itemsError) throw itemsError;

  if (input.outcome === "success") {
    const { error: rpcError } = await supabase.rpc("complete_order", { p_order_id: order.id });
    if (rpcError) throw rpcError;
  }
  return orderNumber;
}

// ---------- admin ----------

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin-orders"],
  queryFn: async (): Promise<AdminOrder[]> => {
    const { data, error } = await supabase.from("orders").select("*, order_items(products(name))").order("created_at", { ascending: false });
    if (error) throw error;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      dbId: r.id,
      id: r.order_number,
      customer: r.full_name || r.email,
      email: r.email,
      product: (r.order_items ?? []).map((i: any) => i.products?.name).filter(Boolean).join(", ") || "—",
      total: Number(r.total),
      pay: r.payment_status,
      method: r.payment_method ?? "—",
      date: fmtDate(r.created_at),
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
});

export const adminKeysQuery = queryOptions({
  queryKey: ["admin-keys"],
  queryFn: async (): Promise<AdminKey[]> => {
    const { data, error } = await supabase.from("license_keys").select("*, products(name), orders(order_number)").order("created_at", { ascending: false });
    if (error) throw error;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      id: r.id,
      key: r.key,
      product: r.products?.name ?? "—",
      productId: r.product_id,
      status: r.status,
      order: r.orders?.order_number ?? "—",
      expires: r.expires_at ? fmtDate(r.expires_at) : "—",
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
});

export const adminCouponsQuery = queryOptions({
  queryKey: ["admin-coupons"],
  queryFn: async (): Promise<Coupon[]> => {
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Coupon[];
  },
});

export const adminCustomersQuery = queryOptions({
  queryKey: ["admin-customers"],
  queryFn: async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.display_name || "—",
      email: "",
      joined: fmtDate(r.created_at),
      role: r.role,
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings | null> => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data as StoreSettings | null;
  },
});

// ---------- admin mutations ----------

export async function saveProduct(p: Partial<DbProduct> & { slug: string; name: string }) {
  const row = {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? "",
    description: p.description ?? "",
    price: p.price ?? 0,
    platform: p.platform ?? "pc",
    stock: p.stock ?? "in",
    hue: p.hue ?? 220,
    features: p.features ?? [],
    published: p.published ?? true,
  };
  const { error } = p.id
    ? await supabase.from("products").update(row).eq("id", p.id)
    : await supabase.from("products").insert(row);
  if (error) throw error;
}

export async function publishVersion(productId: string, version: string, notes: string[]) {
  const { error: clearErr } = await supabase.from("product_versions").update({ is_current: false }).eq("product_id", productId);
  if (clearErr) throw clearErr;
  const { error } = await supabase.from("product_versions").insert({ product_id: productId, version, notes, is_current: true });
  if (error) throw error;
  const { error: pErr } = await supabase.from("products").update({ version }).eq("id", productId);
  if (pErr) throw pErr;
}

export async function verifyOrder(dbId: string) {
  const { error } = await supabase.rpc("complete_order", { p_order_id: dbId });
  if (error) throw error;
}

export async function setOrderStatus(dbId: string, status: "pending" | "failed" | "refunded") {
  const { error } = await supabase.from("orders").update({ payment_status: status }).eq("id", dbId);
  if (error) throw error;
}

export async function importKeys(productId: string, keys: string[]) {
  const rows = keys.map((k) => k.trim()).filter(Boolean).map((k) => ({ product_id: productId, key: k }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("license_keys").insert(rows);
  if (error) throw error;
}

export async function setKeyStatus(keyId: string, status: "active" | "revoked" | "expired") {
  const { error } = await supabase.from("license_keys").update({ status }).eq("id", keyId);
  if (error) throw error;
}

export async function createCoupon(code: string, percentOff: number, maxUses: number | null, expiresAt: string | null) {
  const { error } = await supabase.from("coupons").insert({ code: code.toUpperCase(), percent_off: percentOff, max_uses: maxUses, expires_at: expiresAt });
  if (error) throw error;
}

export async function saveSettings(s: StoreSettings) {
  const { error } = await supabase.from("store_settings").update(s).eq("id", 1);
  if (error) throw error;
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const c = data as Coupon;
  if (c.expires_at && new Date(c.expires_at) < new Date()) return null;
  if (c.max_uses !== null && c.uses >= c.max_uses) return null;
  return c;
}
