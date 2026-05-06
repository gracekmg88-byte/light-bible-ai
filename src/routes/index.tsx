import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { fetchChapter, getBook, getDailyRef } from "@/lib/bible-books";
import { getPlan } from "@/lib/reading-plans";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/user-settings";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Book as BookIcon, Star, ArrowRight, Sun, CalendarDays, Music, Clock, TrendingUp, History, Shield, User } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bible Lumière — Lire, méditer, comprendre" },
      { name: "description", content: "Bible Louis Segond avec assistant IA, commentaires et méditations quotidiennes." },
      { property: "og:title", content: "Bible Lumière" },
      { property: "og:description", content: "Une Bible intelligente pour grandir dans la foi." },
    ],
  }),
  component: Home,
});

type Stats = { totalMin: number; avgPct: number; sessions: number };

function Home() {
  const ref = getDailyRef();
  const book = getBook(ref.book)!;
  const [verse, setVerse] = useState<string>("");
  const { user } = useAuth();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [doneDays, setDoneDays] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<Stats>({ totalMin: 0, avgPct: 0, sessions: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchChapter(ref.book, ref.ch)
      .then((vs) => setVerse(vs.find((v) => v.verse === ref.v)?.text ?? ""))
      .catch(() => setVerse(""));
  }, [ref.book, ref.ch, ref.v]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await getSettings(user.id);
      const planId = s?.active_plan_id ?? localStorage.getItem("bl:active_plan");
      setActivePlanId(planId);
      if (planId) {
        const { data } = await supabase
          .from("reading_plans_progress")
          .select("day").eq("user_id", user.id).eq("plan_id", planId);
        setDoneDays(new Set((data ?? []).map((d) => d.day)));
      }
      const { data: sess } = await supabase
        .from("reading_sessions")
        .select("duration_seconds, completion_percent")
        .eq("user_id", user.id);
      if (sess && sess.length) {
        const totalSec = sess.reduce((a, x) => a + (x.duration_seconds ?? 0), 0);
        const avg = Math.round(sess.reduce((a, x) => a + (x.completion_percent ?? 0), 0) / sess.length);
        setStats({ totalMin: Math.round(totalSec / 60), avgPct: avg, sessions: sess.length });
      }
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!roleRow);
    })();
  }, [user]);

  const plan = activePlanId ? getPlan(activePlanId) : null;
  const nextDay = plan
    ? (() => { for (let d = 1; d <= plan.days; d++) if (!doneDays.has(d)) return d; return null; })()
    : null;
  const nextReading = plan && nextDay ? plan.schedule[nextDay - 1]?.[0] : null;
  const planProgress = plan ? Math.round((doneDays.size / plan.days) * 100) : 0;

  return (
    <MobileShell>
      <section className="relative overflow-hidden px-5 pt-10 pb-8">
        <div className="absolute inset-x-0 -top-20 mx-auto h-64 w-64 rounded-full bg-gradient-aurora opacity-30 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
            <Sun className="h-3.5 w-3.5" /> Bible Lumière
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">
            Que ta Parole<br/>
            <span className="bg-gradient-gold bg-clip-text text-transparent">soit ma lumière.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Lis, médite et comprends les Écritures, accompagné par une intelligence spirituelle.
          </p>
        </div>
      </section>

      {/* Verset du jour */}
      <section className="px-5">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-glow">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">Verset du jour</p>
          <p className="mt-3 font-display text-xl italic leading-snug text-foreground">
            « {verse || "…"} »
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{book.name} {ref.ch}:{ref.v}</span>
            <Link
              to="/bible/$bookId/$chapter"
              params={{ bookId: String(ref.book), chapter: String(ref.ch) }}
              className="inline-flex items-center gap-1 text-sm font-medium text-gold"
            >
              Lire <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Plan en cours */}
      {plan && nextReading && (
        <section className="mt-6 px-5">
          <div className="rounded-3xl border border-gold/30 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">Plan en cours</p>
              <span className="text-xs text-muted-foreground">{doneDays.size}/{plan.days} jours</span>
            </div>
            <p className="mt-2 font-display text-lg">{plan.title}</p>
            <Progress value={planProgress} className="mt-3" />
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary/40 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Prochain</p>
                <p className="font-display text-sm">{getBook(nextReading.bookId)?.name} {nextReading.chapter}</p>
              </div>
              <Link
                to="/bible/$bookId/$chapter"
                params={{ bookId: String(nextReading.bookId), chapter: String(nextReading.chapter) }}
                onClick={() => {
                  localStorage.setItem("bl:active_plan", plan.id);
                  if (nextDay) localStorage.setItem(`bl:plan_day:${nextReading.bookId}:${nextReading.chapter}`, String(nextDay));
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-gold px-3 py-2 text-xs font-medium text-gold-foreground"
              >
                Lire <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Mon dashboard */}
      {user && stats.sessions > 0 && (
        <section className="mt-6 px-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Mon dashboard</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={<Clock className="h-4 w-4" />} value={`${stats.totalMin}`} unit="min" label="Lecture" />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} value={`${stats.avgPct}`} unit="%" label="Compréhension" />
            <StatCard icon={<BookIcon className="h-4 w-4" />} value={`${stats.sessions}`} unit="" label="Séances" />
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="mt-6 grid grid-cols-2 gap-3 px-5">
        <ActionCard to="/bible" icon={<BookIcon className="h-5 w-5" />} title="Lire la Bible" desc="Ancien & Nouveau Testament" />
        <ActionCard to="/assistant" icon={<Sparkles className="h-5 w-5" />} title="Assistant IA" desc="Pose une question" />
        <ActionCard to="/plans" icon={<CalendarDays className="h-5 w-5" />} title="Plans de lecture" desc="7, 30 ou 90 jours" />
        <ActionCard to="/meditation" icon={<Music className="h-5 w-5" />} title="Méditation" desc="Instrumentales" />
        <ActionCard to="/favoris" icon={<Star className="h-5 w-5" />} title="Mes favoris" desc="Versets sauvegardés" />
        <ActionCard to="/historique" icon={<History className="h-5 w-5" />} title="Historique" desc="Mes séances" />
        <ActionCard to="/profil" icon={<User className="h-5 w-5" />} title="Profil" desc="Mon compte" />
        {isAdmin && <ActionCard to="/admin" icon={<Shield className="h-5 w-5" />} title="Admin" desc="Tableau de bord" />}
      </section>
    </MobileShell>
  );
}

function StatCard({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-aurora">{icon}</div>
      <p className="font-display text-lg leading-none">
        {value}<span className="text-xs text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-gold/50 hover:shadow-glow">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-aurora text-foreground">
        {icon}
      </div>
      <p className="font-display text-base text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
