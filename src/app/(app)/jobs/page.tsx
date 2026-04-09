"use client";

import { useState, useCallback, useEffect } from "react";
import JobCard from "@/components/JobCard";
import type { Job } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { getActiveJobs, createMatch, createRejection } from "@/lib/queries";
import Link from "next/link";

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showNoMore, setShowNoMore] = useState(false);
  const [matches, setMatches] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      setLoading(true);
      const activeJobs = await getActiveJobs(user.id);
      setJobs(activeJobs);
      setShowNoMore(activeJobs.length === 0);
      setLoading(false);
    };
    fetchJobs();
  }, [user]);

  const showMatchNotification = (job: Job) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2";
    // @ts-expect-error - web component
    notification.innerHTML = `<iconify-icon icon="solar:heart-bold" class="size-5"></iconify-icon><span class="font-bold">Nová shoda s ${job.company}!</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
  };

  const handleSwipe = useCallback(
    async (direction: "left" | "right", job: Job) => {
      if (!user) return;
      
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
    [currentJobIndex, jobs.length, user]
  );

  const handleReset = async () => {
    if (!user) return;
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
          <button className="flex items-center justify-center size-10 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors relative">
            {/* @ts-expect-error - web component */}
            <iconify-icon icon="solar:bell-bold" class="text-foreground size-5" />
            {matches.length > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border border-card" />
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
