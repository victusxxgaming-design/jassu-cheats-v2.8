import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { email: "player@jassu.gg" },
    profile: { display_name: "Player", avatar_url: null, role: "customer" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children?: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

import { AccountCard } from "@/components/account-card";

describe("Account card", () => {
  it("is a plain docked panel: no hover paint, no blur, no glow", () => {
    const { container } = render(<AccountCard />);

    const trigger = screen.getByRole("button", { name: "Account options" });
    const cls = trigger.className;

    expect(container.firstElementChild?.className).toContain("account-card");
    expect(container.firstElementChild?.className).toContain("fixed");
    expect(cls).not.toMatch(/hover:/);
    expect(cls).not.toContain("backdrop-blur");
    expect(cls).not.toContain("shadow-glow");
    expect(cls).not.toMatch(/(^|\s)ring-/); // keyboard focus ring only
    expect(cls).toContain("bg-surface");

    fireEvent.click(trigger);
    const menu = screen.getByRole("menu");
    expect(menu.className).not.toContain("shadow-glow");
    expect(menu.className.split(" ")).not.toContain("surface"); // panel utility carries the lifting shadow
    for (const item of screen.getAllByRole("menuitem")) {
      expect(item.className).not.toMatch(/hover:bg-surface/);
    }
  });
});
