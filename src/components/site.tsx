import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Search, ShoppingBag, User, Shield, Menu, X, Monitor, Apple, Boxes, MessageCircle, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { platformLabel, money, type Product, type Platform } from "@/lib/data";
import { consumeMorph } from "@/lib/morph";
import { cn } from "@/lib/utils";
import { AccountCard } from "@/components/account-card";
import logoAsset from "@/assets/jassu-logo.png.asset.json";

export const platformIcon = (p: Platform) => ({ pc: Monitor, ios: Apple, other: Boxes })[p];

export function Logo() {
  return (
    <Link to="/" className="flex items-center shrink-0" aria-label="Jassu Cheats home">
      <img src={logoAsset.url} alt="Jassu Cheats" className="h-11 w-auto" />
    </Link>
  );
}

const NAV = [
  { label: "Store", platform: undefined },
  { label: "PC", platform: "pc" },
  { label: "iOS", platform: "ios" },
] as const;

/** Secondary pages reachable from the header on every screen size. */
const INFO = [
  { group: "Company", items: [{ to: "/about", label: "About" }, { to: "/contact", label: "Contact" }, { to: "/faq", label: "FAQ" }] },
  { group: "Legal", items: [{ to: "/terms", label: "Terms" }, { to: "/privacy", label: "Privacy" }, { to: "/refund", label: "Refunds" }] },
] as const;

export function Header() {
  const { items } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center gap-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link key={n.label} to="/store" search={n.platform ? { platform: n.platform } : {}}
              className="nav-link rounded-md px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary-glow">
              {n.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="nav-link group/info flex items-center gap-1 rounded-md px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-primary-glow">
              More
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/info:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              {INFO.map((g, gi) => (
                <Fragment key={g.group}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{g.group}</DropdownMenuLabel>
                  {g.items.map((i) => (
                    <DropdownMenuItem asChild key={i.label}>
                      <Link to={i.to}>{i.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <form className="ml-auto hidden lg:flex items-center gap-2 rounded-lg border bg-surface px-3 h-10 w-72 focus-within:ring-1 focus-within:ring-ring"
          onSubmit={(e) => { e.preventDefault(); nav({ to: "/store", search: { q } }); }}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search addons…" aria-label="Search"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </form>
        <div className="ml-auto lg:ml-0 flex items-center gap-1">
          {isAdmin && <Button variant="ghost" size="icon" asChild aria-label="Admin panel"><Link to="/admin"><Shield /></Link></Button>}
          <Button variant="ghost" size="icon" asChild aria-label="Account"><Link to="/account"><User /></Link></Button>
          <Button variant="ghost" size="icon" asChild aria-label="Cart">
            <Link to="/cart" className="relative">
              <ShoppingBag />
              {items.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{items.length}</span>}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} aria-controls="mobile-navigation"><span key={String(open)} className="menu-icon">{open ? <X /> : <Menu />}</span></Button>
        </div>
      </div>
        <div id="mobile-navigation" className="mobile-navigation md:hidden bg-background" data-open={open} inert={!open}>
          <div className="overflow-hidden min-h-0">
          <div className="container-x py-4 grid gap-1 border-t">
            {NAV.map((n) => (
              <Link key={n.label} to="/store" search={n.platform ? { platform: n.platform } : {}} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface">{n.label}</Link>
            ))}
            {INFO.map((g, gi) => (
              <Fragment key={g.group}>
                <p className={cn("eyebrow px-3 pt-4", gi === 0 && "pt-2")}>{g.group}</p>
                {g.items.map((i) => (
                  <Link key={i.label} to={i.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface">{i.label}</Link>
                ))}
              </Fragment>
            ))}
            {user ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface">My account</Link>
                {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface">Admin panel</Link>}
                <Button variant="ghost" onClick={() => { setOpen(false); void signOut(); }} className="justify-start px-3 py-3 text-sm">Sign out</Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface">Sign in</Link>
            )}
          </div>
          </div>
        </div>
    </header>
  );
}

export function Footer() {
  const cols = [
    { t: "Shop", l: [["/store", "All products"], ["/store", "Latest releases"], ["/cart", "Cart"]] },
    { t: "Support", l: [["/contact", "Contact"], ["/faq", "FAQ"], ["/account", "My keys"]] },
    { t: "Company", l: [["/about", "About"], ["/maintenance", "Status"]] },
    { t: "Legal", l: [["/terms", "Terms"], ["/privacy", "Privacy"], ["/refund", "Refunds"]] },
  ] as const;
  return (
    <footer className="mt-24 border-t">
      <div className="container-x grid gap-10 py-14 md:grid-cols-6">
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">Premium, independently made addons. Instant delivery, latest versions only, real human support.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <p className="eyebrow mb-4">{c.t}</p>
            <ul className="space-y-2.5">
              {c.l.map(([to, label]) => <li key={label}><Link to={to} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="container-x py-6 text-xs text-muted-foreground">© 2026 Jassu Cheats. Independent store — not affiliated with, endorsed by, or sponsored by Garena or Free Fire.</p>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (<><Header /><main className="min-h-[60vh]"><MorphReveal>{children}</MorphReveal></main><Footer /><AccountCard /></>);
}

/** Plays the settle-in animation after a full-page morph transition. */
export function MorphReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (consumeMorph(140) && ref.current) {
      ref.current.animate(
        [{ opacity: 0.45, transform: "translateY(16px) scale(0.99)" }, { opacity: 1, transform: "none" }],
        { duration: 480, easing: "cubic-bezier(0.22, 0.9, 0.26, 1)" },
      );
    }
  }, []);
  return <div ref={ref}>{children}</div>;
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={cn("transition-all duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0", className)}>
      {children}
    </div>
  );
}

export function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <section className="relative overflow-hidden border-b grid-lines">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="container-x relative py-14 md:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold uppercase tracking-tight animate-rise">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl text-muted-foreground">{sub}</p>}
      </div>
    </section>
  );
}

export function ProductArt({ p, className }: { p: Product; className?: string }) {
  const Icon = platformIcon(p.platform);
  const h = 25 + (p.hue % 55);
  return (
    <div className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: `oklch(0.16 0.03 ${h})`, backgroundImage: `radial-gradient(circle at 30% 20%, oklch(0.62 0.2 ${h} / 0.5), transparent 55%), radial-gradient(circle at 80% 90%, oklch(0.55 0.19 ${h + 20} / 0.35), transparent 50%)` }}>
      <div className="absolute inset-0 grid-lines" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/70 to-transparent" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-background/30 backdrop-blur">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-widest text-foreground/60">{p.name.toUpperCase()}</span>
    </div>
  );
}

type Tone = "success" | "warning" | "danger" | "info" | "primary" | "neutral";
const toneCls: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
  primary: "bg-primary/15 text-primary-glow border-primary/30",
  neutral: "bg-muted text-muted-foreground border-border",
};
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", toneCls[tone])}>{children}</span>;
}

