import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { Shell, PageHero, ProductCard, inputCls } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORMS, type Platform } from "@/lib/data";
import { useProducts } from "@/lib/db";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

type S = { platform?: Platform; q?: string };

export const Route = createFileRoute("/store")({
  validateSearch: (s: Record<string, unknown>): S => ({
    platform: ["pc", "ios", "other"].includes(s.platform as string) ? (s.platform as Platform) : undefined,
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  head: () => seo("Store", "Browse every Jassu Cheats addon for PC, iOS and more. Latest versions only."),
  component: Store,
});

function Store() {
  const { platform, q } = Route.useSearch();
  const nav = Route.useNavigate();
  const [query, setQuery] = useState(q ?? "");
  const [sort, setSort] = useState("popular");
  const [inStock, setInStock] = useState(false);
  const [shown, setShown] = useState(6);
  const { data: products = [], isLoading } = useProducts();

  useEffect(() => setQuery(q ?? ""), [q]);

  const list = useMemo(() => {
    let l = products.filter((p) => p.published && (!platform || p.platform === platform) && (!inStock || p.stock !== "out"));
    if (query) l = l.filter((p) => (p.name + p.tagline).toLowerCase().includes(query.toLowerCase()));
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "popular") l = [...l].sort((a, b) => b.sales - a.sales);
    return l;
  }, [products, platform, query, sort, inStock]);

  const title = platform ? `${PLATFORMS.find((p) => p.id === platform)!.label} addons` : "All addons";
  return (
    <Shell>
      <PageHero eyebrow="Store" title={title} sub="Only the latest version of every product is listed. Updates are included with your purchase." />
      <div className="container-x py-10">
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip active={!platform} onClick={() => nav({ search: (s) => ({ ...s, platform: undefined }) })}>All</Chip>
          {PLATFORMS.map((p) => <Chip key={p.id} active={platform === p.id} onClick={() => nav({ search: (s) => ({ ...s, platform: p.id }) })}>{p.label}</Chip>)}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input className={cn(inputCls, "pl-9")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or feature…" />
          </div>
          <select className={cn(inputCls, "md:w-48")} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="popular">Most popular</option><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
          </select>
          <label className="flex h-11 items-center gap-2 rounded-lg border bg-surface px-3 text-sm cursor-pointer">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-primary" /> Available only
          </label>
        </div>

        {isLoading ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface overflow-hidden"><Skeleton className="aspect-[4/3] rounded-none" /><div className="p-4 space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div></div>
          ))}</div>
        ) : list.length === 0 ? (
          <div className="surface grid place-items-center py-20 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{query ? `No addons match "${query}"` : "No products yet"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{query ? "Try a different search or clear filters." : "Products you add in the admin panel will appear here."}</p>
            {query && <Button variant="outline" className="mt-6" onClick={() => { setQuery(""); setInStock(false); nav({ search: {} }); }}>Clear filters</Button>}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{list.length} products</p>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{list.slice(0, shown).map((p) => <ProductCard key={p.slug} p={p} />)}</div>
            {shown < list.length && <div className="mt-10 text-center"><Button variant="outline" size="lg" onClick={() => setShown(shown + 6)}>Load more</Button></div>}
          </>
        )}
        <p className="mt-10 text-center text-xs text-muted-foreground">Need help choosing? <Link to="/contact" className="text-primary-glow hover:underline">Ask our team</Link></p>
      </div>
    </Shell>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return <button onClick={onClick} className={cn("h-9 rounded-full border px-4 text-sm transition", active ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface")}>{children}</button>;
}
