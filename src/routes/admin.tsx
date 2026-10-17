import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Package, Layers, Tags, Receipt, ShieldCheck, KeyRound, Users, TicketPercent, BarChart3, Settings, Search, Plus, Upload, Pencil, ArrowUpRight, Ban, ExternalLink, Menu } from "lucide-react";
import { toast } from "sonner";
import { Logo, Status, Pill, Field, inputCls, platformIcon } from "@/components/site";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PLATFORMS, platformLabel, money, type Platform } from "@/lib/data";
import {
  useProducts, adminOrdersQuery, adminKeysQuery, adminCouponsQuery, adminCustomersQuery, settingsQuery,
  saveProduct, publishVersion, verifyOrder, setOrderStatus, importKeys, setKeyStatus, createCoupon, saveSettings,
  type DbProduct, type StoreSettings,
} from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Jassu Cheats" }, { name: "description", content: "Jassu Cheats store administration." }, { property: "og:title", content: "Admin — Jassu Cheats" }, { property: "og:description", content: "Store administration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth admin>
      <Admin />
    </RequireAuth>
  ),
});

const NAV = [
  ["overview", "Overview", LayoutDashboard], ["products", "Products", Package], ["versions", "Versions", Layers], ["categories", "Platforms", Tags],
  ["orders", "Orders", Receipt], ["payments", "Payments", ShieldCheck], ["keys", "Key inventory", KeyRound], ["customers", "Customers", Users],
  ["coupons", "Coupons", TicketPercent], ["analytics", "Analytics", BarChart3], ["settings", "Settings", Settings],
] as const;
type Sec = (typeof NAV)[number][0];

