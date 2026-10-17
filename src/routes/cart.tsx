import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Shell, ProductArt, Pill } from "@/components/site";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money, platformLabel } from "@/lib/data";
import { useProducts } from "@/lib/db";
import { seo } from "@/lib/seo";
import { Summary, FEE_RATE } from "@/components/summary";

export const Route = createFileRoute("/cart")({
  head: () => seo("Your Cart", "Review the addons in your Jassu Cheats cart before checkout."),
  component: Cart,
});


function Cart() {
  const { items, remove } = useCart();
  const { data: products = [] } = useProducts();
  const cartProducts = items.map((s) => products.find((p) => p.slug === s)).filter((p) => p !== undefined);
  const subtotal = cartProducts.reduce((s, p) => s + p.price, 0);
  const fee = subtotal * FEE_RATE;
  return (
    <Shell>
      <div className="container-x py-12">
        <h1 className="text-3xl md:text-4xl font-semibold">Cart</h1>
        {items.length === 0 ? (
          <div className="surface mt-8 grid place-items-center py-24 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find something great in the store.</p>
            <Button variant="hero" className="mt-6" asChild><Link to="/store">Browse store</Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <ul className="surface divide-y">
              {cartProducts.map((p) => (
                <li key={p.slug} className="flex items-center gap-4 p-5">
                  <ProductArt p={p} className="h-20 w-24 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="font-medium hover:underline truncate block">{p.name}</Link>
                    <div className="mt-1 flex gap-2"><Pill>{platformLabel(p.platform)}</Pill><Pill tone="primary">v{p.version}</Pill></div>
                  </div>
                  <span className="font-display font-semibold">{money(p.price)}</span>
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(p.slug)}><Trash2 /></Button>
                </li>
              ))}
            </ul>
            <Summary subtotal={subtotal} fee={fee}>
              <Button variant="hero" size="lg" className="w-full" asChild><Link to="/checkout">Checkout <ArrowRight /></Link></Button>
            </Summary>
          </div>
        )}
      </div>
    </Shell>
  );
}
