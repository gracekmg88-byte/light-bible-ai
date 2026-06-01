import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { fetchChapter, getBook, type Verse } from "@/lib/bible-books";
import { BIBLE_VERSIONS, getVersion, setVersion } from "@/lib/bible-versions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReadingTracker } from "@/lib/reading-tracker";
import { ChevronLeft, ChevronRight, Star, Volume2, MessageCircle, Type, X, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bible/$bookId/$chapter")({
  component: ChapterPage,
});

function ChapterPage() {
  const { bookId, chapter } = Route.useParams();
  const navigate = useNavigate();
  const book = getBook(Number(bookId));
  const ch = Number(chapter);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersionState] = useState<string>(getVersion());
  const [showVersions, setShowVersions] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [favSet, setFavSet] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<Verse | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [explLoading, setExplLoading] = useState(false);
  const { user } = useAuth();
  const articleRef = useRef<HTMLElement>(null);
  useReadingTracker({
    userId: user?.id ?? null,
    bookId: book?.id ?? 0,
    bookName: book?.name ?? "",
    chapter: ch,
    containerRef: articleRef,
    ready: !loading && verses.length > 0,
  });

  useEffect(() => {
    if (!book) return;
    setLoading(true);
    fetchChapter(book.id, ch, version)
      .then((vs) => setVerses(vs))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [book, ch, version]);

  useEffect(() => {
    if (!user || !book) return;
    supabase
      .from("favorites")
      .select("verse")
      .eq("user_id", user.id)
      .eq("book_id", book.id)
      .eq("chapter", ch)
      .then(({ data }) => setFavSet(new Set((data ?? []).map((d) => d.verse))));
  }, [user, book, ch]);

  if (!book) return <div className="p-8 text-center">Livre introuvable</div>;

  const prev = ch > 1 ? ch - 1 : null;
  const next = ch < book.chapters ? ch + 1 : null;

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && next) {
      navigate({ to: "/bible/$bookId/$chapter", params: { bookId, chapter: String(next) } });
    } else if (dx > 0 && prev) {
      navigate({ to: "/bible/$bookId/$chapter", params: { bookId, chapter: String(prev) } });
    }
  };

  const toggleFav = async (v: Verse) => {
    if (!user) {
      toast.info("Connecte-toi pour sauvegarder");
      navigate({ to: "/auth" });
      return;
    }
    if (favSet.has(v.verse)) {
      await supabase.from("favorites").delete().match({ user_id: user.id, book_id: book.id, chapter: ch, verse: v.verse });
      setFavSet((s) => { const n = new Set(s); n.delete(v.verse); return n; });
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id, book_id: book.id, book_name: book.name, chapter: ch, verse: v.verse, text: v.text,
      });
      setFavSet((s) => new Set(s).add(v.verse));
      toast.success("Ajouté aux favoris");
    }
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) { toast.error("Audio indisponible"); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const [chapterPlaying, setChapterPlaying] = useState(false);
  const playChapter = () => {
    if (!("speechSynthesis" in window)) { toast.error("Audio indisponible"); return; }
    if (chapterPlaying) {
      window.speechSynthesis.cancel();
      setChapterPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    setChapterPlaying(true);
    verses.forEach((v, i) => {
      const u = new SpeechSynthesisUtterance(v.text);
      u.lang = "fr-FR";
      u.rate = 0.95;
      if (i === verses.length - 1) u.onend = () => setChapterPlaying(false);
      window.speechSynthesis.speak(u);
    });
  };

  const openCommentary = async (v: Verse) => {
    setActive(v);
    setExplanation("");
    setExplLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bible-ai", {
        body: { mode: "commentary", reference: `${book.name} ${ch}:${v.verse}`, text: v.text },
      });
      if (error) throw error;
      setExplanation(data.text ?? "");
    } catch (e: any) {
      setExplanation("Impossible de charger le commentaire pour le moment.");
    } finally {
      setExplLoading(false);
    }
  };

  return (
    <MobileShell>
      <PageHeader
        title={`${book.name} ${ch}`}
        subtitle={book.testament === "AT" ? "Ancien Testament" : "Nouveau Testament"}
        right={
          <div className="flex items-center gap-1">
            <button onClick={() => setShowVersions(true)} className="rounded-lg border border-border px-2 py-1.5 text-[10px] font-bold tracking-wider text-gold" aria-label="Changer de version">
              {BIBLE_VERSIONS.find((v) => v.id === version)?.short ?? "LSG"}
            </button>
            <button onClick={playChapter} disabled={loading || verses.length === 0} className={`rounded-lg border p-2 ${chapterPlaying ? "border-gold/60 bg-gold/10 text-gold" : "border-border text-foreground"}`} aria-label="Écouter le chapitre">
              <Volume2 className="h-4 w-4" />
            </button>
            <button onClick={() => setFontSize((s) => Math.max(13, s - 1))} className="rounded-lg border border-border p-2 text-muted-foreground"><Type className="h-3.5 w-3.5" /></button>
            <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} className="rounded-lg border border-border p-2 text-foreground"><Type className="h-4 w-4" /></button>
          </div>
        }
      />

      <div className="px-5 pt-6 pb-4 touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-muted" />)}</div>
        ) : (
          <article ref={articleRef} className="space-y-3" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
            {verses.map((v) => (
              <p
                key={v.pk}
                onClick={() => setActive(v)}
                className={`cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-secondary/50 ${
                  favSet.has(v.verse) ? "bg-gold/5" : ""
                }`}
              >
                <sup className="mr-1.5 font-display text-xs font-bold text-gold">{v.verse}</sup>
                {v.text}
              </p>
            ))}
          </article>
        )}
      </div>

      {/* Nav prev/next */}
      <div className="flex items-center justify-between px-5 pb-6">
        {prev ? (
          <Link to="/bible/$bookId/$chapter" params={{ bookId, chapter: String(prev) }} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm">
            <ChevronLeft className="h-4 w-4" /> Ch. {prev}
          </Link>
        ) : <span />}
        {next ? (
          <Link to="/bible/$bookId/$chapter" params={{ bookId, chapter: String(next) }} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm">
            Ch. {next} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : <span />}
      </div>

      {/* Action sheet on selected verse */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 shadow-soft animate-in slide-in-from-bottom">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gold">{book.name} {ch}:{active.verse}</p>
                <p className="mt-2 font-display text-base italic">« {active.text} »</p>
              </div>
              <button onClick={() => setActive(null)} className="rounded-lg p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <ActionBtn icon={<Star className={`h-4 w-4 ${favSet.has(active.verse) ? "fill-gold text-gold" : ""}`} />} label="Favori" onClick={() => toggleFav(active)} />
              <ActionBtn icon={<Volume2 className="h-4 w-4" />} label="Écouter" onClick={() => speak(active.text)} />
              <ActionBtn icon={<MessageCircle className="h-4 w-4" />} label="Commentaire" onClick={() => openCommentary(active)} />
            </div>
            {(explLoading || explanation) && (
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold">
                  <Sparkles className="h-3 w-3" /> Commentaire spirituel
                </p>
                {explLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{explanation}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setShowVersions(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold">
                <BookOpen className="h-3 w-3" /> Choisir une version
              </p>
              <button onClick={() => setShowVersions(false)} className="rounded-lg p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              {BIBLE_VERSIONS.map((v) => (
                <li key={v.id}>
                  <button
                    onClick={() => { setVersion(v.id); setVersionState(v.id); setShowVersions(false); }}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${version === v.id ? "border-gold/60 bg-gold/5" : "border-border bg-secondary/30"}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{v.lang === "fr" ? "Français" : v.lang === "sw" ? "Kiswahili" : "English"} · {v.short}</p>
                    </div>
                    {version === v.id && <span className="text-[10px] font-bold text-gold">ACTIF</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-secondary/40 py-3 text-xs hover:border-gold/50">
      {icon}{label}
    </button>
  );
}
