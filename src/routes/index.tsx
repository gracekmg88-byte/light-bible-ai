import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { fetchChapter, getBook, getDailyRef } from "@/lib/bible-books";
import { Sparkles, Book as BookIcon, Star, ArrowRight, Sun, CalendarDays } from "lucide-react";

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

function Home() {
  const ref = getDailyRef();
  const book = getBook(ref.book)!;
  const [verse, setVerse] = useState<string>("");

  useEffect(() => {
    fetchChapter(ref.book, ref.ch)
      .then((vs) => setVerse(vs.find((v) => v.verse === ref.v)?.text ?? ""))
      .catch(() => setVerse(""));
  }, [ref.book, ref.ch, ref.v]);

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

      {/* Actions */}
      <section className="mt-6 grid grid-cols-2 gap-3 px-5">
        <ActionCard to="/bible" icon={<BookIcon className="h-5 w-5" />} title="Lire la Bible" desc="Ancien & Nouveau Testament" />
        <ActionCard to="/assistant" icon={<Sparkles className="h-5 w-5" />} title="Assistant IA" desc="Pose une question" />
        <ActionCard to="/favoris" icon={<Star className="h-5 w-5" />} title="Mes favoris" desc="Versets sauvegardés" />
        <ActionCard to="/plans" icon={<CalendarDays className="h-5 w-5" />} title="Plans de lecture" desc="7, 30 ou 90 jours" />
      </section>
    </MobileShell>
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
