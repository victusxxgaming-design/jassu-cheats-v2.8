export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Jassu Cheats` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Jassu Cheats` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
