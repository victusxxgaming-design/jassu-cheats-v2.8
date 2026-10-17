import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/site";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/oauth-buttons";
import { supabase } from "@/lib/supabase";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/register")({
  head: () => seo("Create account", "Create a Jassu Cheats account to manage purchases, keys and downloads."),
  component: Register,
});

function Register() {
  const [f, setF] = useState({ name: "", email: "", pw: "", pw2: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!f.name.trim()) x.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = "Enter a valid email address";
    if (f.pw.length < 8) x.pw = "Use at least 8 characters";
    if (f.pw !== f.pw2) x.pw2 = "Passwords don't match";
    setErr(x);
    if (Object.keys(x).length) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.pw,
      options: {
        data: { display_name: f.name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      // Email confirmation disabled — signed in immediately.
      window.location.href = "/account";
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" sub={`We sent a confirmation link to ${f.email}.`} discord={false}>
        <div className="mt-8 surface p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-success" />
          <p className="mt-3 text-sm text-muted-foreground">Click the link in the email to activate your account, then sign in.</p>
          <Button variant="outline" className="mt-5" asChild><Link to="/login">Go to sign in</Link></Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" sub="Takes less than a minute.">
      <OAuthButtons />
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <Field label="Display name" error={err.name}><input aria-invalid={!!err.name} className={inputCls} value={f.name} onChange={set("name")} /></Field>
        <Field label="Email" error={err.email}><input aria-invalid={!!err.email} className={inputCls} value={f.email} onChange={set("email")} /></Field>
        <Field label="Password" error={err.pw}><input type="password" aria-invalid={!!err.pw} className={inputCls} value={f.pw} onChange={set("pw")} /></Field>
        <Field label="Confirm password" error={err.pw2}><input type="password" aria-invalid={!!err.pw2} className={inputCls} value={f.pw2} onChange={set("pw2")} /></Field>
        <Button variant="hero" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary-glow hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
