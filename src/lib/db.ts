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

// Download links are private (see get_download_url), so list safe columns only.
const PRODUCT_COLS =
  "id, slug, name, tagline, description, price, platform, version, stock, hue, rating, sales, features, image_url, published, created_at";

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<DbProduct[]> => {
    const { data: prows, error } = await supabase.from("products").select(PRODUCT_COLS).order("created_at");
    if (error) throw error;
    const { data: vrows } = await supabase.from("product_versions").select("*").order("released_at", { ascending: false });
    return (prows ?? []).map((p) => mapProduct({ ...p, download_url: null }, (vrows ?? []).filter((v) => v.product_id === p.id)));
  },
});

export const useProducts = () => useQuery(productsQuery);

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<DbProduct | null> => {
      const { data: p, error } = await supabase.from("products").select(PRODUCT_COLS).eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!p) return null;
      const { data: vrows } = await supabase.from("product_versions").select("*").eq("product_id", p.id).order("released_at", { ascending: false });
      return mapProduct({ ...p, download_url: null }, vrows ?? []);
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

// Totals, identity and payment status are decided by the database
// (place_order); browser-supplied amounts are ignored. Orders start pending
// until an admin verifies payment.
export async function createOrder(input: CheckoutInput): Promise<string> {
  if (input.outcome === "failed") throw new Error("Payment failed");
  const { data, error } = await supabase.rpc("place_order", {
    p_product_ids: input.items.map((p) => p.id),
    p_coupon: input.couponCode,
    p_full_name: input.fullName,
    p_country: input.country,
    p_discord: input.discord,
    p_method: input.method,
  });
  if (error) throw error;
  return data as string;
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

export async function validateCoupon(code: string): Promise<{ code: string; percent_off: number } | null> {
  const { data, error } = await supabase.rpc("check_coupon", { p_code: code });
  if (error) throw error;
  const rows = (data ?? []) as { code: string; percent_off: number }[];
  return rows[0] ?? null;
}

export async function getDownloadUrl(productId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_download_url", { p_product_id: productId });
  if (error) throw error;
  return (data as string | null) ?? null;
}
