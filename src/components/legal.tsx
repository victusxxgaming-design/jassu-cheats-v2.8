import { Link } from "@tanstack/react-router";

export type LegalSection = { h: string; p: string[] };

export function LegalBody({ updated, sections }: { updated: string; sections: LegalSection[] }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Last updated {updated}</p>
      <div className="mt-8 space-y-10">
        {sections.map((s, i) => (
          <div key={s.h}>
            <h2 className="text-lg font-semibold text-foreground">{i + 1}. {s.h}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {s.p.map((t) => <p key={t}>{t}</p>)}
            </div>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Questions? Reach us through our <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
        </p>
      </div>
    </section>
  );
}