const STATUS: Record<string, [Tone, string]> = {
  paid: ["success", "Paid"], pending: ["warning", "Pending"], failed: ["danger", "Failed"], refunded: ["neutral", "Refunded"],
  active: ["success", "Active"], expired: ["neutral", "Expired"], unavailable: ["danger", "Unavailable"], revoked: ["danger", "Revoked"], unassigned: ["info", "Unassigned"],
  in: ["success", "In stock"], low: ["warning", "Low stock"], out: ["danger", "Out of stock"], current: ["primary", "Current"], archived: ["neutral", "Archived"],
};
export function Status({ s }: { s: string }) {
  const [tone, label] = STATUS[s] ?? ["neutral", s];
  return <Pill tone={tone}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</Pill>;
}

export function ProductCard({ p }: { p: Product }) {
  const Icon = platformIcon(p.platform);
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }}
      className="group surface panel-hover panel-corners overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
      <ProductArt p={p} className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.03]" />
      <div className="glow-line opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Pill tone="primary">v{p.version} · Latest</Pill>
          {p.stock !== "in" && <Status s={p.stock} />}
        </div>
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide truncate">{p.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.tagline}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{platformLabel(p.platform)}<Star className="ml-2 h-3 w-3 fill-warning text-warning" />{p.rating}</span>
          <span className="font-display text-lg font-bold text-primary-glow">{money(p.price)}</span>
        </div>
      </div>
    </Link>
  );
}

export function DiscordCTA() {
  return (
    <section className="container-x mt-24">
      <div className="surface panel-corners relative overflow-hidden p-8 md:p-12">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <p className="eyebrow">Community</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Join us on Discord</h2>
            <p className="mt-2 text-muted-foreground max-w-lg">Release announcements, setup help and live support from our team.</p>
          </div>
          <Button variant="hero" size="lg"><MessageCircle />Join Discord</Button>
        </div>
      </div>
    </section>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export const inputCls = "h-11 w-full rounded-lg border bg-surface px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-ring aria-[invalid=true]:border-destructive";
