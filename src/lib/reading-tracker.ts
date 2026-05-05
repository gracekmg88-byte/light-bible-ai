import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Args = {
  userId: string | null;
  bookId: number;
  bookName: string;
  chapter: number;
  containerRef: React.RefObject<HTMLElement | null>;
  ready: boolean; // true when verses loaded
};

/**
 * Track time spent + scroll-based completion %, then save a reading_session
 * row when the user leaves or completes the chapter.
 */
export function useReadingTracker({ userId, bookId, bookName, chapter, containerRef, ready }: Args) {
  const startRef = useRef<number>(Date.now());
  const maxPctRef = useRef<number>(0);
  const savedRef = useRef<boolean>(false);

  // Reset on chapter change
  useEffect(() => {
    startRef.current = Date.now();
    maxPctRef.current = 0;
    savedRef.current = false;
  }, [bookId, chapter]);

  // Track scroll %
  useEffect(() => {
    if (!ready) return;
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      const viewport = window.innerHeight;
      // How far the bottom of the viewport has reached relative to article
      const scrolled = Math.min(total, Math.max(0, viewport - rect.top));
      const pct = Math.round((scrolled / total) * 100);
      if (pct > maxPctRef.current) maxPctRef.current = Math.min(100, pct);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [ready, containerRef]);

  // Save on unmount / pagehide
  useEffect(() => {
    const save = () => {
      if (savedRef.current || !userId) return;
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      const pct = maxPctRef.current;
      if (duration < 5 && pct < 5) return; // skip ghost visits
      savedRef.current = true;
      const planId = typeof window !== "undefined" ? localStorage.getItem("bl:active_plan") : null;
      const planDayStr = typeof window !== "undefined" ? localStorage.getItem(`bl:plan_day:${bookId}:${chapter}`) : null;
      void supabase.from("reading_sessions").insert({
        user_id: userId,
        book_id: bookId,
        book_name: bookName,
        chapter,
        duration_seconds: duration,
        completion_percent: pct,
        plan_id: planId,
        plan_day: planDayStr ? Number(planDayStr) : null,
      });
    };
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
    };
  }, [userId, bookId, bookName, chapter]);
}
