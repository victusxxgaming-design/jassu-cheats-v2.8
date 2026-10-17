// Full-page "morph" transition: a category card grows into a full-screen
// curtain, the next page loads behind it, then the curtain fades away.

const dims = new WeakMap<HTMLDivElement, HTMLDivElement>();

let curtain: HTMLDivElement | null = null;

let running = false;

export function morphToPage(origin: HTMLElement, title: string, go: () => void, subtitle = "Opening category"): void {
  if (curtain || running) return; // a morph is already running
  if (typeof window === "undefined") { go(); return; }

  running = true;
  const r = origin.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const iconSvg = origin.querySelector("svg")?.outerHTML ?? "";

  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = [
    "position:fixed", "z-index:9990", "pointer-events:none", "overflow:hidden",
    `left:${r.left}px`, `top:${r.top}px`, `width:${r.width}px`, `height:${r.height}px`,
    "border-radius:22px", "box-shadow:0 24px 80px rgb(0 0 0 / 0.55)",
  ].join(";");
  el.innerHTML = `
    <div style="position:absolute;inset:0;background:
      radial-gradient(circle at 22% 18%, color-mix(in oklab, var(--primary) 45%, transparent), transparent 55%),
      radial-gradient(circle at 82% 88%, color-mix(in oklab, var(--primary-glow) 30%, transparent), transparent 55%),
      linear-gradient(165deg, color-mix(in oklab, var(--background) 88%, var(--primary)), var(--background))"></div>
    <div class="grid-lines" style="position:absolute;inset:0;opacity:0.5"></div>
    <div data-morph-content style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;color:var(--foreground)">
      <span style="display:grid;place-items:center;width:76px;height:76px;border-radius:22px;border:1px solid color-mix(in oklab, var(--primary) 45%, transparent);background:color-mix(in oklab, var(--background) 60%, transparent);backdrop-filter:blur(6px)">
        ${iconSvg ? iconSvg.replace("<svg", '<svg style="width:34px;height:34px;color:var(--primary-glow)"') : '<span style="font-family:\'Chakra Petch\',sans-serif;font-weight:700;font-size:1.6rem;color:var(--primary-glow)">JC</span>'}
      </span>
      <span style="font-family:'Chakra Petch',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;font-size:clamp(1.7rem, 4.5vw, 3.2rem);line-height:1.05">${title}</span>
      <span style="font-size:0.75rem;letter-spacing:0.35em;text-transform:uppercase;opacity:0.7">${subtitle}</span>
    </div>`;
  document.body.appendChild(el);

  const dim = document.createElement("div");
  dim.setAttribute("aria-hidden", "true");
  dim.style.cssText = "position:fixed;inset:0;z-index:9980;pointer-events:none;background:#000;opacity:0";
  document.body.appendChild(dim);
  dims.set(el, dim);

  const grow = el.animate(
    [
      { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: "22px" },
      { left: "0px", top: "0px", width: `${vw}px`, height: `${vh}px`, borderRadius: "0px" },
    ],
    { duration: 750, easing: "cubic-bezier(0.22, 0.9, 0.26, 1)", fill: "forwards" },
  );
  dim.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: 420, easing: "ease-out", fill: "forwards" });
  el.querySelector("[data-morph-content]")?.animate(
    [{ transform: "scale(0.92)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
    { duration: 650, easing: "cubic-bezier(0.22, 0.9, 0.26, 1)", fill: "forwards" },
  );

  grow.onfinish = () => {
    // Pin final geometry in case the running animation is cancelled by a repaint
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.width = `${vw}px`;
    el.style.height = `${vh}px`;
    el.style.borderRadius = "0px";
    curtain = el;
    running = false;
    go();
    // Safety valve: never leave the curtain stuck on screen
    window.setTimeout(() => consumeMorph(), 1600);
  };
}

/** Fades out a pending curtain. Returns true when one existed. */
/** Escapes text before it is placed in the curtain markup. */
export function morphLabel(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function consumeMorph(holdMs = 100): boolean {
  const el = curtain;
  if (!el) return false;
  curtain = null;
  const dim = dims.get(el);
  window.setTimeout(() => {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-in", fill: "forwards" }).onfinish =
      () => { el.remove(); dim?.remove(); };
    dim?.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 320, easing: "ease-in", fill: "forwards" });
  }, holdMs);
  return true;
}
