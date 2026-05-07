"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const workerTabs = [
  { id: "jobs", label: "Práce", icon: "solar:case-round-bold", href: "/jobs" },
  { id: "messages", label: "Zprávy", icon: "solar:chat-round-bold", href: "/messages" },
  { id: "profile", label: "Profil", icon: "solar:user-bold", href: "/profile" },
];

const employerTabs = [
  { id: "jobs", label: "Inzeráty", icon: "solar:clipboard-list-bold", href: "/jobs" },
  { id: "messages", label: "Zprávy", icon: "solar:chat-round-bold", href: "/messages" },
  { id: "profile", label: "Profil", icon: "solar:buildings-bold", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const tabs = profile?.role === "employer" ? employerTabs : workerTabs;
  const currentTab = tabs.find((t) => pathname.startsWith(t.href))?.id || "jobs";

  return (
    <nav className="flex items-center justify-around px-6 py-4 bg-background/90 backdrop-blur-2xl border-t border-border z-20 pb-safe shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.href)}
          className={`flex flex-col items-center gap-1.5 transition-colors group ${
            currentTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {/* @ts-expect-error - iconify-icon is a web component */}
          <iconify-icon
            icon={tab.icon}
            class="size-7 group-active:scale-90 transition-transform"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
