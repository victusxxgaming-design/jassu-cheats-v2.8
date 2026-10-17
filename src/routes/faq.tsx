import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHero } from "@/components/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => seo("Frequently asked questions", "Answers about delivery, versions, payments and keys."),
  component: () => (
    <Shell>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" sub="Answers about delivery, versions, payments and keys." />
    </Shell>
  ),
});
