"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import NotificationPanel from "@/components/NotificationPanel";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render app until authenticated
  if (!user) return null;

  return (
    <NotificationProvider>
      <div className="flex flex-col h-dvh-safe w-full bg-transparent text-foreground overflow-hidden font-sans relative pt-safe">
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
        <BottomNav />
      </div>
      <NotificationPanel />
    </NotificationProvider>
  );
}
