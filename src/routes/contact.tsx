import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

const EMAIL = "support@jassucheats.store";
const DISCORD = "https://discord.gg/DARKJVGGY";
const sub = `Email ${EMAIL} or join our Discord. Average reply time: 2 hours.`;

export const Route = createFileRoute("/contact")({
  head: () => seo("We're here to help", sub),
  component: () => (
    <Shell>
      <PageHero eyebrow="Contact & Support" title="We're here to help" sub={sub} />
      <section className="mx-auto flex max-w-3xl flex-wrap gap-3 px-5 py-12">
        <Button asChild variant="hero"><a href={`mailto:${EMAIL}`}>Email {EMAIL}</a></Button>
        <Button asChild variant="outline"><a href={DISCORD} target="_blank" rel="noreferrer">Join our Discord</a></Button>
      </section>
    </Shell>
  ),
});
