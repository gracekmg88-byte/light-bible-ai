import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { getPlan } from "@/lib/reading-plans";
import { getBook } from "@/lib/bible-books";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Bell, BellOff, Check, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/plans/$planId")({
  component: PlanDetail,
});

function PlanDetail() {
  const { planId } = Route.useParams();
  const plan = getPlan(planId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<Set<number>>(new Set());
  const [reminder, setReminder] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(`reminder:${planId}`) : null
  );

  useEffect(() => {
    if (!user || !plan) return;
    supabase
      .from("reading_plans_progress")
      .select("day")
      .eq("user_id", user.id)
      .eq("plan_id", plan.id)
      .then(({ data }) => setDone(new Set((data ?? []).map((d) => d.day))));
  }, [user, plan]);

  if (!plan) return <MobileShell><div className="p-8 text-center">Plan introuvable</div></MobileShell>;

  const progress = Math.round((done.size / plan.days) * 100);

  const toggleDay = async (day: number) => {
    if (!user) {
      toast.info("Connecte-toi pour suivre ta progression");
      navigate({ to: "/auth" });
      return;
    }
    if (done.has(day)) {
      await supabase.from("reading_plans_progress").delete().match({ user_id: user.id, plan_id: plan.id, day });
      setDone((s) => { const n = new Set(s); n.delete(day); return n; });
    } else {
      await supabase.from("reading_plans_progress").insert({ user_id: user.id, plan_id: plan.id, day });
      setDone((s) => new Set(s).add(day));
      toast.success(`Jour ${day} terminé 🙏`);
    }
  };

  const enableReminder = async () => {
    if (!("Notification" in window)) { toast.error("Notifications indisponibles"); return; }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") { toast.error("Permission refusée"); return; }
    const time = "08:00";
    localStorage.setItem(`reminder:${planId}`, time);
    setReminder(time);
    toast.success(`Rappel quotidien activé à ${time}`);
  };

  const disableReminder = () => {
    localStorage.removeItem(`reminder:${planId}`);
    setReminder(null);
    toast.info("Rappel désactivé");
  };

  return (
    <MobileShell>
      <PageHeader title={plan.title} subtitle={`${plan.subtitle} · ${plan.days} jours`} />
      <div className="px-5 pt-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gold">Progression</p>
              <p className="mt-1 font-display text-2xl">{done.size}<span className="text-muted-foreground">/{plan.days}</span></p>
            </div>
            <button
              onClick={reminder ? disableReminder : enableReminder}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs hover:border-gold/50"
            >
              {reminder ? <><BellOff className="h-3.5 w-3.5" /> {reminder}</> : <><Bell className="h-3.5 w-3.5" /> Rappel</>}
            </button>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>

        <ul className="mt-6 space-y-2 pb-4">
          {plan.schedule.map((readings, i) => {
            const day = i + 1;
            const isDone = done.has(day);
            return (
              <li
                key={day}
                className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
                  isDone ? "border-gold/40 bg-gold/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      isDone ? "border-gold bg-gold text-gold-foreground" : "border-border"
                    }`}
                    aria-label={`Marquer jour ${day}`}
                  >
                    {isDone && <Check className="h-4 w-4" />}
                  </button>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Jour {day}</p>
                    <p className="font-display text-sm">
                      {readings.map((r) => `${getBook(r.bookId)?.name ?? ""} ${r.chapter}`).join(" · ")}
                    </p>
                  </div>
                </div>
                <Link
                  to="/bible/$bookId/$chapter"
                  params={{ bookId: String(readings[0].bookId), chapter: String(readings[0].chapter) }}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs hover:border-gold/50"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Lire
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </MobileShell>
  );
}
