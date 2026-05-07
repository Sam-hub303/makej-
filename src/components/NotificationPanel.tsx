"use client";

import { useNotifications, type AppNotif } from "./NotificationProvider";

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Právě teď";
  if (diff < 3600) return `Před ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Před ${Math.floor(diff / 3600)} hod`;
  return `Před ${Math.floor(diff / 86400)} dny`;
}

const ICONS: Record<AppNotif["type"], string> = {
  message: "solar:chat-round-bold",
  accepted: "solar:check-circle-bold",
  new_candidate: "solar:user-plus-bold",
};

const COLORS: Record<AppNotif["type"], string> = {
  message: "bg-primary/20 text-primary",
  accepted: "bg-secondary/20 text-secondary",
  new_candidate: "bg-primary/20 text-primary",
};

export default function NotificationPanel() {
  const { notifs, panelOpen, closePanel, markAllRead, navigateToNotif } = useNotifications();

  if (!panelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closePanel}
      />

      {/* Panel — slides up from bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] flex flex-col bg-card/95 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] edit-mode">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 className="font-heading text-lg font-black text-white">Oznámení</h2>
          <div className="flex items-center gap-3">
            {notifs.some((n) => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-primary hover:underline"
              >
                Vše přečteno
              </button>
            )}
            <button
              onClick={closePanel}
              className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              {/* @ts-expect-error - web component */}
              <iconify-icon icon="solar:close-bold" class="size-5 text-white" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {/* @ts-expect-error - web component */}
                <iconify-icon icon="solar:bell-off-line-duotone" class="size-8 text-primary/40" />
              </div>
              <p className="font-bold text-white/60 mb-1">Žádná oznámení</p>
              <p className="text-white/30 text-xs">Nová oznámení se zobrazí zde</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifs.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => navigateToNotif(notif)}
                  className={`w-full flex items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-white/5 active:bg-white/10 ${!notif.read ? "bg-primary/5" : ""}`}
                >
                  {/* Icon */}
                  <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${COLORS[notif.type]}`}>
                    {/* @ts-expect-error - web component */}
                    <iconify-icon icon={ICONS[notif.type]} class="size-5" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{notif.title}</span>
                      {!notif.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-white/60 text-xs mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mt-1">{timeAgo(notif.at)}</p>
                  </div>

                  {/* Arrow */}
                  {/* @ts-expect-error - web component */}
                  <iconify-icon icon="solar:alt-arrow-right-bold" class="size-4 text-white/20 shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom safe area spacer */}
        <div className="pb-safe shrink-0" />
      </div>
    </>
  );
}
