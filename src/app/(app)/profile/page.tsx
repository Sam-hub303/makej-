"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { updateProfile } from "@/lib/queries";
import type { UserProfile } from "@/lib/types";

function StatsCard({ icon, value, label, color = "primary" }: { icon: string; value: string | number; label: string; color?: string }) {
  const cc: Record<string, string> = {
    primary: "bg-primary/10 text-primary hover:border-primary/30",
    secondary: "bg-secondary/10 text-secondary hover:border-secondary/30",
    accent: "bg-white/10 text-white hover:border-white/30",
    emerald: "bg-primary/10 text-secondary hover:border-primary/30",
  };
  return (
    <div className={`bg-card/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] stat-card ${cc[color]}`}>
      <div className="size-10 rounded-2xl bg-current/20 flex items-center justify-center mb-4">
        {/* @ts-expect-error - web component */}
        <iconify-icon icon={icon} class="size-6" />
      </div>
      <div className="font-heading text-3xl font-black text-white leading-none tracking-tight">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-2">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        bio: profile.bio || "",
        company_name: profile.company_name || "",
      });
    }
  }, [profile]);

  if (!profile || !user) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) return;
    await updateProfile(user.id, formData);
    await refreshProfile();
    setShowEdit(false);
    
    const n = document.createElement("div");
    n.className = "fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-full shadow-lg z-50 transition-all";
    n.innerHTML = `<div class="flex items-center gap-2"><iconify-icon icon="solar:check-circle-bold" class="size-5"></iconify-icon><span class="font-bold">Profil uložen!</span></div>`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1500);
  };

  const nextXP = 2000;
  const progress = ((profile.xp || 0) / nextXP) * 100;
  const isEmployer = profile.role === "employer";

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 z-10 shrink-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Můj profil</h1>
        <button onClick={signOut} className="flex items-center justify-center size-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors">
          {/* @ts-expect-error - web component */}
          <iconify-icon icon="solar:logout-bold" class="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 border-t border-border/10">
        {/* Avatar & Info */}
        <div className="flex flex-col items-center mt-6 mb-8">
          <div className="relative mb-4">
            <div className="size-32 rounded-full border-[3px] border-primary p-1 bg-gradient-to-tr from-primary  to-secondary shadow-[0_0_25px_rgba(41,41,120,0.5)] relative flex items-center justify-center bg-card">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full object-cover border-[3px] border-background" />
              ) : (
                <span className="text-4xl font-heading font-black text-foreground">
                  {profile.name.charAt(0)}
                </span>
              )}
              <div className="absolute bottom-2 right-2 size-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            </div>
            {!isEmployer && (
              <div className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full bg-secondary flex items-center justify-center border-2 border-background text-background font-black text-[10px] uppercase tracking-tighter">
                LEVEL {profile.level || 1}
              </div>
            )}
          </div>
          <h2 className="font-heading text-3xl font-black text-white tracking-tight">{profile.name}</h2>
          
          {isEmployer && profile.company_name ? (
            <p className="text-secondary text-sm font-bold tracking-wide mt-1 mb-2">
              {profile.company_name}
            </p>
          ) : (
            <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mt-1 mb-2">
              {profile.verified ? "Ověřený pracovník" : "Pracovník"}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-secondary">
            {[...Array(5)].map((_, i) => (
              // @ts-expect-error - web component
              <iconify-icon key={i} icon={i < Math.floor(profile.rating || 0) ? "solar:star-bold" : "solar:star-half-bold"} class="size-4" />
            ))}
            <span className="text-white/60 text-xs font-black ml-1.5 px-2 py-0.5 bg-white/10 rounded-full">{profile.rating || "0.0"}</span>
          </div>
          {profile.bio && <p className="text-muted-foreground text-sm mt-4 text-center max-w-xs">{profile.bio}</p>}
        </div>

        {/* Employer actions */}
        {isEmployer ? (
          <div className="mb-8">
            <a href="/jobs/new" className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white text-primary rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)]">
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:add-circle-bold" class="size-6" />
              Vytvořit nabídku brigády
            </a>
          </div>
        ) : (
          /* XP Progress */
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 mb-8 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40">Zkušenosti</span>
                <span className="text-lg font-heading font-black text-white">Úroveň {profile.level || 1}</span>
              </div>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/30">
                {profile.xp || 0} / {nextXP} XP
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden border border-white/5 p-[2px]">
              <div className="h-full bg-gradient-to-r from-primary  to-secondary rounded-full shadow-[0_0_15px_rgba(41,41,120,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatsCard icon="solar:case-minimalistic-bold" value={profile.jobs_done || 0} label={isEmployer ? "Nabídnuté práce" : "Dokončené práce"} color="primary" />
          <StatsCard icon="solar:clock-circle-bold" value={profile.hours_logged || 0} label={isEmployer ? "Hodiny obsazeny" : "Odpracované hodiny"} color="secondary" />
          {!isEmployer && <StatsCard icon="solar:medal-star-bold" value={`${profile.punctuality || 100}%`} label="Docháznost" color="accent" />}
          <StatsCard icon="solar:wallet-money-bold" value={`$${profile.total_earned || 0}`} label={isEmployer ? "Celkem vyplaceno" : "Celkový výdělek"} color="emerald" />
        </div>

        <button onClick={() => setShowEdit(true)} className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
          {/* @ts-expect-error - web component */}
          <iconify-icon icon="solar:pen-bold" class="size-5" />
          Upravit profil
        </button>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 edit-mode">
          <div className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-black text-white">Upravit profil</h2>
              <button onClick={() => setShowEdit(false)} className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                {/* @ts-expect-error - web component */}
                <iconify-icon icon="solar:close-bold" class="size-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Jméno</label>
                <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              
              {isEmployer && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Název firmy</label>
                  <input type="text" value={formData.company_name || ""} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">O mně</label>
                <textarea value={formData.bio || ""} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none" placeholder="Něco o sobě..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowEdit(false)} className="flex-1 px-6 py-3 bg-card/80 border border-border/50 text-foreground rounded-xl font-medium hover:bg-muted transition-all">Zrušit</button>
                <button onClick={handleSave} className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">Uložit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
