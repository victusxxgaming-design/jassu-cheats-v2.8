import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Monitor, Apple, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell, DiscordCTA, Pill, Reveal } from "@/components/site";
import { type Platform } from "@/lib/data";
import { useProducts } from "@/lib/db";
import { morphToPage } from "@/lib/morph";
import { seo } from "@/lib/seo";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => seo("Premium Game Addons", "Jassu Cheats is a premium marketplace for independently made game addons — latest versions only, instant delivery."),
  component: Index,
});

const LOOKING: { id: Platform; title: string; blurb: string; icon: typeof Monitor }[] = [
  { id: "pc", title: "PC Panel", blurb: "Emulator and desktop overlays, keymaps and HUD packs.", icon: Monitor },
  { id: "ios", title: "iOS Panel", blurb: "iPhone and iPad interface themes, tuned for touch.", icon: Apple },
  { id: "other", title: "Others", blurb: "Audio packs, crosshair labs, tools and utilities.", icon: Boxes },
];

function Index() {
  const nav = useNavigate();
  const { data: products = [] } = useProducts();
  return (
    <Shell>
      <section className="relative overflow-hidden border-b">
        <img src={hero} alt="" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover opacity-80 md:object-[70%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
        <div className="absolute inset-0 bg-embers" />
        <div className="container-x relative py-20 md:py-36 animate-rise">
          <Pill tone="primary"><Sparkles className="h-3 w-3" />Free Fire season drop · 8 new panels</Pill>
          <h1 className="mt-6 max-w-2xl text-4xl sm:text-5xl md:text-7xl font-bold uppercase leading-[0.95] tracking-tight">
            Booyah-ready panels,<br /><span className="text-gradient">built for survivors.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">HUDs, sensitivity suites and visual packs for PC and iOS. Always the latest version, delivered instantly.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild><Link to="/store">Shop now <ArrowRight /></Link></Button>
            <Button variant="outline" size="lg" asChild><Link to="/about">How it works</Link></Button>
          </div>
          <div className="mt-14 inline-flex flex-wrap gap-6 sm:gap-10 rounded-xl border bg-background/50 px-6 py-4 text-sm backdrop-blur">
            {[["<1 min", "Delivery"]].map(([a, b]) => (
              <div key={b}><p className="font-display text-2xl font-bold">{a}</p><p className="text-muted-foreground">{b}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x mt-20 md:mt-28">
        <Reveal className="text-center">
          <p className="eyebrow">Choose your loadout</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold uppercase tracking-tight">What are you <span className="text-gradient">looking for?</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Tell us what you play on — we'll take you straight to the panels built for it.</p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {LOOKING.map((o, i) => {
            const Icon = o.icon;
            const count = products.filter((p) => p.platform === o.id).length;
            return (
              <Reveal key={o.id} delay={i * 110} className="h-full">
                <Link to="/store" search={{ platform: o.id }} data-morph-skip
                  onClick={(e) => {
                    e.preventDefault();
                    morphToPage(e.currentTarget, o.title, () => nav({ to: "/store", search: { platform: o.id } }));
                  }}
                  className="group surface panel-hover panel-corners relative flex h-full flex-col overflow-hidden p-7">
                  <span className="absolute inset-0 bg-hero-glow opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute inset-0 grid-lines opacity-70" />
                  <span className="relative flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-background/40 backdrop-blur transition-colors group-hover:border-primary/50">
                      <Icon className="h-6 w-6 text-primary-glow" />
                    </span>
                    <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                  </span>
                  <h3 className="relative mt-8 font-display text-2xl font-bold uppercase tracking-wide">{o.title}</h3>
                  <p className="relative mt-2 text-sm text-muted-foreground">{o.blurb}</p>
                  <span className="relative mt-auto flex items-center justify-between gap-3 border-t pt-5">
                    <span className="text-xs text-muted-foreground">{count} panels</span>
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wider text-primary-glow">
                      Browse <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </span>
                  <span className="glow-line absolute inset-x-0 bottom-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <DiscordCTA />
    </Shell>
  );
}
