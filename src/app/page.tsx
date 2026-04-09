"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/jobs");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Loading spinner while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="text-center">
        <h1 className="font-heading text-5xl font-black tracking-tighter text-foreground mb-4 animate-pulse">
          Makej!
        </h1>
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
