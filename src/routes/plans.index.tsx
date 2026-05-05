import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { READING_PLANS } from "@/lib/reading-plans";
import { CalendarDays, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/plans/")({
  head: () => ({
    meta: [
      { title: "Plans de lecture — Bible Lumière" },
      { name: "description", content: "Plans de lecture biblique en 7, 30 ou 90 jours avec progression et rappels." },
    ],
  }),
  component: PlansIndex,
});

function PlansIndex() {
  return (
    <MobileShell>
      <PageHeader title="Plans de lecture" subtitle="Avance jour après jour" />
      <div className="space-y-3 px-5 pt-6">
        {READING_PLANS.map((p) => (
          <Link
            key={p.id}
            to="/plans/$planId"
            params={{ planId: p.id }}
            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-gold/50 hover:shadow-glow"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-aurora">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.subtitle} · {p.days} jours</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">{p.description}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
