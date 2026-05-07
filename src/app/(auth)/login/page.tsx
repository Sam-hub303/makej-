"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRole = searchParams.get("role"); // "worker" | "employer" | null
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/jobs");
    }
  }, [user, authLoading, router]);

  // Show nothing while checking auth (prevents flash of login form)
  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === "Invalid login credentials" ? "Nesprávný email nebo heslo" : authError.message);
      setLoading(false);
      return;
    }

    router.push("/jobs");
  };

  const roleLabel = targetRole === "employer" ? "zaměstnavatele" : targetRole === "worker" ? "brigádníka" : null;

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-foreground">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-12 text-center">
          <h1 className="font-heading text-6xl font-black tracking-tighter text-foreground mb-2">
            Makej!
          </h1>
          {roleLabel ? (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`size-8 rounded-lg flex items-center justify-center ${targetRole === "worker" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                {/* @ts-expect-error - web component */}
                <iconify-icon icon={targetRole === "worker" ? "solar:user-bold" : "solar:buildings-bold"} class="size-4" />
              </div>
              <p className="text-sm font-bold text-foreground">
                Přihlášení jako {roleLabel}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm font-medium tracking-wide">
              Swipuj. Matchuj. Pracuj.
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          {error && (
            <div className="px-4 py-3 bg-destructive/20 border border-destructive/50 rounded-xl text-destructive text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tvuj@email.cz"
              className="w-full px-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(41,41,120,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Přihlašování..." : "Přihlásit se"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-sm my-8">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">nebo</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Social login */}
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/jobs` },
            });
          }}
          className="w-full max-w-sm py-3.5 bg-card border border-border/50 rounded-2xl text-foreground font-medium hover:bg-muted transition-all flex items-center justify-center gap-3"
        >
          {/* @ts-expect-error - web component */}
          <iconify-icon icon="flat-color-icons:google" class="size-5" />
          Pokračovat přes Google
        </button>

        {/* Register link */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nemáš účet?{" "}
            <button
              onClick={() => router.push(targetRole ? `/register?role=${targetRole}` : "/register")}
              className="text-primary font-bold hover:underline"
            >
              Zaregistruj se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-transparent">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
