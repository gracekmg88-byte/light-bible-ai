import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { fetchChapter, fetchVerse, getBook, type Verse } from "@/lib/bible-books";
import { BIBLE_VERSIONS, DEFAULT_VERSION, getVersion, setVersion } from "@/lib/bible-versions";
import { fetchWikiSummary, type WikiSummary } from "@/lib/wikipedia";
import { getVoices, onVoicesReady, getPreferredVoiceName, setPreferredVoiceName, speak, speakQueue, stopSpeaking } from "@/lib/tts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReadingTracker } from "@/lib/reading-tracker";
import { ChevronLeft, ChevronRight, Star, Volume2, MessageCircle, Type, X, Sparkles, BookOpen, GitCompare, Mic, Globe, ExternalLink, CheckSquare, Square } from "lucide-react";
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
  // CRITICAL : init au DEFAULT pour éviter le mismatch SSR/hydratation, puis sync localStorage.
  const [version, setVersionState] = useState<string>(DEFAULT_VERSION);
  useEffect(() => { setVersionState(getVersion()); }, []);
  const [showVersions, setShowVersions] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [favSet, setFavSet] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<Verse | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [explLoading, setExplLoading] = useState(false);

  // Sélection multiple + comparaison
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareData, setCompareData] = useState<Record<string, Record<number, string | null>>>({});
  const [compareLoading, setCompareLoading] = useState(false);

  // Wikipedia
  const [wikiOpen, setWikiOpen] = useState(false);
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);

  // TTS voices
  const [showVoices, setShowVoices] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  useEffect(() => {
    setVoiceName(getPreferredVoiceName());
    const off = onVoicesReady(() => setVoices(getVoices()));
    return off;
  }, []);

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
      .catch(() => toast.error("Erreur de chargement (mode hors-ligne : seuls les chapitres déjà lus sont disponibles)"))
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

  // Reset sélection au changement de chapitre
  useEffect(() => { setSelected(new Set()); setSelectMode(false); }, [bookId, chapter]);

  if (!book) return <div className="p-8 text-center">Livre introuvable</div>;

  const prev = ch > 1 ? ch - 1 : null;
  const next = ch < book.chapters ? ch + 1 : null;
  const lang = BIBLE_VERSIONS.find((v) => v.id === version)?.lang ?? "fr";
  const langCode = lang === "sw" ? "sw-KE" : lang === "en" ? "en-US" : "fr-FR";

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || selectMode) { touchStart.current = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && next) navigate({ to: "/bible/$bookId/$chapter", params: { bookId, chapter: String(next) } });
    else if (dx > 0 && prev) navigate({ to: "/bible/$bookId/$chapter", params: { bookId, chapter: String(prev) } });
  };

  const toggleFav = async (v: Verse) => {
    if (!user) { toast.info("Connecte-toi pour sauvegarder"); navigate({ to: "/auth" }); return; }
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

  const [chapterPlaying, setChapterPlaying] = useState(false);
  const playChapter = () => {
    if (!("speechSynthesis" in window)) { toast.error("Audio indisponible"); return; }
    if (chapterPlaying) { stopSpeaking(); setChapterPlaying(false); return; }
    setChapterPlaying(true);
    speakQueue(verses.map((v) => v.text), langCode, 0.95, () => setChapterPlaying(false));
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
    } catch {
      setExplanation("Impossible de charger le commentaire pour le moment.");
    } finally {
      setExplLoading(false);
    }
  };

  // Verset cliqué
  const onVerseClick = (v: Verse) => {
    if (selectMode) {
      setSelected((s) => {
        const n = new Set(s);
        if (n.has(v.verse)) n.delete(v.verse); else n.add(v.verse);
        return n;
      });
    } else {
      setActive(v);
    }
  };

  // Comparaison
  const openCompare = async () => {
    const versesToCompare = selected.size > 0
      ? verses.filter((v) => selected.has(v.verse))
      : active ? [active] : [];
    if (versesToCompare.length === 0) { toast.info("Sélectionne au moins un verset"); return; }
    setCompareOpen(true);
    setCompareLoading(true);
    setActive(null);
    const result: Record<string, Record<number, string | null>> = {};
    await Promise.all(
      BIBLE_VERSIONS.map(async (ver) => {
        result[ver.id] = {};
        await Promise.all(
          versesToCompare.map(async (v) => {
            if (ver.id === version) { result[ver.id][v.verse] = v.text; return; }
            result[ver.id][v.verse] = await fetchVerse(book.id, ch, v.verse, ver.id);
          })
        );
      })
    );
    setCompareData(result);
    setCompareLoading(false);
  };

  const openWiki = async () => {
    setWikiOpen(true);
    setWikiLoading(true);
    setWiki(null);
    const queries = [`${book.name} (livre de la Bible)`, `Livre de ${book.name}`, book.name];
    for (const q of queries) {
      const s = await fetchWikiSummary(q, "fr");
      if (s) { setWiki(s); break; }
    }
    setWikiLoading(false);
  };

  const compareVerses = useMemo(
    () => selected.size > 0 ? verses.filter((v) => selected.has(v.verse)) : (active ? [active] : []),
    [selected, verses, active]
  );

  return (
    <MobileShell>
      <PageHeader
        title={`${book.name} ${ch}`}
        subtitle={book.testament === "AT" ? "Ancien Testament" : "Nouveau Testament"}
        right={
          <div className="flex items-center gap-1">
            <Link to="/bible" className="rounded-lg border border-border p-2 text-foreground" aria-label="Tous les livres"><BookOpen className="h-4 w-4" /></Link>
            <Link to="/bible/$bookId" params={{ bookId }} className="rounded-lg border border-border px-2 py-1.5 text-[10px] font-bold tracking-wider text-foreground" aria-label="Chapitres du livre">CH.</Link>
            <button onClick={() => setShowVersions(true)} className="rounded-lg border border-border px-2 py-1.5 text-[10px] font-bold tracking-wider text-gold" aria-label="Changer de version">
              {BIBLE_VERSIONS.find((v) => v.id === version)?.short ?? "LSG"}
            </button>
            <button onClick={openWiki} className="rounded-lg border border-border p-2 text-foreground" aria-label="Wikipédia"><Globe className="h-4 w-4" /></button>
            <button onClick={() => setShowVoices(true)} className="rounded-lg border border-border p-2 text-foreground" aria-label="Voix"><Mic className="h-4 w-4" /></button>
            <button onClick={playChapter} disabled={loading || verses.length === 0} className={`rounded-lg border p-2 ${chapterPlaying ? "border-gold/60 bg-gold/10 text-gold" : "border-border text-foreground"}`} aria-label="Écouter le chapitre">
              <Volume2 className="h-4 w-4" />
            </button>
            <button onClick={() => setFontSize((s) => Math.max(13, s - 1))} className="rounded-lg border border-border p-2 text-muted-foreground"><Type className="h-3.5 w-3.5" /></button>
            <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} className="rounded-lg border border-border p-2 text-foreground"><Type className="h-4 w-4" /></button>
          </div>
        }
      />

      {/* Barre sélection */}
      <div className="flex items-center justify-between px-5 pt-3">
        <button
          onClick={() => { setSelectMode((m) => !m); if (selectMode) setSelected(new Set()); }}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs ${selectMode ? "border-gold/60 bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}
        >
          {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {selectMode ? `${selected.size} sélectionné(s)` : "Sélection multiple"}
        </button>
        {selectMode && selected.size > 0 && (
          <button onClick={openCompare} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-gold px-3 py-1.5 text-xs font-medium text-gold-foreground">
            <GitCompare className="h-3.5 w-3.5" /> Comparer
          </button>
        )}
      </div>

      <div className="px-5 pt-3 pb-4 touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-muted" />)}</div>
        ) : (
          <article ref={articleRef} className="space-y-3" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
            {verses.map((v) => {
              const isSel = selected.has(v.verse);
              return (
                <p
                  key={v.pk}
                  onClick={() => onVerseClick(v)}
                  className={`cursor-pointer rounded-lg px-2 py-1 transition-colors ${
                    isSel ? "bg-gold/15 ring-1 ring-gold/40"
                    : favSet.has(v.verse) ? "bg-gold/5"
                    : "hover:bg-secondary/50"
                  }`}
                >
                  <sup className="mr-1.5 font-display text-xs font-bold text-gold">{v.verse}</sup>
                  {v.text}
                </p>
              );
            })}
          </article>
        )}
      </div>

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

      {/* Action sheet on selected verse — SCROLLABLE */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-card shadow-soft animate-in slide-in-from-bottom">
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-gold">{book.name} {ch}:{active.verse}</p>
                <p className="mt-2 font-display text-base italic">« {active.text} »</p>
              </div>
              <button onClick={() => setActive(null)} className="rounded-lg p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 px-5">
              <ActionBtn icon={<Star className={`h-4 w-4 ${favSet.has(active.verse) ? "fill-gold text-gold" : ""}`} />} label="Favori" onClick={() => toggleFav(active)} />
              <ActionBtn icon={<Volume2 className="h-4 w-4" />} label="Écouter" onClick={() => speak(active.text, langCode)} />
              <ActionBtn icon={<GitCompare className="h-4 w-4" />} label="Comparer" onClick={openCompare} />
              <ActionBtn icon={<MessageCircle className="h-4 w-4" />} label="Commenter" onClick={() => openCommentary(active)} />
            </div>
            {(explLoading || explanation) && (
              <div className="mx-5 my-4 flex-1 overflow-y-auto rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold">
                  <Sparkles className="h-3 w-3" /> Commentaire spirituel
                </p>
                {explLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{explanation}</p>
                )}
              </div>
            )}
            {!explLoading && !explanation && <div className="h-5" />}
          </div>
        </div>
      )}

      {/* Versions */}
      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setShowVersions(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 shadow-soft">
            <SheetHeader icon={<BookOpen className="h-3 w-3" />} title="Choisir une version" onClose={() => setShowVersions(false)} />
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

      {/* Comparaison */}
      {compareOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setCompareOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-card shadow-soft animate-in slide-in-from-bottom">
            <div className="p-5 pb-3">
              <SheetHeader icon={<GitCompare className="h-3 w-3" />} title={`Comparer · ${compareVerses.map((v) => v.verse).join(", ")}`} onClose={() => setCompareOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
              {compareLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />)}
                </div>
              ) : (
                compareVerses.map((v) => (
                  <div key={v.verse}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gold">{book.name} {ch}:{v.verse}</p>
                    <div className="space-y-2">
                      {BIBLE_VERSIONS.map((ver) => {
                        const txt = compareData[ver.id]?.[v.verse];
                        return (
                          <div key={ver.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{ver.short} · {ver.lang}</p>
                            <p className="mt-1 text-sm leading-relaxed">{txt ?? <span className="text-muted-foreground italic">Indisponible</span>}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wikipédia */}
      {wikiOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setWikiOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-card shadow-soft animate-in slide-in-from-bottom">
            <div className="p-5 pb-3">
              <SheetHeader icon={<Globe className="h-3 w-3" />} title={`Wikipédia · ${book.name}`} onClose={() => setWikiOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {wikiLoading ? (
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ) : wiki ? (
                <div>
                  {wiki.thumbnail && <img src={wiki.thumbnail} alt={wiki.title} className="mb-3 max-h-48 rounded-xl object-cover" />}
                  <p className="font-display text-lg">{wiki.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{wiki.extract}</p>
                  <a href={wiki.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-gold">
                    Lire sur Wikipédia <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun article trouvé.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voix TTS */}
      {showVoices && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={() => setShowVoices(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 shadow-soft">
            <SheetHeader icon={<Mic className="h-3 w-3" />} title="Voix de lecture" onClose={() => setShowVoices(false)} />
            <p className="mb-3 text-[11px] text-muted-foreground">Voix disponibles sur ton appareil. Le choix s'applique à la lecture des versets et du chapitre.</p>
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              <li>
                <button
                  onClick={() => { setPreferredVoiceName(null); setVoiceName(null); setShowVoices(false); }}
                  className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${!voiceName ? "border-gold/60 bg-gold/5" : "border-border bg-secondary/30"}`}
                >
                  <p className="text-sm font-medium">Auto (selon la langue)</p>
                  {!voiceName && <span className="text-[10px] font-bold text-gold">ACTIF</span>}
                </button>
              </li>
              {voices.map((v) => (
                <li key={v.name}>
                  <button
                    onClick={() => { setPreferredVoiceName(v.name); setVoiceName(v.name); setShowVoices(false); }}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${voiceName === v.name ? "border-gold/60 bg-gold/5" : "border-border bg-secondary/30"}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{v.lang}{v.default ? " · par défaut" : ""}</p>
                    </div>
                    {voiceName === v.name && <span className="text-[10px] font-bold text-gold">ACTIF</span>}
                  </button>
                </li>
              ))}
              {voices.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucune voix détectée sur cet appareil.</p>}
            </ul>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-secondary/40 py-3 text-[11px] hover:border-gold/50">
      {icon}{label}
    </button>
  );
}

function SheetHeader({ icon, title, onClose }: { icon: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold">{icon} {title}</p>
      <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
    </div>
  );
}
