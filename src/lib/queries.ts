import { supabase } from "./supabase";
import type { Job, Match, Message, UserProfile } from "./types";

// ==================== JOBS ====================

export async function getActiveJobs(userId: string): Promise<Job[]> {
  // Get jobs not already swiped by this user
  const { data: rejectedIds } = await supabase
    .from("rejections")
    .select("job_id")
    .eq("worker_id", userId);

  const { data: matchedIds } = await supabase
    .from("matches")
    .select("job_id")
    .eq("worker_id", userId);

  const excludeIds = [
    ...(rejectedIds?.map((r) => r.job_id) || []),
    ...(matchedIds?.map((m) => m.job_id) || []),
  ];

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) console.error("Error fetching jobs:", error);
  return (data as Job[]) || [];
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  return data as Job | null;
}

export async function createJob(job: Omit<Job, "id" | "created_at" | "status">): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .insert(job)
    .select()
    .single();
  if (error) console.error("Error creating job:", error);
  return data as Job | null;
}

// ==================== MATCHES ====================

export async function createMatch(workerId: string, jobId: string): Promise<Match | null> {
  const { data, error } = await supabase
    .from("matches")
    .insert({ worker_id: workerId, job_id: jobId, status: "pending" })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return null; // Duplicate — already matched
    console.error("Error creating match:", error);
  }
  return data as Match | null;
}

export async function getMatchesForWorker(workerId: string): Promise<(Match & { job: Job; employer: UserProfile })[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      job:jobs(*),
      employer:jobs(employer_id, profiles:profiles!jobs_employer_id_fkey(*))
    `)
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  // Flatten employer data
  return (data || []).map((m: Record<string, unknown>) => ({
    ...m,
    employer: (m.employer as Record<string, unknown>)?.profiles || null,
  })) as (Match & { job: Job; employer: UserProfile })[];
}

export async function getMatchesForEmployer(employerId: string): Promise<(Match & { job: Job; worker: UserProfile })[]> {
  // Get employer's job IDs first
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("employer_id", employerId);

  if (!jobs || jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);

  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      job:jobs(*),
      worker:profiles!matches_worker_id_fkey(*)
    `)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching employer matches:", error);
    return [];
  }

  return (data || []) as (Match & { job: Job; worker: UserProfile })[];
}

// ==================== REJECTIONS ====================

export async function createRejection(workerId: string, jobId: string): Promise<void> {
  const { error } = await supabase
    .from("rejections")
    .insert({ worker_id: workerId, job_id: jobId });
  if (error && error.code !== "23505") {
    console.error("Error creating rejection:", error);
  }
}

// ==================== MESSAGES ====================

export async function getMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) console.error("Error fetching messages:", error);
  return (data as Message[]) || [];
}

export async function sendMessage(matchId: string, senderId: string, text: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: senderId, text })
    .select()
    .single();
  if (error) console.error("Error sending message:", error);
  return data as Message | null;
}

export function subscribeToMessages(matchId: string, onMessage: (msg: Message) => void) {
  return supabase
    .channel(`messages:${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
}

// ==================== PROFILES ====================

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as UserProfile | null;
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) console.error("Error updating profile:", error);
  return data as UserProfile | null;
}

// ==================== EMPLOYER JOBS ====================

export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });
  if (error) console.error("Error fetching employer jobs:", error);
  return (data as Job[]) || [];
}
