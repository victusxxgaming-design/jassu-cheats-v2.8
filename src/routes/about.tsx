import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About the store", "Jassu Cheats is an independent studio crafting polished game addons. Not affiliated with Garena or Free Fire."),
  component: () => (
    <Shell>
      <PageHero eyebrow="About" title="About the store" sub="Jassu Cheats is an independent studio crafting polished game addons. Not affiliated with Garena or Free Fire." />
    </Shell>
  ),
});
