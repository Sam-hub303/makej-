"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { getMatchesForWorker, getMatchesForEmployer, getEmployerJobs } from "@/lib/queries";

export interface AppNotif {
  id: string;
  type: "message" | "accepted" | "new_candidate";
  title: string;
  body: string;
  matchId: string;
  read: boolean;
  at: Date;
}

interface NotificationContextType {
  notifs: AppNotif[];
  unreadCount: number;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  navigateToNotif: (notif: AppNotif) => void;
  openChatMatchId: string | null;
  clearOpenChat: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifs: [],
  unreadCount: 0,
  panelOpen: false,
  openPanel: () => {},
  closePanel: () => {},
  markRead: () => {},
  markAllRead: () => {},
  navigateToNotif: () => {},
  openChatMatchId: null,
  clearOpenChat: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// Fetch match details to build a human-readable notification text
async function buildNotif(
  matchId: string,
  type: AppNotif["type"],
  role: "worker" | "employer",
  messageText?: string
): Promise<{ title: string; body: string } | null> {
  const { data } = await supabase
    .from("matches")
    .select("*, job:jobs(title, company), worker:profiles!matches_worker_id_fkey(name)")
    .eq("id", matchId)
    .single();

  if (!data) return null;

  const jobTitle: string = (data.job as { title?: string; company?: string } | null)?.title ?? "neznámá pozice";
  const company: string = (data.job as { title?: string; company?: string } | null)?.company ?? "Zaměstnavatel";
  const workerName: string = (data.worker as { name?: string } | null)?.name ?? "Brigádník";

  if (type === "message") {
    const sender = role === "worker" ? company : workerName;
    const preview = messageText ? messageText.substring(0, 60) : "…";
    return { title: "Nová zpráva 💬", body: `${sender}: ${preview}` };
  }
  if (type === "accepted") {
    return { title: "Přijali tě! 🎉", body: `${company} tě přijal/a na pozici ${jobTitle}` };
  }
  // new_candidate
  return { title: "Nový kandidát 👤", body: `${workerName} se přihlásil/a na ${jobTitle}` };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [notifs, setNotifs] = useState<AppNotif[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openChatMatchId, setOpenChatMatchId] = useState<string | null>(null);

  const acceptedMatchIds = useRef<Set<string>>(new Set());
  const employerJobIds = useRef<Set<string>>(new Set());
  const pathnameRef = useRef(pathname);
  const userRef = useRef(user);

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);
  useEffect(() => { userRef.current = user; }, [user]);

  const addNotif = useCallback(async (
    matchId: string,
    type: AppNotif["type"],
    role: "worker" | "employer",
    messageText?: string
  ) => {
    const texts = await buildNotif(matchId, type, role, messageText);
    if (!texts) return;
    setNotifs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        title: texts.title,
        body: texts.body,
        matchId,
        read: false,
        at: new Date(),
      },
      ...prev,
    ]);
  }, []);

  // Load initial match/job IDs for filtering
  useEffect(() => {
    if (!user || !profile) return;
    const load = async () => {
      if (profile.role === "worker") {
        const matches = await getMatchesForWorker(user.id);
        acceptedMatchIds.current = new Set(matches.filter((m) => m.status === "accepted").map((m) => m.id));
      } else {
        const [matches, jobs] = await Promise.all([getMatchesForEmployer(user.id), getEmployerJobs(user.id)]);
        acceptedMatchIds.current = new Set(matches.filter((m) => m.status === "accepted").map((m) => m.id));
        employerJobIds.current = new Set(jobs.map((j) => j.id));
      }
    };
    load();
  }, [user, profile]);

  // Auto-clear message notifs when on /messages page
  useEffect(() => {
    if (pathname === "/messages") {
      setNotifs((prev) => prev.map((n) => n.type === "message" ? { ...n, read: true } : n));
    }
    if (pathname === "/jobs" && profile?.role === "employer") {
      setNotifs((prev) => prev.map((n) => n.type === "new_candidate" ? { ...n, read: true } : n));
    }
  }, [pathname, profile?.role]);

  // Subscribe: new messages — RLS already ensures we only receive messages from our own matches
  useEffect(() => {
    if (!user || !profile) return;
    const channel = supabase
      .channel("notif-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const msg = payload.new as { id: string; match_id: string; sender_id: string; text: string };
        // Only skip own messages (we already see those optimistically in chat)
        if (msg.sender_id === userRef.current?.id) return;
        await addNotif(msg.match_id, "message", profile.role, msg.text);
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user, profile, addNotif]);

  // Subscribe: worker gets accepted / employer gets new candidate
  useEffect(() => {
    if (!user || !profile) return;

    if (profile.role === "worker") {
      const channel = supabase
        .channel("notif-worker-accepted")
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `worker_id=eq.${user.id}`,
        }, async (payload) => {
          const m = payload.new as { id: string; status: string };
          if (m.status === "accepted") {
            acceptedMatchIds.current.add(m.id);
            await addNotif(m.id, "accepted", "worker");
          }
        })
        .subscribe();
      return () => { channel.unsubscribe(); };
    } else {
      const channel = supabase
        .channel("notif-employer-candidates")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, async (payload) => {
          const m = payload.new as { id: string; job_id: string };
          // Skip if jobIds are loaded and this job doesn't belong to employer
          if (employerJobIds.current.size > 0 && !employerJobIds.current.has(m.job_id)) return;
          await addNotif(m.id, "new_candidate", "employer");
        })
        .subscribe();
      return () => { channel.unsubscribe(); };
    }
  }, [user, profile, addNotif]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const navigateToNotif = useCallback((notif: AppNotif) => {
    markRead(notif.id);
    setPanelOpen(false);
    if (notif.type === "new_candidate") {
      router.push("/jobs");
    } else {
      setOpenChatMatchId(notif.matchId);
      router.push("/messages");
    }
  }, [markRead, router]);

  return (
    <NotificationContext.Provider value={{
      notifs, unreadCount, panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      markRead, markAllRead, navigateToNotif,
      openChatMatchId, clearOpenChat: () => setOpenChatMatchId(null),
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
