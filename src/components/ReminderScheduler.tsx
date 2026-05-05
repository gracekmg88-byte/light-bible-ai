import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSettings } from "@/lib/user-settings";

/**
 * Local in-tab daily reminder. While the app is open, fires a Notification
 * at the user's chosen time (once per day). For background reminders an
 * installed PWA / Service Worker would be required.
 */
export function ReminderScheduler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    let cancelled = false;
    let timeoutId: number | undefined;

    const schedule = async () => {
      const s = await getSettings(user.id);
      if (cancelled || !s || !s.reminder_enabled) return;
      const [hh, mm] = s.reminder_time.split(":").map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
      const delay = target.getTime() - now.getTime();
      timeoutId = window.setTimeout(() => {
        if (!cancelled && "Notification" in window && Notification.permission === "granted") {
          new Notification("Bible Lumière", {
            body: "C'est l'heure de ta lecture quotidienne 🙏",
            icon: "/favicon.ico",
          });
        }
        schedule(); // re-arm for next day
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [user]);

  return null;
}
