import type { ReactNode } from "react";
import { Logo } from "@/components/site";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";

export function AuthLayout({ title, sub, children, discord = true }: { title: string; sub: string; children: ReactNode; discord?: boolean }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden border-r">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="eyebrow">Jassu Cheats</p>
          <p className="mt-3 font-display text-3xl font-semibold max-w-sm">Your keys, downloads and updates — in one place.</p>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8">
        <Logo />
        <div className="auth-content m-auto w-full max-w-sm py-12">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
          <div className="mt-8" />

          {children}
        </div>
      </div>
    </div>
  );
}
