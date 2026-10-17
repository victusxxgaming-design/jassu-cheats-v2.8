// Shared types and display helpers. Live data comes from the database via @/lib/db.

export type Platform = "pc" | "ios" | "other";

export const PLATFORMS: { id: Platform; label: string; blurb: string }[] = [
  { id: "pc", label: "PC", blurb: "Emulator & desktop addons" },
  { id: "ios", label: "iOS", blurb: "iPhone & iPad builds" },
  { id: "other", label: "Other", blurb: "Tools, packs & utilities" },
];

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  platform: Platform;
  version: string;
  released: string;
  stock: "in" | "low" | "out";
  hue: number;
  rating: number;
  sales: number;
  features: string[];
  notes: string[];
};

export const platformLabel = (p: Platform) => PLATFORMS.find((x) => x.id === p)!.label;
export const money = (n: number) => `$${n.toFixed(2)}`;

export const FAQS = [
  { q: "How do I receive my purchase?", a: "Right after payment is confirmed, your activation key and the latest download appear on the order page and in your dashboard." },
  { q: "Do I get older versions?", a: "We only ship the latest stable version of each product. Updates within your license period are included." },
  { q: "Which payment methods are supported?", a: "Cards, PayPal, UPI and selected crypto options (shown at checkout)." },
  { q: "Is Jassu Cheats affiliated with the game publisher?", a: "No. Jassu Cheats is an independent store and is not affiliated with, endorsed or sponsored by any game publisher." },
  { q: "What if my key doesn't work?", a: "Open a ticket or reach us on Discord — our team replies within a few hours, every day." },
];

export type Order = { id: string; date: string; items: string[]; total: number; payment: "paid" | "pending" | "failed"; key: "active" | "pending" | "expired" | "unavailable" };
