import type { ReactNode } from "react";
import { money } from "@/lib/data";

export const FEE_RATE = 0.05;

export function Summary({ subtotal, fee, discount = 0, children }: { subtotal: number; fee: number; discount?: number; children?: ReactNode }) {
  return (
    <aside className="surface p-6 h-fit space-y-4 lg:sticky lg:top-24">
      <h2 className="font-semibold">Order summary</h2>
      <dl className="space-y-2 text-sm">
        <Row k="Subtotal" v={money(subtotal)} />
        {discount > 0 && <Row k="Discount" v={`−${money(discount)}`} accent />}
        <Row k="Taxes & fees (5%)" v={money(fee)} />
        <div className="border-t pt-3 flex justify-between font-display text-lg font-semibold"><dt>Total</dt><dd>{money(Math.max(0, subtotal - discount + fee))}</dd></div>
      </dl>
      {children}
    </aside>
  );
}
function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className={accent ? "text-success" : ""}>{v}</dd></div>;
}
