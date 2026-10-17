import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Field, inputCls } from "@/components/site";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () => seo("Reset password", "Reset the password for your Jassu Cheats account."),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address");
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout title={sent ? "Check your inbox" : "Reset your password"} sub={sent ? `We sent a reset link to ${email}.` : "We'll email you a secure reset link."} discord={false}>
      {sent ? (
        <div className="mt-8 surface p-6 text-center"><MailCheck className="mx-auto h-10 w-10 text-success" /><p className="mt-3 text-sm text-muted-foreground">Didn't get it? Check spam or try again in a minute.</p>
          <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>Use a different email</Button></div>
      ) : (
        <form className="mt-8 space-y-4" noValidate onSubmit={submit}>
          <Field label="Email" error={err}><input aria-invalid={!!err} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Button variant="hero" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Send reset link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="text-primary-glow hover:underline">← Back to sign in</Link></p>
    </AuthLayout>
  );
}
