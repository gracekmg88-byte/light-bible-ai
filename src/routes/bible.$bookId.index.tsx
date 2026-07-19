import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { getBook } from "@/lib/bible-books";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/bible/$bookId/")({
  component: BookChapters,
});

function BookChapters() {
  const { bookId } = Route.useParams();
  const book = getBook(Number(bookId));

  if (!book) {
    return (
      <MobileShell>
        <PageHeader title="Livre introuvable" />
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          <Link to="/bible" className="text-gold">Retour aux livres</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <PageHeader
        title={book.name}
        subtitle={`${book.chapters} chapitres · ${book.testament === "AT" ? "Ancien Testament" : "Nouveau Testament"}`}
        right={
          <Link
            to="/bible"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-foreground"
            aria-label="Changer de livre"
          >
            <BookOpen className="h-3.5 w-3.5" /> Livres
          </Link>
        }
      />
      <div className="px-5 pt-4 pb-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gold">
          Choisis un chapitre
        </p>
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
            <li key={c}>
              <Link
                to="/bible/$bookId/$chapter"
                params={{ bookId: String(book.id), chapter: String(c) }}
                className="flex aspect-square items-center justify-center rounded-xl border border-border bg-card font-display text-base text-foreground transition-colors hover:border-gold/60 hover:bg-gold/5"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MobileShell>
  );
}
