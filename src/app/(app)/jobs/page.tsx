"use client";

import { useState, useCallback, useEffect } from "react";
import JobCard from "@/components/JobCard";
import type { Job, Match, UserProfile } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { getActiveJobs, createMatch, createRejection, getEmployerJobs, getMatchesForJob, updateMatchStatus, sendMessage } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/components/NotificationProvider";

import Link from "next/link";

/* ─── Employer: Candidate Card ─────────────────────────────── */

function CandidateCard({
  match,
  onAccept,
  onReject,
}: {
  match: Match & { worker: UserProfile };
  onAccept: () => void;
  onReject: () => void;
}) {
  const w = match.worker;
  if (!w) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-card/30 backdrop-blur-sm border border-white/5 rounded-2xl view-transition">
      <div className="size-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0">
        {w.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={w.avatar_url} alt={w.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-lg font-black text-white">{w.name?.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-bold text-white text-sm truncate">{w.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex items-center gap-0.5 text-secondary">
            {[...Array(5)].map((_, i) => (
              // @ts-expect-error - web component
              <iconify-icon key={i} icon={i < Math.floor(w.rating || 0) ? "solar:star-bold" : "solar:star-line-duotone"} class="size-3" />
            ))}
          </div>
          <span className="text-white/40 text-[10px] font-bold">{w.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-white/20 mx-1">·</span>
          <span className="text-white/40 text-[10px] font-bold">{w.jobs_done || 0} prací</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {match.status === "pending" ? (
          <>
            <button
              onClick={onReject}
              className="size-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all active:scale-90"
            >
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:close-circle-bold" class="size-5" />
            </button>
            <button
              onClick={onAccept}
              className="size-10 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/30 transition-all active:scale-90"
            >
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:check-circle-bold" class="size-5" />
            </button>
          </>
        ) : (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${match.status === "accepted"
              ? "bg-primary/15 text-primary border border-primary/20"
              : "bg-destructive/15 text-destructive border border-destructive/20"
            }`}>
            {match.status === "accepted" ? "Přijat" : "Odmítnut"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Employer: Job Listing Card ───────────────────────────── */

function EmployerJobCard({
  job,
  candidates,
  isExpanded,
  onToggle,
  onAccept,
  onReject,
}: {
  job: Job;
  candidates: (Match & { worker: UserProfile })[];
  isExpanded: boolean;
  onToggle: () => void;
  onAccept: (matchId: string) => void;
  onReject: (matchId: string) => void;
}) {
  const pendingCount = candidates.filter((c) => c.status === "pending").length;

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] overflow-hidden stat-card">
      <button onClick={onToggle} className="w-full p-5 text-left">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-2xl overflow-hidden shrink-0 bg-primary/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={job.image_url} alt={job.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-white text-base truncate">{job.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/50 text-xs">{job.location}</span>
              <span className="text-white/20">·</span>
              <span className="text-secondary text-xs font-bold">{job.pay} Kč{job.pay_unit}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-white/40 text-xs">{job.date}</span>
              <span className="text-white/20">·</span>
              <span className="text-white/40 text-xs">{job.time_start}–{job.time_end}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-black">
                {pendingCount} {pendingCount === 1 ? "kandidát" : pendingCount < 5 ? "kandidáti" : "kandidátů"}
              </span>
            )}
            <div className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:alt-arrow-down-bold" class="size-5 text-white/30" />
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          {candidates.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/30 text-sm">Zatím se nikdo nepřihlásil</p>
            </div>
          ) : (
            candidates.map((c) => (
              <CandidateCard
                key={c.id}
                match={c}
                onAccept={() => onAccept(c.id)}
                onReject={() => onReject(c.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Employer Dashboard ───────────────────────────────────── */

function EmployerDashboard({ user }: { user: { id: string } }) {
  const { unreadCount, openPanel } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidatesByJob, setCandidatesByJob] = useState<Record<string, (Match & { worker: UserProfile })[]>>({});
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const myJobs = await getEmployerJobs(user.id);
      setJobs(myJobs);

      const candidates: Record<string, (Match & { worker: UserProfile })[]> = {};
      for (const job of myJobs) {
        candidates[job.id] = await getMatchesForJob(job.id);
      }
      setCandidatesByJob(candidates);
      setLoading(false);
    };
    load();
  }, [user.id]);

  // Realtime: new candidate swipes on our jobs, or match status changes (e.g. from web dashboard)
  useEffect(() => {
    const channel = supabase
      .channel("employer-jobs-rt-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, async (payload) => {
        const m = payload.new as { id: string; job_id: string };
        setJobs((prev) => {
          if (!prev.some((j) => j.id === m.job_id)) return prev;
          return prev; // trigger re-fetch of candidates for that job
        });
        const updated = await getMatchesForJob(m.job_id);
        setCandidatesByJob((prev) => ({ ...prev, [m.job_id]: updated }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
        const m = payload.new as { id: string; job_id: string; status: string };
        setCandidatesByJob((prev) => ({
          ...prev,
          [m.job_id]: (prev[m.job_id] ?? []).map((c) =>
            c.id === m.id ? { ...c, status: m.status as Match["status"] } : c
          ),
        }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs" }, (payload) => {
        const j = payload.new as { id: string; status: string };
        setJobs((prev) => prev.map((job) => job.id === j.id ? { ...job, status: j.status as Job["status"] } : job));
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user.id]);

  const handleAccept = async (matchId: string, jobId: string) => {
    await updateMatchStatus(matchId, "accepted");
    await sendMessage(matchId, user.id, "💬 Gratulujeme! Kandidát byl přijat — chat je nyní otevřen. Začněte si psát!");
    setCandidatesByJob((prev) => ({
      ...prev,
      [jobId]: prev[jobId].map((c) => (c.id === matchId ? { ...c, status: "accepted" as const } : c)),
    }));
    // Mark job as filled in local state immediately (DB already updated via updateMatchStatus)
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: "filled" as const } : j));

    const n = document.createElement("div");
    n.className = "fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-full shadow-lg z-50";
    n.innerHTML = `<div class="flex items-center gap-2"><iconify-icon icon="solar:check-circle-bold" class="size-5"></iconify-icon><span class="font-bold">Kandidát přijat! Chat otevřen.</span></div>`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
  };

  const handleReject = async (matchId: string, jobId: string) => {
    await updateMatchStatus(matchId, "rejected");
    setCandidatesByJob((prev) => ({
      ...prev,
      [jobId]: prev[jobId].map((c) => (c.id === matchId ? { ...c, status: "rejected" as const } : c)),
    }));
  };

  const totalCandidates = Object.values(candidatesByJob).reduce((sum, c) => sum + c.filter((m) => m.status === "pending").length, 0);

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 z-10">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tighter text-foreground">
            Inzeráty
          </h1>
          {totalCandidates > 0 && (
            <p className="text-secondary text-xs font-bold mt-0.5">
              {totalCandidates} {totalCandidates === 1 ? "nový kandidát" : totalCandidates < 5 ? "noví kandidáti" : "nových kandidátů"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="http://localhost:3333/employer/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/50 hover:bg-muted transition-colors rounded-full text-sm font-bold text-secondary"
          >
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:chart-square-bold" class="size-4" />
            Dashboard
          </a>
          <button onClick={openPanel} className="flex items-center justify-center size-10 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors relative">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:bell-bold" class="text-foreground size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center border border-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:add-circle-bold" class="size-5" />
            Přidat
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:clipboard-list-line-duotone" class="size-10 text-primary/40" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white mb-2">Zatím žádné inzeráty</h2>
            <p className="text-white/40 text-sm mb-6 max-w-[250px]">Vytvoř první nabídku brigády a začni hledat kandidáty</p>
            <Link
              href="/jobs/new"
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-primary rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:add-circle-bold" class="size-5" />
              Vytvořit brigádu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <EmployerJobCard
                key={job.id}
                job={job}
                candidates={candidatesByJob[job.id] || []}
                isExpanded={expandedJob === job.id}
                onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                onAccept={(matchId) => handleAccept(matchId, job.id)}
                onReject={(matchId) => handleReject(matchId, job.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

/* ─── Worker Swipe (existing) ──────────────────────────────── */

function WorkerSwipe({ user }: { user: { id: string } }) {
  const { unreadCount, openPanel } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showNoMore, setShowNoMore] = useState(false);
  const [matches, setMatches] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const activeJobs = await getActiveJobs(user.id);
      setJobs(activeJobs);
      setShowNoMore(activeJobs.length === 0);
      setLoading(false);
    };
    fetchJobs();
  }, [user.id]);

  const showMatchNotification = (job: Job) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2";
    notification.innerHTML = `<iconify-icon icon="solar:heart-bold" class="size-5"></iconify-icon><span class="font-bold">Nová shoda s ${job.company}!</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
  };

  const handleSwipe = useCallback(
    async (direction: "left" | "right", job: Job) => {
      const nextIndex = currentJobIndex + 1;
      if (nextIndex < jobs.length) {
        setCurrentJobIndex(nextIndex);
      } else {
        setShowNoMore(true);
      }

      if (direction === "right") {
        setMatches((prev) => [...prev, job]);
        showMatchNotification(job);
        await createMatch(user.id, job.id);
      } else {
        await createRejection(user.id, job.id);
      }
    },
    [currentJobIndex, jobs.length, user.id]
  );

  const handleReset = async () => {
    setLoading(true);
    const activeJobs = await getActiveJobs(user.id);
    setJobs(activeJobs);
    setCurrentJobIndex(0);
    setShowNoMore(activeJobs.length === 0);
    setLoading(false);
  };

  const currentJob = jobs[currentJobIndex];

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 z-10">
        <h1 className="font-heading text-3xl font-extrabold tracking-tighter text-foreground">
          Makej!
        </h1>
        <div className="flex gap-3">
          <button className="flex items-center justify-center size-10 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:filters-bold" class="text-foreground size-5" />
          </button>
          <button onClick={openPanel} className="flex items-center justify-center size-10 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors relative">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:bell-bold" class="text-foreground size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center border border-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 relative px-4 pb-4 overflow-hidden flex flex-col items-center justify-start z-10">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : showNoMore ? (
          <div className="flex-1 flex items-center justify-center no-more-cards">
            <div className="text-center max-w-sm px-6">
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:heart-bold" class="size-20 text-muted-foreground mb-6 mx-auto" />
              <h2 className="font-heading text-2xl font-black text-white mb-4">To je pro dnešek vše!</h2>
              <p className="text-muted-foreground mb-6">
                Prohlédl sis všechny dostupné nabídky. Zkuste to znovu později nebo si prohlédněte vaše matches.
              </p>
              <div className="space-y-3">
                <Link
                  href="/messages"
                  className="block w-full px-6 py-3 bg-white text-primary rounded-xl font-black text-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Zobrazit matches ({matches.length})
                </Link>
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-card/80 border border-border/50 text-foreground rounded-xl font-medium hover:bg-muted transition-all"
                >
                  Zkusit znovu
                </button>
              </div>
            </div>
          </div>
        ) : currentJob ? (
          <JobCard key={currentJob.id} job={currentJob} onSwipe={handleSwipe} />
        ) : null}
      </main>
    </>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */

export default function JobsPage() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile.role === "employer") {
    return <EmployerDashboard user={user} />;
  }

  return <WorkerSwipe user={user} />;
}
