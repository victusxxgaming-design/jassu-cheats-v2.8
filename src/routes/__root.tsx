import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/site";
import { Button } from "@/components/ui/button";
import { SiteMotion } from "@/components/site-motion";

function NotFoundComponent() {
  return (
    <Shell>
      <div className="container-x grid place-items-center py-32 text-center">
        <p className="font-display text-[8rem] leading-none font-semibold text-gradient">404</p>
        <h1 className="mt-4 text-2xl font-semibold">This page went off the map</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
        <div className="mt-8 flex gap-3">
          <Button variant="hero" asChild><Link to="/">Back home</Link></Button>
          <Button variant="outline" asChild><Link to="/store">Browse store</Link></Button>
        </div>
      </div>
    </Shell>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface max-w-md p-10 text-center">
        <p className="eyebrow">Error</p>
        <h1 className="mt-2 text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">An unexpected error occurred. Try again or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="hero" onClick={() => { router.invalidate(); reset(); }}>Try again</Button>
          <Button variant="outline" asChild><a href="/">Go home</a></Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Jassu Cheats — Premium Game Addons" },
      { name: "description", content: "Premium, independently made game addons with instant delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <SiteMotion><Outlet /></SiteMotion>
          <Toaster theme="dark" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