function Admin() {
  const [sec, setSec] = useState<Sec>("overview");
  const [mobile, setMobile] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar p-4 transition-transform lg:static lg:translate-x-0", mobile ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center gap-2 px-2"><Logo /><Pill tone="primary">Admin</Pill></div>
        <nav className="mt-8 space-y-0.5">
          {NAV.map(([id, label, Icon]) => (
            <button key={id} onClick={() => { setSec(id); setMobile(false); }} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition", sec === id ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60")}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
        <Link to="/" className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" />View storefront</Link>
      </aside>
      {mobile && <div className="fixed inset-0 z-30 bg-background/70 lg:hidden" onClick={() => setMobile(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)}><Menu /></Button>
          <h1 className="text-lg font-semibold">{NAV.find((n) => n[0] === sec)![1]}</h1>
          <div className="ml-auto flex items-center gap-3"><span className="hidden sm:block text-xs text-muted-foreground">Admin</span><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">VA</span></div>
        </header>
        <main className="p-6">
          {sec === "overview" && <Overview go={setSec} />}
          {sec === "products" && <Products />}
          {sec === "versions" && <Versions />}
          {sec === "categories" && <Categories />}
          {sec === "orders" && <OrdersSec />}
          {sec === "payments" && <Payments />}
          {sec === "keys" && <Keys />}
          {sec === "customers" && <Customers />}
          {sec === "coupons" && <Coupons />}
          {sec === "analytics" && <Analytics />}
          {sec === "settings" && <SettingsSec />}
        </main>
      </div>
    </div>
  );
}

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => <div className={cn("surface p-5", className)}>{children}</div>;
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return <div className="surface overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b">{head.map((h) => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead><tbody className="divide-y [&_td]:px-4 [&_td]:py-3 [&_tr:hover]:bg-surface-2">{React.Children.count(children) === 0 || (Array.isArray(children) && children.length === 0) ? <tr><td colSpan={head.length} className="text-center text-muted-foreground">Nothing here yet</td></tr> : children}</tbody></table></div>;
}
function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return <Card><p className="text-sm text-muted-foreground">{k}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p><p className="mt-1 flex items-center gap-1 text-xs text-success"><ArrowUpRight className="h-3 w-3" />{d}</p></Card>;
}

function Overview({ go }: { go: (s: Sec) => void }) {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useQuery(adminOrdersQuery);
  const { data: customers = [] } = useQuery(adminCustomersQuery);
  const revenue = orders.filter((o) => o.pay === "paid").reduce((s, o) => s + o.total, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat k="Revenue" v={money(revenue)} d="paid orders" /><Stat k="Orders" v={String(orders.length)} d="all time" /><Stat k="Customers" v={String(customers.length)} d="registered" /><Stat k="Active products" v={String(products.filter((p) => p.published).length)} d="published" /></div>
      <Card><h2 className="font-semibold mb-4">Needs attention</h2><p className="text-sm text-muted-foreground">{orders.filter((o) => o.pay === "pending").length} pending payment(s) to review.</p><Button variant="outline" size="sm" className="mt-6" onClick={() => go("payments")}>Review payments</Button></Card>
      <h2 className="font-semibold">Recent orders</h2><OrdersSec limit={5} />
    </div>
  );
}

function Products() {
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();
  const [q, setQ] = useState(""); const [pl, setPl] = useState("all"); const [edit, setEdit] = useState<DbProduct | "new" | null>(null);
  const list = useMemo(() => products.filter((p) => (pl === "all" || p.platform === pl) && p.name.toLowerCase().includes(q.toLowerCase())), [products, q, pl]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className={cn(inputCls, "pl-9")} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className={cn(inputCls, "w-40")} value={pl} onChange={(e) => setPl(e.target.value)}><option value="all">All platforms</option>{PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        <Button variant="hero" className="h-11" onClick={() => setEdit("new")}><Plus />Add product</Button>
      </div>
      <Table head={["Product", "Platform", "Price", "Current version", "Stock", "Sales", ""]}>
        {list.map((p) => { const I = platformIcon(p.platform); return (
          <tr key={p.slug}><td className="font-medium">{p.name}{!p.published && <span className="ml-2 text-xs text-muted-foreground">(hidden)</span>}</td><td><span className="flex items-center gap-1.5 text-muted-foreground"><I className="h-3.5 w-3.5" />{platformLabel(p.platform)}</span></td><td>{money(p.price)}</td>
            <td><span className="flex items-center gap-2 font-mono text-xs">v{p.version}<Status s="current" /></span></td><td><Status s={p.stock} /></td><td>{p.sales.toLocaleString()}</td>
            <td><Button size="icon" variant="ghost" onClick={() => setEdit(p)} aria-label="Edit"><Pencil /></Button></td></tr>
        ); })}
      </Table>
      <ProductDialog p={edit} onClose={() => setEdit(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["products"] })} />
    </div>
  );
}

function ProductDialog({ p, onClose, onSaved }: { p: DbProduct | "new" | null; onClose: () => void; onSaved: () => void }) {
  const prod = p && p !== "new" ? p : undefined;
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const f = document.getElementById("prod-form") as HTMLFormElement | null;
    if (!f) return;
    const fd = new FormData(f);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) { toast.error("Name is required"); return; }
    const slug = prod?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSaving(true);
    try {
      await saveProduct({
        id: prod?.id,
        slug,
        name,
        tagline: String(fd.get("tagline") ?? ""),
        price: Number(fd.get("price") ?? 0),
        platform: String(fd.get("platform") ?? "pc") as Platform,
        stock: String(fd.get("stock") ?? "in") as "in" | "low" | "out",
        published: fd.get("published") === "on",
      });
      toast.success("Product saved");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={!!p} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-popover">
        <DialogHeader><DialogTitle>{prod ? `Edit ${prod.name}` : "Add product"}</DialogTitle></DialogHeader>
        <form id="prod-form" className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className="sm:col-span-2"><Field label="Name"><input name="name" className={inputCls} defaultValue={prod?.name} /></Field></div>
          <Field label="Price (USD)"><input name="price" type="number" step="0.01" min="0" className={inputCls} defaultValue={prod?.price} /></Field>
          <Field label="Platform"><select name="platform" className={inputCls} defaultValue={prod?.platform ?? "pc"}>{PLATFORMS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
          <Field label="Stock"><select name="stock" className={inputCls} defaultValue={prod?.stock ?? "in"}><option value="in">In stock</option><option value="low">Low</option><option value="out">Out</option></select></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea name="tagline" className={cn(inputCls, "h-20 py-2")} defaultValue={prod?.tagline} /></Field></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="published" type="checkbox" defaultChecked={prod?.published ?? true} className="accent-primary" />Visible in store</label>
        </form>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="hero" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save product"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Versions() {
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();
  const [sel, setSel] = useState<string>();
  const [saving, setSaving] = useState(false);
  const p = products.find((x) => x.slug === sel) ?? products[0];
  if (products.length === 0) return <Card><p className="text-sm text-muted-foreground">No products yet. Add a product first.</p></Card>;
  const publish = async () => {
    const v = (document.getElementById("ver-input") as HTMLInputElement)?.value.trim();
    const n = (document.getElementById("ver-notes") as HTMLTextAreaElement)?.value.trim();
    if (!v) { toast.error("Enter a version number"); return; }
    setSaving(true);
    try {
      await publishVersion(p.id, v, n ? n.split("\n").filter(Boolean) : []);
      toast.success("Version published — set as current");
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  };
  const [maj, min, pat] = p.version.split(".").map(Number);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <select className={cn(inputCls, "max-w-xs")} value={p.slug} onChange={(e) => setSel(e.target.value)}>{products.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select>
        <Card className="border-primary/40">
          <div className="flex items-center gap-3"><span className="font-mono">v{p.version}</span><Status s="current" /><span className="ml-auto text-xs text-muted-foreground">{p.released}</span></div>
          <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">{p.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </Card>
      </div>
      <Card className="h-fit space-y-4"><h2 className="font-semibold">Publish new version</h2>
        <Field label="Version"><input id="ver-input" className={inputCls} placeholder={`${maj}.${min}.${(pat || 0) + 1}`} /></Field>
        <Field label="Release notes (one per line)"><textarea id="ver-notes" className={cn(inputCls, "h-24 py-2")} /></Field>
        <Button variant="hero" className="w-full" disabled={saving} onClick={publish}>{saving ? "Publishing…" : "Publish as current"}</Button></Card>
    </div>
  );
}

function Categories() {
  const { data: products = [] } = useProducts();
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{PLATFORMS.map((p) => { const I = platformIcon(p.id); return (
    <Card key={p.id}><I className="h-6 w-6 text-primary-glow" /><p className="mt-6 font-semibold">{p.label}</p><p className="text-sm text-muted-foreground">{p.blurb}</p>
      <div className="mt-4 flex items-center justify-between"><Pill>{products.filter((x) => x.platform === p.id).length} products</Pill></div></Card>
  ); })}</div>;
}

function OrdersSec({ limit }: { limit?: number }) {
  const { data: orders = [] } = useQuery(adminOrdersQuery);
  const [f, setF] = useState("all");
  const list = orders.filter((o) => f === "all" || o.pay === f).slice(0, limit);
  return (
    <div className="space-y-4">
      {!limit && <div className="flex flex-wrap gap-2">{["all", "paid", "pending", "failed", "refunded"].map((s) => <Button key={s} size="sm" variant={f === s ? "secondary" : "outline"} className="capitalize" onClick={() => setF(s)}>{s}</Button>)}</div>}
      <Table head={["Order", "Customer", "Product", "Total", "Method", "Payment", "Date"]}>
        {list.map((o) => <tr key={o.dbId}><td className="font-mono">{o.id}</td><td className="text-muted-foreground">{o.customer}</td><td>{o.product}</td><td>{money(o.total)}</td><td>{o.method}</td><td><Status s={o.pay} /></td><td className="text-muted-foreground whitespace-nowrap">{o.date}</td></tr>)}
      </Table>
    </div>
  );
}

function Payments() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery(adminOrdersQuery);
  const pending = orders.filter((o) => o.pay === "pending" || o.pay === "failed");
  const act = async (dbId: string, action: "verify" | "reject") => {
    try {
      if (action === "verify") { await verifyOrder(dbId); toast.success("Payment verified · key assigned"); }
      else { await setOrderStatus(dbId, "failed"); toast.success("Payment rejected"); }
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-keys"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">{[["paid", "Verified"], ["pending", "Awaiting"], ["failed", "Failed"], ["refunded", "Refunded"]].map(([s, l]) => <Card key={s}><Status s={s} /><p className="mt-3 font-display text-2xl font-semibold">{orders.filter((o) => o.pay === s).length}</p><p className="text-xs text-muted-foreground">{l}</p></Card>)}</div>
      <div className="space-y-3">{pending.map((o) => (
        <Card key={o.dbId} className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1"><p className="font-mono text-sm">{o.id} · {o.method}</p><p className="text-xs text-muted-foreground">{o.customer} · {money(o.total)}</p></div>
          <Status s={o.pay} />
          <Button size="sm" variant="outline" onClick={() => act(o.dbId, "reject")}><Ban />Reject</Button>
          <Button size="sm" variant="hero" onClick={() => act(o.dbId, "verify")}><ShieldCheck />Verify</Button>
        </Card>
      ))}</div>
    </div>
  );
}

function Keys() {
  const qc = useQueryClient();
  const { data: keys = [] } = useQuery(adminKeysQuery);
  const { data: products = [] } = useProducts();
  const [open, setOpen] = useState(false);
  const act = async (id: string, status: "active" | "revoked") => {
    try {
      await setKeyStatus(id, status);
      qc.invalidateQueries({ queryKey: ["admin-keys"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };
  const doImport = async () => {
    const pid = (document.getElementById("key-product") as HTMLSelectElement)?.value;
    const raw = (document.getElementById("key-list") as HTMLTextAreaElement)?.value ?? "";
    const list = raw.split("\n").map((k) => k.trim()).filter(Boolean);
    if (!pid || list.length === 0) { toast.error("Pick a product and paste at least one key"); return; }
    try {
      await importKeys(pid, list);
      toast.success(`${list.length} key(s) imported`);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-keys"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3"><Button variant="hero" onClick={() => setOpen(true)}><Upload />Import keys</Button><div className="ml-auto flex gap-2">{["active", "unassigned", "expired", "revoked"].map((s) => <Status key={s} s={s} />)}</div></div>
      <Table head={["Key", "Product", "Order", "Expires", "Status", ""]}>
        {keys.map((k) => (
          <tr key={k.id}><td className="font-mono text-xs">{k.key}</td><td>{k.product}</td><td className="font-mono text-xs text-muted-foreground">{k.order}</td><td className="text-muted-foreground whitespace-nowrap">{k.expires}</td><td><Status s={k.status} /></td>
            <td className="whitespace-nowrap">{k.status === "unassigned" && <Button size="sm" variant="outline" onClick={() => act(k.id, "active")}>Activate</Button>}{k.status === "active" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act(k.id, "revoked")}>Revoke</Button>}</td></tr>
        ))}
      </Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-popover">
          <DialogHeader><DialogTitle>Import keys</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Product"><select id="key-product" className={inputCls}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Keys (one per line)"><textarea id="key-list" className={cn(inputCls, "h-32 py-2 font-mono text-xs")} placeholder={"XXXXX-XXXXX-XXXXX\nXXXXX-XXXXX-XXXXX"} /></Field>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="hero" onClick={doImport}>Import</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Customers() {
  const { data: customers = [] } = useQuery(adminCustomersQuery);
  const { data: orders = [] } = useQuery(adminOrdersQuery);
  return <Table head={["Customer", "Joined", "Role", "Orders"]}>
    {customers.map((c) => (
      <tr key={c.id}><td className="font-medium">{c.name}</td><td className="text-muted-foreground">{c.joined}</td><td><Pill tone={c.role === "admin" ? "primary" : undefined}>{c.role}</Pill></td><td>{orders.filter((o) => o.customer === c.name).length}</td></tr>
    ))}
  </Table>;
}

function Coupons() {
  const qc = useQueryClient();
  const { data: coupons = [] } = useQuery(adminCouponsQuery);
  const [open, setOpen] = useState(false);
  const create = async () => {
    const code = (document.getElementById("cp-code") as HTMLInputElement)?.value.trim();
    const pct = Number((document.getElementById("cp-pct") as HTMLInputElement)?.value);
    if (!code || !pct) { toast.error("Enter a code and discount %"); return; }
    try {
      await createCoupon(code, pct, null, null);
      toast.success("Coupon created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };
  return <div className="space-y-4"><Button variant="hero" onClick={() => setOpen(true)}><Plus />Create coupon</Button>
    <Table head={["Code", "Discount", "Uses", "Expires", "Status"]}>
      {coupons.map((c) => <tr key={c.id}><td className="font-mono">{c.code}</td><td>{c.percent_off}% off</td><td>{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</td><td className="text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td><td><Status s={c.active ? "active" : "expired"} /></td></tr>)}
    </Table>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-popover">
        <DialogHeader><DialogTitle>Create coupon</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code"><input id="cp-code" className={inputCls} placeholder="JASSU10" /></Field>
          <Field label="Discount %"><input id="cp-pct" type="number" min="1" max="100" className={inputCls} placeholder="10" /></Field>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="hero" onClick={create}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function Analytics() {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useQuery(adminOrdersQuery);
  const revenue = orders.filter((o) => o.pay === "paid").reduce((s, o) => s + o.total, 0);
  const maxSales = Math.max(1, ...products.map((x) => x.sales));
  const totalSales = Math.max(1, products.reduce((s, x) => s + x.sales, 0));
  return <div className="grid gap-6 xl:grid-cols-2">
    <Card><h2 className="font-semibold mb-4">Revenue</h2><p className="font-display text-4xl font-semibold">{money(revenue)}</p><p className="mt-1 text-sm text-muted-foreground">{orders.filter((o) => o.pay === "paid").length} paid orders</p></Card>
    <Card><h2 className="font-semibold mb-4">Top products</h2><ul className="space-y-4">{[...products].sort((a, b) => b.sales - a.sales).slice(0, 5).map((p) => (
      <li key={p.slug}><div className="flex justify-between text-sm"><span>{p.name}</span><span className="text-muted-foreground">{p.sales.toLocaleString()}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-primary" style={{ width: `${(p.sales / maxSales) * 100}%` }} /></div></li>
    ))}</ul></Card>
    <Card><h2 className="font-semibold mb-4">Sales by platform</h2><div className="grid grid-cols-3 gap-3 text-center">{PLATFORMS.map((p) => <div key={p.id}><p className="font-display text-2xl font-semibold">{Math.round((products.filter((x) => x.platform === p.id).reduce((s, x) => s + x.sales, 0) / totalSales) * 100)}%</p><p className="text-xs text-muted-foreground">{p.label}</p></div>)}</div></Card>
  </div>;
}

function SettingsSec() {
  const { data: settings } = useQuery(settingsQuery);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const g = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? "";
    const s: StoreSettings = {
      store_name: g("set-name") || "Jassu Cheats",
      currency: g("set-currency") || "USD",
      fee_rate: Number(g("set-fee") || 5) / 100,
      maintenance_mode: (document.getElementById("set-maint") as HTMLInputElement)?.checked ?? false,
      support_email: g("set-email") || null,
      discord_invite: g("set-discord") || null,
      auto_reply: g("set-reply") || null,
    };
    setSaving(true);
    try {
      await saveSettings(s);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return <div className="grid gap-6 xl:grid-cols-2">
    <Card className="space-y-4"><h2 className="font-semibold">Store settings</h2><Field label="Store name"><input id="set-name" className={inputCls} defaultValue={settings?.store_name ?? "Jassu Cheats"} /></Field><Field label="Currency"><select id="set-currency" className={inputCls} defaultValue={settings?.currency ?? "USD"}><option>USD</option><option>INR</option><option>BRL</option></select></Field><Field label="Tax / fee rate (%)"><input id="set-fee" type="number" step="0.1" className={inputCls} defaultValue={String((settings?.fee_rate ?? 0.05) * 100)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input id="set-maint" type="checkbox" defaultChecked={settings?.maintenance_mode ?? false} className="accent-primary" />Maintenance mode</label><Button variant="hero" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button></Card>
    <Card className="space-y-4"><h2 className="font-semibold">Support settings</h2><Field label="Support email"><input id="set-email" className={inputCls} defaultValue={settings?.support_email ?? "support@jassucheats.store"} placeholder="support@yourstore.com" /></Field><Field label="Discord invite URL"><input id="set-discord" className={inputCls} defaultValue={settings?.discord_invite ?? "https://discord.gg/DARKJVGGY"} placeholder="https://discord.gg/..." /></Field><Field label="Auto-reply message"><textarea id="set-reply" className={cn(inputCls, "h-24 py-2")} defaultValue={settings?.auto_reply ?? "Thanks for reaching out — we'll reply within a few hours."} /></Field><Button variant="hero" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button></Card>
  </div>;
}
