"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { updateProfile, getReviewsForUser, deleteAccount } from "@/lib/queries";
import type { UserProfile, Review, WorkExperience } from "@/lib/types";

/* ─── Small Reusable Components ──────────────────────────────── */

function StatsCard({ icon, value, label, color = "primary" }: { icon: string; value: string | number; label: string; color?: string }) {
  const cc: Record<string, string> = {
    primary: "bg-primary/10 text-primary hover:border-primary/30",
    secondary: "bg-secondary/10 text-secondary hover:border-secondary/30",
    accent: "bg-white/10 text-white hover:border-white/30",
    emerald: "bg-primary/10 text-secondary hover:border-primary/30",
  };
  return (
    <div className={`bg-card/40 backdrop-blur-md border border-white/5 p-5 rounded-[1.5rem] stat-card ${cc[color]}`}>
      <div className="size-9 rounded-xl bg-current/20 flex items-center justify-center mb-3">
        {/* @ts-expect-error - web component */}
        <iconify-icon icon={icon} class="size-5" />
      </div>
      <div className="font-heading text-2xl font-black text-white leading-none tracking-tight">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1.5">{label}</div>
    </div>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/20 text-primary text-xs font-bold tracking-wide skill-chip">
      {label}
    </span>
  );
}

function StarRating({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5 text-secondary">
      {[...Array(5)].map((_, i) => (
        // @ts-expect-error - web component
        <iconify-icon
          key={i}
          icon={i < Math.floor(rating) ? "solar:star-bold" : i < rating ? "solar:star-half-bold" : "solar:star-line-duotone"}
          class={size}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5 review-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="size-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-white">
            {(review.reviewer as UserProfile)?.name?.charAt(0) || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-heading font-bold text-white text-sm truncate">
              {(review.reviewer as UserProfile)?.name || "Zaměstnavatel"}
            </span>
            <span className="text-[10px] text-white/40 font-medium shrink-0">{date}</span>
          </div>
          <StarRating rating={review.rating} size="size-3" />
        </div>
      </div>
      {review.text && <p className="text-muted-foreground text-sm leading-relaxed">{review.text}</p>}
    </div>
  );
}

function ExperienceItem({ exp }: { exp: WorkExperience }) {
  return (
    <div className="relative pl-6 pb-6 last:pb-0 timeline-item">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-3 bottom-0 w-[2px] bg-gradient-to-b from-primary/60 to-transparent last:hidden" />
      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 size-4 rounded-full bg-primary border-[3px] border-background shadow-[0_0_10px_rgba(41,41,120,0.5)]" />
      <div className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
        <h4 className="font-heading font-bold text-white text-sm">{exp.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-secondary text-xs font-bold">{exp.company}</span>
          <span className="text-white/20">·</span>
          <span className="text-white/40 text-xs">{exp.period}</span>
        </div>
        {exp.description && <p className="text-muted-foreground text-xs mt-2 leading-relaxed">{exp.description}</p>}
      </div>
    </div>
  );
}

/* ─── Tab Constants ──────────────────────────────────────────── */

type ProfileTab = "about" | "cv" | "reviews";

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: "about", label: "O mně", icon: "solar:user-bold" },
  { id: "cv", label: "Životopis", icon: "solar:document-bold" },
  { id: "reviews", label: "Recenze", icon: "solar:star-bold" },
];

/* ─── Edit Modal ─────────────────────────────────────────────── */

function EditModal({
  profile,
  isEmployer,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  isEmployer: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
}) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: profile.name,
    bio: profile.bio || "",
    company_name: profile.company_name || "",
    skills: profile.skills || [],
    experience: profile.experience || [],
    education: profile.education || "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [showExpForm, setShowExpForm] = useState(false);
  const [newExp, setNewExp] = useState<WorkExperience>({ title: "", company: "", period: "", description: "" });

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !(formData.skills || []).includes(skill)) {
      setFormData({ ...formData, skills: [...(formData.skills || []), skill] });
      setSkillInput("");
    }
  };

  const removeSkill = (idx: number) => {
    setFormData({ ...formData, skills: (formData.skills || []).filter((_, i) => i !== idx) });
  };

  const addExperience = () => {
    if (newExp.title && newExp.company) {
      setFormData({ ...formData, experience: [...(formData.experience || []), newExp] });
      setNewExp({ title: "", company: "", period: "", description: "" });
      setShowExpForm(false);
    }
  };

  const removeExperience = (idx: number) => {
    setFormData({ ...formData, experience: (formData.experience || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center edit-mode">
      <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-black text-white">Upravit profil</h2>
          <button onClick={onClose} className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:close-bold" class="size-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Jméno</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background/80 border border-white/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Company (employer only) */}
          {isEmployer && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Název firmy</label>
              <input
                type="text"
                value={formData.company_name || ""}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-3 bg-background/80 border border-white/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">O mně</label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 bg-background/80 border border-white/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 h-28 resize-none transition-all"
              placeholder="Napiš něco o sobě..."
            />
          </div>

          {/* Education */}
          {!isEmployer && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Vzdělání</label>
              <input
                type="text"
                value={formData.education || ""}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-4 py-3 bg-background/80 border border-white/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Např. SŠ Strojírenská, 3. ročník"
              />
            </div>
          )}

          {/* Skills */}
          {!isEmployer && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Dovednosti</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  className="flex-1 px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Přidej dovednost..."
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2.5 bg-primary/20 border border-primary/30 text-primary rounded-xl font-bold text-sm hover:bg-primary/30 transition-all"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.skills || []).map((skill, idx) => (
                  <button
                    key={idx}
                    onClick={() => removeSkill(idx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/20 text-primary text-xs font-bold hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 transition-all"
                  >
                    {skill}
                    {/* @ts-expect-error - web component */}
                    <iconify-icon icon="solar:close-circle-bold" class="size-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {!isEmployer && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Pracovní zkušenosti</label>
              {(formData.experience || []).map((exp, idx) => (
                <div key={idx} className="bg-background/50 border border-white/5 rounded-xl p-3 mb-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{exp.title}</div>
                    <div className="text-secondary text-xs">{exp.company} · {exp.period}</div>
                  </div>
                  <button
                    onClick={() => removeExperience(idx)}
                    className="size-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 hover:bg-destructive/20 transition-all"
                  >
                    {/* @ts-expect-error - web component */}
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="size-3.5" />
                  </button>
                </div>
              ))}

              {showExpForm ? (
                <div className="bg-background/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newExp.title}
                    onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Pozice"
                  />
                  <input
                    type="text"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Firma"
                  />
                  <input
                    type="text"
                    value={newExp.period}
                    onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Období (např. Léto 2025)"
                  />
                  <textarea
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background/80 border border-white/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 h-16 resize-none"
                    placeholder="Popis práce (nepovinné)"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowExpForm(false)} className="flex-1 px-4 py-2 bg-muted/50 text-foreground rounded-lg text-sm font-medium">Zrušit</button>
                    <button onClick={addExperience} className="flex-1 px-4 py-2 bg-primary/30 text-primary rounded-lg text-sm font-bold">Přidat</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowExpForm(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm font-bold hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:add-circle-line-duotone" class="size-5" />
                  Přidat zkušenost
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-6 py-3.5 bg-card/80 border border-white/10 text-foreground rounded-xl font-medium hover:bg-muted transition-all">
              Zrušit
            </button>
            <button onClick={() => onSave(formData)} className="flex-1 px-6 py-3.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
              Uložit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Profile Page ──────────────────────────────────────── */

export default function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("about");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user && activeTab === "reviews") {
      setLoadingReviews(true);
      getReviewsForUser(user.id).then((data) => {
        setReviews(data);
        setLoadingReviews(false);
      });
    }
  }, [user, activeTab]);

  if (!profile || !user) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async (formData: Partial<UserProfile>) => {
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

  const targetRole = profile?.role === "worker" ? "employer" : "worker";
  const targetRoleLabel = targetRole === "worker" ? "brigádníka" : "zaměstnavatele";

  // Hard navigation avoids a race with AppLayout's redirect-to-/login effect:
  // signOut() clears the user, AppLayout sees user=null and would call
  // router.replace("/login") (without the role query), clobbering our push.
  // window.location.replace forces a full reload to the correct URL.
  const handleRoleSwitchLogin = () => {
    signOut();
    window.location.replace(`/login?role=${targetRole}`);
  };

  const handleRoleSwitchRegister = () => {
    signOut();
    window.location.replace(`/register?role=${targetRole}`);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const result = await deleteAccount();
    if (!result.ok) {
      setDeleteLoading(false);
      const err = document.createElement("div");
      err.className = "fixed top-20 left-1/2 transform -translate-x-1/2 bg-destructive text-white px-6 py-3 rounded-full shadow-lg z-[60] transition-all";
      err.textContent = `Chyba: ${result.error}`;
      document.body.appendChild(err);
      setTimeout(() => err.remove(), 3000);
      return;
    }
    signOut();
    window.location.replace("/login");
  };

  const nextXP = 2000;
  const progress = ((profile.xp || 0) / nextXP) * 100;
  const isEmployer = profile.role === "employer";

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 z-10 shrink-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Můj profil</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Smazat účet"
            className="flex items-center justify-center size-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors"
          >
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:trash-bin-trash-bold" class="size-5" />
          </button>
          <button onClick={signOut} aria-label="Odhlásit" className="flex items-center justify-center size-10 rounded-full bg-muted/40 border border-white/10 text-white/70 hover:bg-muted/60 transition-colors">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:logout-bold" class="size-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 border-t border-border/10">
        {/* ─── Avatar & Info ─────────────────────────── */}
        <div className="flex flex-col items-center mt-6 mb-6">
          <div className="relative mb-4">
            <div className="size-28 rounded-full border-[3px] border-primary p-1 bg-gradient-to-tr from-primary to-secondary shadow-[0_0_25px_rgba(41,41,120,0.5)] relative flex items-center justify-center bg-card">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full object-cover border-[3px] border-background" />
              ) : (
                <span className="text-3xl font-heading font-black text-foreground">
                  {(profile.name || "?").charAt(0)}
                </span>
              )}
              <div className="absolute bottom-1.5 right-1.5 size-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            </div>
            {!isEmployer && (
              <div className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full bg-secondary flex items-center justify-center border-2 border-background text-background font-black text-[10px] uppercase tracking-tighter">
                LEVEL {profile.level || 1}
              </div>
            )}
          </div>
          <h2 className="font-heading text-2xl font-black text-white tracking-tight">{profile.name || "Uživatel"}</h2>

          {isEmployer && profile.company_name ? (
            <p className="text-secondary text-sm font-bold tracking-wide mt-1">
              {profile.company_name}
            </p>
          ) : (
            <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mt-1">
              {profile.verified ? "Ověřený pracovník" : "Pracovník"}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-secondary mt-2">
            <StarRating rating={profile.rating || 0} />
            <span className="text-white/60 text-xs font-black ml-1.5 px-2 py-0.5 bg-white/10 rounded-full">{profile.rating || "0.0"}</span>
          </div>

          <button
            onClick={() => setShowEdit(true)}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center gap-2"
          >
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:pen-bold" class="size-4" />
            Upravit profil
          </button>
        </div>

        {/* ─── Role Switch Toggle ────────────────────── */}
        <div className="mb-6">
          <div className="w-full bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-1.5 flex relative overflow-hidden">
            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg transition-all duration-300 ease-out ${isEmployer ? "left-[calc(50%+3px)]" : "left-1.5"
                }`}
            />
            <div className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold z-10 transition-colors cursor-default ${!isEmployer ? "text-white" : "text-white/40 cursor-pointer hover:text-white/60"
              }`} onClick={() => !isEmployer ? null : setShowRoleModal(true)}>
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:user-bold" class="size-4" />
              Brigádník
            </div>
            <div className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold z-10 transition-colors cursor-default ${isEmployer ? "text-white" : "text-white/40 cursor-pointer hover:text-white/60"
              }`} onClick={() => isEmployer ? null : setShowRoleModal(true)}>
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:buildings-bold" class="size-4" />
              Zaměstnavatel
            </div>
          </div>
        </div>

        {/* ─── Tab Navigation ────────────────────────── */}
        <div className="flex gap-1 bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-1.5 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                  : "text-white/40 hover:text-white/60"
                }`}
            >
              {/* @ts-expect-error - web component */}
              <iconify-icon icon={tab.icon} class="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ───────────────────────────── */}
        <div className="tab-content">
          {/* ── About Tab ─── */}
          {activeTab === "about" && (
            <div className="space-y-6 view-transition">
              {/* Bio */}
              {profile.bio ? (
                <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {/* @ts-expect-error - web component */}
                    <iconify-icon icon="solar:document-text-bold" class="size-4 text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">O mně</span>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
                </div>
              ) : (
                <div className="bg-card/20 border border-dashed border-white/10 rounded-[1.5rem] p-6 text-center">
                  <p className="text-white/30 text-sm">Zatím jsi o sobě nic nenapsal/a</p>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="text-primary text-xs font-bold mt-2 hover:underline"
                  >
                    Přidat popis →
                  </button>
                </div>
              )}

              {/* XP Progress (workers only) */}
              {!isEmployer && (
                <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-5 shadow-xl">
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
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_15px_rgba(41,41,120,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatsCard icon="solar:case-minimalistic-bold" value={profile.jobs_done || 0} label={isEmployer ? "Nabídnuté práce" : "Dokončené práce"} color="primary" />
                <StatsCard icon="solar:clock-circle-bold" value={profile.hours_logged || 0} label={isEmployer ? "Hodiny obsazeny" : "Odpracované hodiny"} color="secondary" />
                {!isEmployer && <StatsCard icon="solar:medal-star-bold" value={`${profile.punctuality || 100}%`} label="Docháznost" color="accent" />}
                <StatsCard icon="solar:wallet-money-bold" value={`${profile.total_earned || 0} Kč`} label={isEmployer ? "Celkem vyplaceno" : "Celkový výdělek"} color="emerald" />
              </div>
            </div>
          )}

          {/* ── CV Tab ─── */}
          {activeTab === "cv" && (
            <div className="space-y-6 view-transition">
              {/* Skills */}
              <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 mb-4">
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:bolt-bold" class="size-4 text-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Dovednosti</span>
                </div>
                {(profile.skills || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(profile.skills || []).map((skill, i) => (
                      <SkillChip key={i} label={skill} />
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 text-sm text-center py-2">
                    Zatím nemáš žádné dovednosti
                    <button onClick={() => setShowEdit(true)} className="text-primary font-bold ml-1 hover:underline">Přidat →</button>
                  </p>
                )}
              </div>

              {/* Experience */}
              <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 mb-4">
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:case-round-bold" class="size-4 text-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Pracovní zkušenosti</span>
                </div>
                {(profile.experience || []).length > 0 ? (
                  <div>
                    {(profile.experience || []).map((exp, i) => (
                      <ExperienceItem key={i} exp={exp} />
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 text-sm text-center py-2">
                    Zatím nemáš žádné zkušenosti
                    <button onClick={() => setShowEdit(true)} className="text-primary font-bold ml-1 hover:underline">Přidat →</button>
                  </p>
                )}
              </div>

              {/* Education */}
              <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 mb-4">
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:square-academic-cap-bold" class="size-4 text-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Vzdělání</span>
                </div>
                {profile.education ? (
                  <p className="text-foreground/80 text-sm leading-relaxed">{profile.education}</p>
                ) : (
                  <p className="text-white/30 text-sm text-center py-2">
                    Zatím nemáš vyplněné vzdělání
                    <button onClick={() => setShowEdit(true)} className="text-primary font-bold ml-1 hover:underline">Přidat →</button>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Reviews Tab ─── */}
          {activeTab === "reviews" && (
            <div className="space-y-4 view-transition">
              {loadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length > 0 ? (
                <>
                  {/* Summary */}
                  <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5 flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-2xl font-heading font-black text-white">{profile.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                    <div>
                      <StarRating rating={profile.rating || 0} />
                      <p className="text-white/40 text-xs font-bold mt-1">{reviews.length} {reviews.length === 1 ? "recenze" : reviews.length < 5 ? "recenze" : "recenzí"}</p>
                    </div>
                  </div>
                  {/* Review list */}
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </>
              ) : (
                <div className="bg-card/20 border border-dashed border-white/10 rounded-[1.5rem] p-8 text-center">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {/* @ts-expect-error - web component */}
                    <iconify-icon icon="solar:star-line-duotone" class="size-8 text-primary/40" />
                  </div>
                  <h3 className="font-heading font-bold text-white/60 mb-1">Zatím žádné recenze</h3>
                  <p className="text-white/30 text-xs max-w-[200px] mx-auto">Recenze se zobrazí po dokončení brigády, které ti zaměstnavatel napíše</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditModal
          profile={profile}
          isEmployer={isEmployer}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      {/* Role Switch Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 edit-mode">
          <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-black text-white">Přepnout na {targetRoleLabel}</h2>
              <button onClick={() => setShowRoleModal(false)} className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                {/* @ts-expect-error - web component */}
                <iconify-icon icon="solar:close-bold" class="size-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-background/50 border border-white/5 rounded-2xl mb-6">
              <div className={`size-12 rounded-2xl flex items-center justify-center ${targetRole === "worker" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                {/* @ts-expect-error - web component */}
                <iconify-icon icon={targetRole === "worker" ? "solar:user-bold" : "solar:buildings-bold"} class="size-6" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{targetRole === "worker" ? "Brigádník" : "Zaměstnavatel"}</p>
                <p className="text-white/40 text-xs">{targetRole === "worker" ? "Swipuj nabídky a hledej práci" : "Vytvářej inzeráty a hledej brigádníky"}</p>
              </div>
            </div>

            <p className="text-white/50 text-xs text-center mb-5">
              Pro přepnutí se musíš přihlásit nebo zaregistrovat jako {targetRoleLabel}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleRoleSwitchLogin}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {/* @ts-expect-error - web component */}
                <iconify-icon icon="solar:login-bold" class="size-5" />
                Přihlásit se
              </button>
              <button
                onClick={handleRoleSwitchRegister}
                className="w-full py-3.5 bg-card/80 border border-white/10 text-foreground rounded-xl font-medium hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                {/* @ts-expect-error - web component */}
                <iconify-icon icon="solar:user-plus-bold" class="size-5" />
                Zaregistrovat se
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 edit-mode">
          <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 w-full max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="size-16 rounded-full bg-destructive/20 flex items-center justify-center">
                {/* @ts-expect-error - web component */}
                <iconify-icon icon="solar:danger-triangle-bold" class="size-8" style={{ color: "#f87171" }} />
              </div>
            </div>
            <h2 className="font-heading text-lg font-black text-white text-center mb-2">Smazat účet?</h2>
            <p className="text-white/50 text-sm text-center mb-6">
              Tato akce je nevratná. Všechna tvá data, zprávy, matche a recenze budou trvale smazány.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full py-3.5 bg-destructive text-white rounded-xl font-bold hover:bg-destructive/80 transition-all disabled:opacity-50"
              >
                {deleteLoading ? "Mazání..." : "Ano, smazat účet"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="w-full py-3.5 bg-card/80 border border-white/10 text-foreground rounded-xl font-medium hover:bg-muted transition-all disabled:opacity-50"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
