import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Wallet, Smartphone, Bitcoin, Loader2, Clock, XCircle, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Shell, Field, inputCls } from "@/components/site";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/data";
import { createOrder, useProducts, validateCoupon } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Summary, FEE_RATE } from "@/components/summary";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/checkout")({
  head: () => seo("Checkout", "Secure checkout for your Jassu Cheats order."),
  component: () => (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  ),
});

const METHODS = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "paypal", label: "PayPal", icon: Wallet },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
];
type Stage = "form" | "processing" | "pending" | "failed" | "success";

function Checkout() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const cartProducts = items.map((s) => products.find((p) => p.slug === s)).filter((p) => p !== undefined);
  const subtotal = cartProducts.reduce((s, p) => s + p.price, 0);
  const nav = useNavigate();
  const [method, setMethod] = useState("card");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeMsg, setCodeMsg] = useState<string>();
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [country, setCountry] = useState("India");
  const [discord, setDiscord] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<Stage>("form");
  const fee = (subtotal - discount) * FEE_RATE;

  const apply = async () => {
    if (!code.trim()) return;
    try {
      const c = await validateCoupon(code);
      if (c) {
        setDiscount(subtotal * (c.percent_off / 100));
        setAppliedCode(c.code);
        setCodeMsg(`${c.code} applied — ${c.percent_off}% off`);
      } else {
        setDiscount(0);
        setAppliedCode(null);
        setCodeMsg("That code isn't valid or has expired.");
      }
    } catch {
      setCodeMsg("Couldn't check that code right now.");
    }
  };

  const pay = async (outcome: "success" | "pending" | "failed") => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (!agree) e.agree = "Please accept the terms";
    setErrors(e);
    if (Object.keys(e).length || !user) return;
    setStage("processing");
    try {
      const orderNumber = await createOrder({
        userId: user.id,
        email,
        fullName: name,
        country,
        discord,
        method,
        couponCode: appliedCode,
        items: cartProducts,
        subtotal,
        discount,
        fee,
        total: Math.max(0, subtotal - discount + fee),
        outcome,
      });
      if (outcome === "success") {
        clear();
        nav({ to: "/order/$id", params: { id: orderNumber }, search: { state: "success" } });
      } else if (outcome === "pending") {
        clear();
        nav({ to: "/order/$id", params: { id: orderNumber }, search: { state: "pending" } });
      } else {
        setStage("failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't place the order");
      setStage("form");
    }
  };

  if (items.length === 0 && stage === "form") return (
    <Shell><div className="container-x py-24 text-center"><h1 className="text-2xl font-semibold">Nothing to check out</h1><Button variant="hero" className="mt-6" asChild><Link to="/store">Browse store</Link></Button></div></Shell>
  );

  if (stage !== "form") return <Shell><StateScreen stage={stage} onRetry={() => setStage("form")} /></Shell>;

  return (
    <Shell>
      <div className="container-x py-12">
        <h1 className="text-3xl md:text-4xl font-semibold">Checkout</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="surface p-6 space-y-4">
              <h2 className="font-semibold">Your details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" /></Field>
                <Field label="Email (keys are sent here)" error={errors.email}><input aria-invalid={!!errors.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
                <Field label="Country"><select className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)}><option>India</option><option>United States</option><option>Brazil</option><option>Indonesia</option></select></Field>
                <Field label="Discord (optional)"><input className={inputCls} value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username" /></Field>
              </div>
            </section>
            <section className="surface p-6 space-y-4">
              <h2 className="font-semibold">Payment method</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {METHODS.map((m) => (
                  <button key={m.id} onClick={() => setMethod(m.id)} className={cn("surface flex flex-col items-center gap-2 py-4 text-sm transition", method === m.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/30")}>
                    <m.icon className="h-5 w-5" />{m.label}
                  </button>
                ))}
              </div>
              {method === "card" && <div className="grid gap-4 sm:grid-cols-3"><div className="sm:col-span-3"><Field label="Card number"><input className={inputCls} placeholder="4242 4242 4242 4242" /></Field></div><Field label="Expiry"><input className={inputCls} placeholder="MM / YY" /></Field><Field label="CVC"><input className={inputCls} placeholder="123" /></Field></div>}
              {method !== "card" && <p className="text-sm text-muted-foreground">You'll be redirected to complete payment with {METHODS.find((m) => m.id === method)!.label}.</p>}
            </section>
            <section className="surface p-6 space-y-3">
              <h2 className="font-semibold">Discount code</h2>
              <div className="flex gap-2"><input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" /><Button variant="outline" className="h-11" onClick={apply}>Apply</Button></div>
              {codeMsg && <p className={cn("text-xs", discount ? "text-success" : "text-destructive")}>{codeMsg}</p>}
            </section>
          </div>
          <Summary subtotal={subtotal} fee={fee} discount={discount}>
            <ul className="text-sm space-y-1 border-t pt-3">{cartProducts.map((p) => <li key={p.slug} className="flex justify-between text-muted-foreground"><span className="truncate">{p.name}</span><span>{money(p.price)}</span></li>)}</ul>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-primary" />
              <span>I agree to the <Link to="/terms" className="text-primary-glow hover:underline">Terms</Link> and <Link to="/refund" className="text-primary-glow hover:underline">Refund Policy</Link>.</span>
            </label>
            {errors.agree && <p className="text-xs text-destructive">{errors.agree}</p>}
            <Button variant="hero" size="lg" className="w-full" onClick={() => pay("success")}><Lock />Pay {money(Math.max(0, subtotal - discount + fee))}</Button>
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-2">
              <p>Prototype: simulate other outcomes</p>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => pay("pending")}>Pending</Button><Button size="sm" variant="outline" onClick={() => pay("failed")}>Failed</Button></div>
            </div>
          </Summary>
        </div>
      </div>
    </Shell>
  );
}

function StateScreen({ stage, onRetry }: { stage: Stage; onRetry: () => void }) {
  const cfg = {
    processing: [Loader2, "Processing payment…", "Please don't close this window. This usually takes a few seconds.", "text-primary-glow animate-spin"],
    pending: [Clock, "Payment pending", "Your payment is awaiting confirmation from the provider. We'll email your key as soon as it clears.", "text-warning"],
    failed: [XCircle, "Payment failed", "Your payment was declined. No money was taken — try again or choose another method.", "text-destructive"],
    success: [CheckCircle2, "Payment successful", "", "text-success"],
    form: [CheckCircle2, "", "", ""],
  } as const;
  const [Icon, t, d, cls] = cfg[stage];
  return (
    <div className="container-x grid place-items-center py-28">
      <div className="surface max-w-md w-full p-10 text-center">
        <Icon className={cn("mx-auto h-12 w-12", cls)} />
        <h1 className="mt-5 text-2xl font-semibold">{t}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{d}</p>
        {stage === "failed" && <Button variant="hero" className="mt-8" onClick={onRetry}>Try again</Button>}
        {stage === "pending" && <div className="mt-8 flex justify-center gap-2"><Button variant="outline" asChild><Link to="/account">Go to dashboard</Link></Button></div>}
      </div>
    </div>
  );
}
