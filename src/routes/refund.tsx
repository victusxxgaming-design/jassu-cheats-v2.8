import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/refund")({
  head: () => seo("Refund Policy", "Refunds are available within 7 days if a key was not delivered or does not work."),
  component: () => (
    <Shell>
      <PageHero eyebrow="Refunds" title="Refund Policy" sub="Refunds are available within 7 days if a key was not delivered or does not work." />
    </Shell>
  ),
});
