import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/maintenance")({
  head: () => seo("We'll be right back", "The store is under scheduled maintenance. Your keys and orders are safe."),
  component: () => (
    <Shell>
      <PageHero eyebrow="Status" title="We'll be right back" sub="The store is under scheduled maintenance. Your keys and orders are safe." />
    </Shell>
  ),
});
