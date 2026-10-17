import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "customer" | "admin";
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

// The database is authoritative: a session lives 12h from the original
// login and dies immediately on logout. This only mirrors that in the UI.
async function fetchExpiry(): Promise<number | null> {
  const { data, error } = await supabase.rpc("session_expires_at");
  if (error || !data) return null;
  return new Date(data as string).getTime();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocal = async () => {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    queryClient.cancelQueries();
    queryClient.clear();
    setSession(null);
    setProfile(null);
  };

  // Verify the session server-side; drop it if expired or revoked.
  const verify = async (s: Session | null) => {
    if (!s) return false;
    const exp = await fetchExpiry();
    if (!exp || exp <= Date.now()) {
      await clearLocal();
      return false;
    }
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (await verify(data.session)) {
        setSession(data.session);
        setProfile(await fetchProfile(data.session!.user.id));
      }
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (!next?.user) {
        // Covers sign-out in another tab too (shared storage).
        queryClient.clear();
        setSession(null);
        setProfile(null);
        return;
      }
      // Defer to avoid Supabase's deadlock warning inside the callback.
      setTimeout(async () => {
        if (await verify(next)) {
          setSession(next);
          setProfile(await fetchProfile(next.user.id));
        }
      }, 0);
    });

    const onFocus = () => {
      supabase.auth.getSession().then(({ data }) => { if (data.session) void verify(data.session); });
    };
    window.addEventListener("focus", onFocus);
    const tick = window.setInterval(onFocus, 60_000);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    // Revoke on the server first (deletes the session); then clear locally.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    await clearLocal();
    if (error && !/session.*(not found|missing)/i.test(error.message)) {
      toast.error("Signed out on this device, but the server couldn't confirm. Sign in and out again to be sure.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
