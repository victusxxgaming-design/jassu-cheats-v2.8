import { afterEach, expect, it, vi } from "vitest";
import { consumeMorph, morphToPage } from "@/lib/morph";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.replaceChildren();
});

it("animates category navigation even when the device requests reduced motion", () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  const animations: Array<{ onfinish: (() => void) | null }> = [];
  const animate = vi.fn(function (_frames: Keyframe[], _options: KeyframeAnimationOptions) {
    const animation = { onfinish: null as (() => void) | null };
    animations.push(animation);
    return animation;
  });
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
  const origin = document.createElement("a");
  document.body.appendChild(origin);
  const navigate = vi.fn();

  morphToPage(origin, "Store", navigate);

  expect(animate).toHaveBeenCalledTimes(3);
  expect(animate.mock.calls[0]?.[1]).toEqual({
    duration: 750,
    easing: "cubic-bezier(0.22, 0.9, 0.26, 1)",
    fill: "forwards",
  });
  expect(navigate).not.toHaveBeenCalled();
  animations[0]?.onfinish?.();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(consumeMorph(0)).toBe(true);
  vi.runAllTimers();
  animations[3]?.onfinish?.();
});