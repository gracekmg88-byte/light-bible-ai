import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getBook } from "@/lib/bible-books";
import { getPlan } from "@/lib/reading-plans";
import { Clock, BookOpen, Target } from "lucide-react";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique — Bible Lumière" },
      { name: "description", content: "Tes séances de lecture passées." },
    ],
  }),
  component: HistoryPage,
});

type Session = {
  id: string;
  book_id: number;
  book_name: string;
  chapter: number;
  duration_seconds: number;
  completion_percent: number;
  plan_id: string | null;
  plan_day: number | null;
  created_at: string;
};

function HistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { setSessions((data ?? []) as Session[]); setLoading(false); });
  }, [user]);

  if (!user) {
    return (
      <MobileShell>
        <PageHeader title="Historique" />
        <div className="px-5 pt-10 text-center">
          <p className="text-sm text-muted-foreground">Connecte-toi pour voir ton historique.</p>
          <Link to="/auth" className="mt-4 inline-block rounded-xl bg-gradient-gold px-4 py-2 text-sm text-gold-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <PageHeader title="Historique" subtitle={`${sessions.length} séance${sessions.length > 1 ? "s" : ""}`} />
      <div className="px-5 pt-6 pb-4">
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Aucune séance pour le moment. Commence à lire !</p>
            <Link to="/bible" className="mt-4 inline-block rounded-xl bg-gradient-gold px-4 py-2 text-sm text-gold-foreground">Lire la Bible</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const plan = s.plan_id ? getPlan(s.plan_id) : null;
              const min = Math.max(1, Math.round(s.duration_seconds / 60));
              return (
                <li key={s.id}>
                  <Link
                    to="/bible/$bookId/$chapter"
                    params={{ bookId: String(s.book_id), chapter: String(s.chapter) }}
                    className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-base">{s.book_name} {s.chapter}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(s.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                        {plan && (
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-gold">
                            {plan.title} · Jour {s.plan_day}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg leading-none">{s.completion_percent}<span className="text-xs text-muted-foreground">%</span></p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" /> {min} min</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-gradient-gold" style={{ width: `${s.completion_percent}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
