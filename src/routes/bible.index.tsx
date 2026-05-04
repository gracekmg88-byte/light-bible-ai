import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { Search } from "lucide-react";

export const Route = createFileRoute("/bible/")({
  head: () => ({
    meta: [
      { title: "La Bible — Bible Lumière" },
      { name: "description", content: "Parcourir les 66 livres de la Bible Louis Segond." },
    ],
  }),
  component: BibleIndex,
});

function BibleIndex() {
  const [q, setQ] = useState("");
  const filter = (t: "AT" | "NT") =>
    BIBLE_BOOKS.filter((b) => b.testament === t && b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <MobileShell>
      <PageHeader title="La Bible" subtitle="Louis Segond 1910" />
      <div className="px-5 pt-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un livre…"
            className="w-full rounded-2xl border border-border bg-input py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
        </label>
      </div>

      <Section title="Ancien Testament" books={filter("AT")} />
      <Section title="Nouveau Testament" books={filter("NT")} />
    </MobileShell>
  );
}

function Section({ title, books }: { title: string; books: typeof BIBLE_BOOKS }) {
  if (books.length === 0) return null;
  return (
    <section className="mt-6 px-5">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gold">{title}</h2>
      <ul className="grid grid-cols-2 gap-2">
        {books.map((b) => (
          <li key={b.id}>
            <Link
              to="/bible/$bookId/$chapter"
              params={{ bookId: String(b.id), chapter: "1" }}
              className="block rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:border-gold/50"
            >
              <p className="font-display text-sm text-foreground">{b.name}</p>
              <p className="text-[10px] text-muted-foreground">{b.chapters} chapitres</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
