import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronUp, LogOut, ShoppingBag, User, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** Small floating account card pinned to the bottom-left. Collapsed shows the
 *  signed-in user; clicking it opens essential options including sign-out. */
export function AccountCard() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const name = profile?.display_name || user.email?.split("@")[0] || "Account";
  const email = user.email ?? "";
  const initial = name.charAt(0).toUpperCase();

  const go = (to: string, search?: Record<string, unknown>) => {
    setOpen(false);
    nav({ to, search });
  };

  return (
    <div ref={rootRef} className="account-card fixed bottom-4 left-4 z-50 print:hidden">
      {open && (
        <div className="w-64 rounded-lg border border-border/70 bg-surface p-1.5" role="menu">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground">{initial}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
          </div>
          <div className="my-1 border-t" />
          <button onClick={() => go("/account")} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted" role="menuitem">
            <User className="h-4 w-4 text-muted-foreground" /> My account
          </button>
          <button onClick={() => go("/cart")} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted" role="menuitem">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" /> Cart
          </button>
          <button onClick={() => go("/account")} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted" role="menuitem">
            <Wallet className="h-4 w-4 text-muted-foreground" /> My orders & keys
          </button>
          <div className="my-1 border-t" />
          <button
            onClick={() => { setOpen(false); void signOut(); }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account options"
        className={cn(
          "flex w-64 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-border/70 bg-surface px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          open && "border-border",
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground">{initial}</span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
        <ChevronUp className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}
