"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserRole = "worker" | "employer";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>("worker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          company_name: role === "employer" ? companyName : null,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/jobs");
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-foreground">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-5xl font-black tracking-tighter text-foreground mb-2">
            Makej!
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Vytvoř si účet a začni
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Choose role */
          <div className="w-full max-w-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-center mb-6">Kdo jsi?</h2>

            <button
              onClick={() => { setRole("worker"); setStep(2); }}
              className={`w-full p-6 bg-card border-2 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                role === "worker" ? "border-primary shadow-[0_0_20px_rgba(41,41,120,0.5)]" : "border-border/50 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/20 text-primary">
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:user-bold" class="size-7" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Brigádník</h3>
                  <p className="text-muted-foreground text-sm">Hledám práci a brigády</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setRole("employer"); setStep(2); }}
              className={`w-full p-6 bg-card border-2 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                role === "employer" ? "border-secondary shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "border-border/50 hover:border-secondary/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-14 rounded-2xl bg-secondary/20 text-secondary">
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:buildings-bold" class="size-7" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Zaměstnavatel</h3>
                  <p className="text-muted-foreground text-sm">Hledám brigádníky</p>
                </div>
              </div>
            </button>

            <div className="pt-4 text-center">
              <p className="text-muted-foreground text-sm">
                Už máš účet?{" "}
                <button onClick={() => router.push("/login")} className="text-primary font-bold hover:underline">
                  Přihlas se
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Form */
          <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4 view-transition">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:alt-arrow-left-bold" class="size-5" />
              <span className="text-sm font-medium">Zpět</span>
            </button>

            <div className="flex items-center gap-3 px-4 py-3 bg-card/50 border border-border/30 rounded-2xl mb-6">
              <div className={`flex items-center justify-center size-10 rounded-xl ${role === "worker" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                {/* @ts-expect-error - web component */}
                <iconify-icon icon={role === "worker" ? "solar:user-bold" : "solar:buildings-bold"} class="size-5" />
              </div>
              <span className="font-medium text-sm">
                {role === "worker" ? "Registrace brigádníka" : "Registrace zaměstnavatele"}
              </span>
            </div>

            {error && (
              <div className="px-4 py-3 bg-destructive/20 border border-destructive/50 rounded-xl text-destructive text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {role === "worker" ? "Tvoje jméno" : "Kontaktní jméno"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={role === "worker" ? "Samuel Pšeja" : "Jan Novák"}
                className="w-full px-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {role === "employer" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Název firmy</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="The Bean Scene"
                  className="w-full px-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
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
                minLength={6}
                placeholder="Alespoň 6 znaků"
                className="w-full px-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(41,41,120,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Registrace..." : "Vytvořit účet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
