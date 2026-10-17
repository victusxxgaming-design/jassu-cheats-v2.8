import { useEffect, useRef, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { consumeMorph, morphLabel, morphToPage } from "@/lib/morph";

const PAGE_NAMES: Record<string, string> = { "/": "Home", "/store": "Store", "/cart": "Cart", "/account": "Account", "/login": "Sign in", "/admin": "Admin" };

function morphTitle(link: HTMLAnchorElement, url: URL): string {
  const own = link.dataset.morphTitle || link.getAttribute("aria-label") || link.textContent?.trim().split("\n")[0];
  if (own && own.length <= 32) return own;
  if (PAGE_NAMES[url.pathname]) return PAGE_NAMES[url.pathname];
  const last = url.pathname.split("/").filter(Boolean).pop() ?? "Home";
  return last.replace(/[-_]/g, " ");
}

/** Enhances live content without delaying navigation or remounting forms. */
export function SiteMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.resolvedLocation?.href });

  // Every internal link click grows the clicked element into a full-screen curtain, then navigates.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.hasAttribute("data-morph-skip") || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const href = url.pathname + url.search + url.hash;
      if (href === window.location.pathname + window.location.search + window.location.hash) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      event.preventDefault();
      const origin = (link.closest("[role='menuitem']") as HTMLElement | null) ?? link;
      morphToPage(origin, morphLabel(morphTitle(link, url)), () => { void router.navigate({ href }); }, "Loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Lift the curtain once the new page has rendered.
  useEffect(() => { consumeMorph(140); }, [location]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    const animate = (target: Element, delay = 0) => {
      if (typeof target.animate !== "function") return;
      const animation = target.animate(
        [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 420, delay, easing: "cubic-bezier(.22,1,.36,1)" },
      );
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    };
    const scan = () => {
      if (!observer) return;
      el.querySelectorAll("main section, main .surface, main form, [role='tabpanel'], .auth-content > *").forEach((target) => {
        if (seen.has(target)) return;
        seen.add(target);
        observer?.observe(target);
      });
    };
    const stop = () => {
      observer?.disconnect();
      mutations?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const start = () => {
      stop();
      if (typeof IntersectionObserver === "undefined") return;
      observer = new IntersectionObserver((entries) => {
        let stagger = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          animate(entry.target, Math.min(stagger++ * 45, 180));
        });
      }, { threshold: 0.05 });
      scan();
      mutations = new MutationObserver(scan);
      mutations.observe(el, { childList: true, subtree: true });
    };
    start();
    return stop;
  }, [location]);
  return (
    <div ref={root} className="site-motion">
      {children}
    </div>
  );
}