"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Detect Supabase auth/JWT errors that mean the persisted session is stale
  // (typically after a paused free-tier project wakes up with rotated keys,
  // or after data reset where the user row no longer exists).
  const isStaleSessionError = (error: { message?: string; code?: string } | null | undefined) => {
    if (!error) return false;
    const msg = (error.message || "").toLowerCase();
    return (
      error.code === "PGRST301" ||
      error.code === "401" ||
      msg.includes("jwt") ||
      msg.includes("not authenticated") ||
      msg.includes("invalid claim") ||
      msg.includes("user from sub claim")
    );
  };

  const fetchProfile = async (userId: string): Promise<"ok" | "stale" | "missing"> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      if (isStaleSessionError(error)) return "stale";
      console.error("Error fetching profile:", error);
      return "missing";
    }
    if (data) {
      setProfile(data as UserProfile);
      return "ok";
    }
    return "missing";
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = () => {
    // Clear local state immediately so the UI responds at once.
    // The Supabase server call is fire-and-forget — a slow or offline
    // project won't freeze the button.
    clearAuthState();
    supabase.auth.signOut().catch(() => {});
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    // We use a small timeout to bypass React 19 Strict Mode's synchronous mount/unmount cycle.
    // By delaying, if the component immediately unmounts, we clear the timeout and never
    // initiate the async Supabase lock, preventing the orphaned lock / infinite loading bug.
    const initializerTimer = setTimeout(async () => {
      if (!mounted) return;

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // No persisted session — fresh start
        if (!currentSession) {
          if (mounted) clearAuthState();
        } else {
          // Validate the token against the server. If the project was paused
          // and resumed, the cached token may no longer be accepted; refresh
          // catches that and forces a clean signOut.
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshed.session) {
            if (isStaleSessionError(refreshError) || refreshError) {
              console.warn("Stale session detected, signing out:", refreshError?.message);
              await supabase.auth.signOut();
            }
            if (mounted) clearAuthState();
          } else if (mounted) {
            setSession(refreshed.session);
            setUser(refreshed.session.user);
            const result = await fetchProfile(refreshed.session.user.id);
            if (result === "stale" && mounted) {
              await supabase.auth.signOut();
              clearAuthState();
            }
          }
        }
      } catch (error) {
        console.error("Supabase Auth Error:", error);
        if (mounted) clearAuthState();
      } finally {
        if (mounted) setLoading(false);
      }

      if (mounted) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted || event === 'INITIAL_SESSION') return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              const result = await fetchProfile(session.user.id);
              if (result === "stale" && mounted) {
                await supabase.auth.signOut();
                clearAuthState();
              }
            } else {
              setProfile(null);
            }

            if (mounted) setLoading(false);
          }
        );
        authSubscription = subscription;
      }
    }, 50);

    return () => {
      mounted = false;
      clearTimeout(initializerTimer);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
