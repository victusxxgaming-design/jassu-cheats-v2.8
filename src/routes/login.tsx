import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/site";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/oauth-buttons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => seo("Sign in", "Sign in to your Jassu Cheats account to access keys and downloads."),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) nav({ to: "/account", replace: true });
  }, [authLoading, user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) x.email = "Enter a valid email address";
    if (pw.length < 6) x.pw = "Password must be at least 6 characters";
    setErr(x);
    if (Object.keys(x).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    nav({ to: "/account" });
  };

  return (
    <AuthLayout title="Welcome back" sub="Sign in to view your keys and downloads.">
      <OAuthButtons />
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <Field label="Email" error={err.email}><input aria-invalid={!!err.email} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="Password" error={err.pw}><input type="password" aria-invalid={!!err.pw} className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></Field>
        <div className="text-right"><Link to="/forgot-password" className="text-xs text-primary-glow hover:underline">Forgot password?</Link></div>
        <Button variant="hero" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link to="/register" className="text-primary-glow hover:underline">Create an account</Link></p>
    </AuthLayout>
  );
}
