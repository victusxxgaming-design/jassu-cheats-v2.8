import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/site";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () => seo("Set a new password", "Choose a new password for your Jassu Cheats account."),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (pw.length < 8) x.pw = "Use at least 8 characters";
    if (pw !== pw2) x.pw2 = "Passwords don't match";
    setErr(x);
    if (Object.keys(x).length) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — you're signed in.");
    nav({ to: "/account" });
  };

  return (
    <AuthLayout title="Set a new password" sub="Choose a new password for your account." discord={false}>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="New password" error={err.pw}><input type="password" aria-invalid={!!err.pw} className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></Field>
        <Field label="Confirm new password" error={err.pw2}><input type="password" aria-invalid={!!err.pw2} className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" /></Field>
        <Button variant="hero" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Update password</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link to="/login" className="text-primary-glow hover:underline">← Back to sign in</Link></p>
    </AuthLayout>
  );
}
