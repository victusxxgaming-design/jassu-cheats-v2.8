import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldX } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

/**
 * Client-side gate for signed-in pages. Redirects to /login when signed out.
 * With `admin`, also requires the profile role to be "admin".
 */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", replace: true });
  }, [loading, user, nav]);

  if (loading) {
    return (
      <Shell>
        <div className="container-x grid place-items-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!user) return null; // redirect in flight

  if (admin && !isAdmin) {
    return (
      <Shell>
        <div className="container-x grid place-items-center py-32 text-center">
          <ShieldX className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-muted-foreground">Your account doesn't have access to this area.</p>
          <Button variant="hero" className="mt-8" asChild><Link to="/">Back home</Link></Button>
        </div>
      </Shell>
    );
  }

  return <>{children}</>;
}
