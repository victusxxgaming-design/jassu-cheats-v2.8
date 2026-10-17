import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Copy, Check, Download, Clock, KeyRound, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Shell, ProductArt, Status, Pill } from "@/components/site";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/data";
import { orderQuery, useProducts } from "@/lib/db";
import { RequireAuth } from "@/components/require-auth";
import { cn } from "@/lib/utils";

type KeyState = "success" | "pending" | "unavailable" | "expired" | "failed";
const STATES: KeyState[] = ["success", "pending", "unavailable", "expired", "failed"];

export const Route = createFileRoute("/order/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ state: (STATES.includes(s.state as KeyState) ? s.state : "success") as KeyState }),
  head: ({ params }) => ({ meta: [{ title: `Order ${params.id} — Jassu Cheats` }, { name: "description", content: "Your order status, activation key and download." }, { property: "og:title", content: `Order ${params.id} — Jassu Cheats` }, { property: "og:description", content: "Order confirmation and activation key." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth>
      <Order />
    </RequireAuth>
  ),
});

function Order() {
  const { id } = Route.useParams();
  const { state } = Route.useSearch();
  const { data: order, isLoading } = useQuery(orderQuery(id));
  const { data: products = [] } = useProducts();
  const [copied, setCopied] = useState(false);

  if (isLoading) return <Shell><div className="container-x py-24 text-center text-muted-foreground">Loading order…</div></Shell>;
  if (!order) return <Shell><div className="container-x py-24 max-w-xl text-center"><h1 className="text-3xl font-semibold">Order not found</h1><p className="mt-2 text-muted-foreground">We couldn't find order {id}.</p><Button className="mt-6" variant="outline" asChild><Link to="/store">Browse the store</Link></Button></div></Shell>;

  const p = products.find((x) => x.slug === order.items[0]);
  const key = order.keyValue ?? "";
  const realState: KeyState = order.payment === "failed" ? "failed" : order.key === "active" ? "success" : order.key === "expired" ? "expired" : order.key === "unavailable" ? "unavailable" : "pending";
  const view = state === "success" && realState !== "success" ? realState : state;
  const copy = async () => { try { await navigator.clipboard.writeText(key); } catch { /* ignore */ } setCopied(true); toast.success("Key copied"); setTimeout(() => setCopied(false), 1800); };
  const payment = view === "pending" ? "pending" : view === "failed" ? "failed" : "paid";

  return (
    <Shell>
      <div className="container-x py-12 max-w-4xl">
        <div className="text-center">
          {view === "success" ? <CheckCircle2 className="mx-auto h-12 w-12 text-success" /> : view === "pending" ? <Clock className="mx-auto h-12 w-12 text-warning" /> : <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />}
          <h1 className="mt-4 text-3xl font-semibold">{view === "success" ? "Thank you — your order is ready" : view === "pending" ? "Order received, awaiting payment" : "There's an issue with this order"}</h1>
          <p className="mt-2 text-muted-foreground">Order <span className="font-mono text-foreground">{id}</span> · {order.date}</p>
        </div>

        {p && (
          <div className="mt-10 surface p-6 flex items-center gap-4">
            <ProductArt p={p} className="h-16 w-20 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1"><p className="font-medium">{p.name}</p><p className="text-sm text-muted-foreground">v{p.version} · {money(p.price)}</p></div>
            <Status s={payment} />
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <KeyCard state={view} k={key} copied={copied} onCopy={copy} />
          <div className="surface p-6">
            <div className="flex items-center gap-2"><Download className="h-5 w-5 text-primary-glow" /><h2 className="font-semibold">Download</h2></div>
            <p className="mt-3 text-sm text-muted-foreground">Latest eligible version</p>
            {p && <div className="mt-2 flex items-center gap-2"><span className="font-mono">{p.name} v{p.version}</span><Status s="current" /></div>}
            <Button className="mt-6 w-full" variant={view === "success" ? "hero" : "outline"} disabled={view !== "success"} onClick={() => toast("Download started (demo)")}>
              <Download />{view === "success" ? "Download installer" : "Available after delivery"}
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center"><Button variant="ghost" asChild><Link to="/account">View order history →</Link></Button></div>
      </div>
    </Shell>
  );
}

function KeyCard({ state, k, copied, onCopy }: { state: KeyState; k: string; copied: boolean; onCopy: () => void }) {
  const msg: Record<KeyState, [typeof KeyRound, string, string]> = {
    success: [KeyRound, "Activation key", ""],
    pending: [Clock, "Key pending", "Your key will appear here once payment is confirmed."],
    unavailable: [AlertTriangle, "Key temporarily unavailable", "Keys for this product are being restocked. You'll be emailed within 2 hours."],
    expired: [XCircle, "Key expired", "This key's license period ended. Renew to receive a new key."],
    failed: [XCircle, "Delivery failed", "We couldn't deliver your key. Our team has been notified — contact support for help."],
  };
  const [Icon, title, d] = msg[state];
  return (
    <div className={cn("surface relative overflow-hidden p-6", state === "success" && "border-primary/40")}>
      {state === "success" && <div className="absolute inset-0 bg-hero-glow opacity-60" />}
      <div className="relative">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary-glow" /><h2 className="font-semibold">{title}</h2></div>
          <Status s={state === "success" ? "active" : state === "failed" ? "unavailable" : state} /></div>
        {state === "success" ? (
          <>
            <div className="mt-5 rounded-lg border bg-background/60 p-4 font-mono text-sm tracking-wider break-all">{k}</div>
            <Button className="mt-4 w-full" variant="outline" onClick={onCopy}>{copied ? <><Check />Copied</> : <><Copy />Copy key</>}</Button>
            <p className="mt-3 text-xs text-muted-foreground"><Pill>License key</Pill> Keep it private.</p>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted-foreground">{d}</p>
            <Button className="mt-6 w-full" variant="outline" asChild><Link to="/contact">{state === "expired" ? "Renew license" : "Contact support"}</Link></Button>
          </>
        )}
      </div>
    </div>
  );
}
