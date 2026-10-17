import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, ShoppingBag, ShieldCheck, Zap, MessageCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Shell, ProductArt, ProductCard, Pill, Status, platformIcon } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { platformLabel, money, FAQS } from "@/lib/data";
import { productQuery, productsQuery } from "@/lib/db";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { p };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.p.name} — Jassu Cheats` : "Product — Jassu Cheats";
    const d = loaderData ? loaderData.p.tagline : "Product details";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: ProductPage,
});

function ProductPage() {
  const { p } = Route.useLoaderData();
  const { data: all = [] } = useSuspenseQuery(productsQuery);
  const { add, items } = useCart();
  const nav = useNavigate();
  const [img, setImg] = useState(0);
  const Icon = platformIcon(p.platform);
  const inCart = items.includes(p.slug);
  const related = all.filter((x) => x.slug !== p.slug && x.platform === p.platform).slice(0, 4);
  const hues = [0, 40, -40, 80];

  return (
    <Shell>
      <div className="container-x py-8">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
          <Link to="/store" className="hover:text-foreground">Store</Link><ChevronRight className="h-3 w-3" />
          <Link to="/store" search={{ platform: p.platform }} className="hover:text-foreground">{platformLabel(p.platform)}</Link><ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{p.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <ProductArt p={{ ...p, hue: p.hue + hues[img] }} className="aspect-[16/11] rounded-2xl border" />
            <div className="grid grid-cols-4 gap-3">
              {hues.map((h, i) => (
                <button key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={cn("rounded-xl border overflow-hidden transition", img === i ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100")}>
                  <ProductArt p={{ ...p, hue: p.hue + h }} className="aspect-[4/3]" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-2"><Pill tone="primary">v{p.version} · Latest</Pill><Status s={p.stock} /></div>
            <h1 className="mt-4 text-3xl md:text-4xl font-semibold">{p.name}</h1>
            <p className="mt-3 text-muted-foreground">{p.tagline}</p>
            <p className="mt-6 font-display text-4xl font-semibold">{money(p.price)}</p>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
              {[["Platform", <span key="a" className="flex items-center gap-1.5"><Icon className="h-4 w-4" />{platformLabel(p.platform)}</span>], ["Version", `v${p.version}`], ["Released", p.released]].map(([k, v]) => (
                <div key={k as string} className="surface p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-8 flex gap-3">
              <Button variant="hero" size="lg" className="flex-1" disabled={p.stock === "out"}
                onClick={() => { add(p.slug); nav({ to: "/cart" }); }}>
                {p.stock === "out" ? "Out of stock" : <><Zap />Buy now</>}
              </Button>
              <Button variant="outline" size="lg" disabled={p.stock === "out" || inCart} onClick={() => { add(p.slug); toast.success(`${p.name} added to cart`); }}>
                <ShoppingBag />{inCart ? "In cart" : "Add to cart"}
              </Button>
            </div>
            <ul className="mt-8 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><Zap className="h-4 w-4 text-primary-glow" />Instant key & download after payment</li>
              <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-primary-glow" />Free updates to future versions for 12 months</li>
              <li className="flex gap-2"><MessageCircle className="h-4 w-4 text-primary-glow" />Setup support via ticket or Discord</li>
            </ul>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-16">
          <TabsList className="bg-surface border h-11">
            {["overview", "requirements", "install", "release"].map((t) => <TabsTrigger key={t} value={t} className="capitalize px-4">{t === "release" ? "Release notes" : t === "install" ? "Installation" : t}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="overview" className="surface p-8 mt-4">
            <p className="text-muted-foreground max-w-2xl">{p.description || `${p.name} is built for players who want a polished, reliable setup. Every release is tested on current devices and only the latest stable build is distributed.`}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">{p.features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-success" />{f}</li>)}</ul>
          </TabsContent>
          <TabsContent value="requirements" className="surface p-8 mt-4 grid gap-4 sm:grid-cols-3 text-sm">
            {[["OS", p.platform === "ios" ? "iOS 17+" : "Windows 10/11 64-bit"], ["Storage", "120 MB free"], ["Memory", "4 GB RAM recommended"]].map(([k, v]) => <div key={k}><p className="text-muted-foreground">{k}</p><p className="mt-1 font-medium">{v}</p></div>)}
          </TabsContent>
          <TabsContent value="install" className="surface p-8 mt-4">
            <ol className="space-y-4 text-sm">{["Complete checkout and open your order page.", "Copy your activation key.", "Download the latest package from the order page.", "Run the installer and paste your key when prompted."].map((s, i) => (
              <li key={i} className="flex gap-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-xs text-primary-glow">{i + 1}</span><span className="pt-1">{s}</span></li>
            ))}</ol>
          </TabsContent>
          <TabsContent value="release" className="surface p-8 mt-4">
            <div className="flex items-center gap-3"><span className="font-mono text-primary-glow">v{p.version}</span><Status s="current" /><span className="text-xs text-muted-foreground">{p.released}</span></div>
            <ul className="mt-4 list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">{p.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </TabsContent>
        </Tabs>

        <section className="mt-16 grid gap-8 md:grid-cols-[1fr_2fr]">
          <div><h2 className="text-2xl font-semibold">Product FAQ</h2><p className="mt-2 text-sm text-muted-foreground">Still stuck? <Link to="/contact" className="text-primary-glow hover:underline">Contact support</Link>.</p></div>
          <Accordion type="single" collapsible className="surface px-6">{FAQS.slice(0, 3).map((f, i) => <AccordionItem key={i} value={`${i}`}><AccordionTrigger>{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>)}</Accordion>
        </section>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-semibold mb-6">You may also like</h2>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div>
          </section>
        )}
      </div>
    </Shell>
  );
}
