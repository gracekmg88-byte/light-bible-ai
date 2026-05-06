import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSettings } from "@/lib/user-settings";

/**
 * Enregistre le service worker et lui transmet l'heure du rappel.
 * Permet de recevoir une notification système même quand l'app est en arrière-plan.
 */
export function ReminderScheduler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    let cancelled = false;

    const setup = async () => {
      // Vérif support
      if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

      // Demande permission
      if (Notification.permission === "default") {
        try { await Notification.requestPermission(); } catch {}
      }

      // Enregistre le SW
      let reg: ServiceWorkerRegistration | null = null;
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      } catch (e) {
        console.warn("SW registration failed", e);
        return;
      }
      if (cancelled || !reg) return;

      const s = await getSettings(user.id);
      const target = reg.active || (await navigator.serviceWorker.ready).active;
      if (!target) return;
      if (s?.reminder_enabled && Notification.permission === "granted") {
        target.postMessage({ type: "SCHEDULE_REMINDER", time: s.reminder_time });
      } else {
        target.postMessage({ type: "CANCEL_REMINDER" });
      }
    };

    setup();
    return () => { cancelled = true; };
  }, [user]);

  return null;
}
