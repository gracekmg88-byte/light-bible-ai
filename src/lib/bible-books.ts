// Bolls.life book IDs map to standard 1..66. French names (Louis Segond 1910).
export type BibleBook = {
  id: number;
  name: string;
  abbr: string;
  chapters: number;
  testament: "AT" | "NT";
};

export const BIBLE_BOOKS: BibleBook[] = [
  { id: 1, name: "Genèse", abbr: "Gn", chapters: 50, testament: "AT" },
  { id: 2, name: "Exode", abbr: "Ex", chapters: 40, testament: "AT" },
  { id: 3, name: "Lévitique", abbr: "Lv", chapters: 27, testament: "AT" },
  { id: 4, name: "Nombres", abbr: "Nb", chapters: 36, testament: "AT" },
  { id: 5, name: "Deutéronome", abbr: "Dt", chapters: 34, testament: "AT" },
  { id: 6, name: "Josué", abbr: "Jos", chapters: 24, testament: "AT" },
  { id: 7, name: "Juges", abbr: "Jg", chapters: 21, testament: "AT" },
  { id: 8, name: "Ruth", abbr: "Rt", chapters: 4, testament: "AT" },
  { id: 9, name: "1 Samuel", abbr: "1S", chapters: 31, testament: "AT" },
  { id: 10, name: "2 Samuel", abbr: "2S", chapters: 24, testament: "AT" },
  { id: 11, name: "1 Rois", abbr: "1R", chapters: 22, testament: "AT" },
  { id: 12, name: "2 Rois", abbr: "2R", chapters: 25, testament: "AT" },
  { id: 13, name: "1 Chroniques", abbr: "1Ch", chapters: 29, testament: "AT" },
  { id: 14, name: "2 Chroniques", abbr: "2Ch", chapters: 36, testament: "AT" },
  { id: 15, name: "Esdras", abbr: "Esd", chapters: 10, testament: "AT" },
  { id: 16, name: "Néhémie", abbr: "Né", chapters: 13, testament: "AT" },
  { id: 17, name: "Esther", abbr: "Est", chapters: 10, testament: "AT" },
  { id: 18, name: "Job", abbr: "Jb", chapters: 42, testament: "AT" },
  { id: 19, name: "Psaumes", abbr: "Ps", chapters: 150, testament: "AT" },
  { id: 20, name: "Proverbes", abbr: "Pr", chapters: 31, testament: "AT" },
  { id: 21, name: "Ecclésiaste", abbr: "Ec", chapters: 12, testament: "AT" },
  { id: 22, name: "Cantique des Cantiques", abbr: "Ct", chapters: 8, testament: "AT" },
  { id: 23, name: "Ésaïe", abbr: "És", chapters: 66, testament: "AT" },
  { id: 24, name: "Jérémie", abbr: "Jé", chapters: 52, testament: "AT" },
  { id: 25, name: "Lamentations", abbr: "La", chapters: 5, testament: "AT" },
  { id: 26, name: "Ézéchiel", abbr: "Éz", chapters: 48, testament: "AT" },
  { id: 27, name: "Daniel", abbr: "Da", chapters: 12, testament: "AT" },
  { id: 28, name: "Osée", abbr: "Os", chapters: 14, testament: "AT" },
  { id: 29, name: "Joël", abbr: "Jl", chapters: 3, testament: "AT" },
  { id: 30, name: "Amos", abbr: "Am", chapters: 9, testament: "AT" },
  { id: 31, name: "Abdias", abbr: "Ab", chapters: 1, testament: "AT" },
  { id: 32, name: "Jonas", abbr: "Jon", chapters: 4, testament: "AT" },
  { id: 33, name: "Michée", abbr: "Mi", chapters: 7, testament: "AT" },
  { id: 34, name: "Nahum", abbr: "Na", chapters: 3, testament: "AT" },
  { id: 35, name: "Habacuc", abbr: "Ha", chapters: 3, testament: "AT" },
  { id: 36, name: "Sophonie", abbr: "So", chapters: 3, testament: "AT" },
  { id: 37, name: "Aggée", abbr: "Ag", chapters: 2, testament: "AT" },
  { id: 38, name: "Zacharie", abbr: "Za", chapters: 14, testament: "AT" },
  { id: 39, name: "Malachie", abbr: "Ml", chapters: 4, testament: "AT" },
  { id: 40, name: "Matthieu", abbr: "Mt", chapters: 28, testament: "NT" },
  { id: 41, name: "Marc", abbr: "Mc", chapters: 16, testament: "NT" },
  { id: 42, name: "Luc", abbr: "Lc", chapters: 24, testament: "NT" },
  { id: 43, name: "Jean", abbr: "Jn", chapters: 21, testament: "NT" },
  { id: 44, name: "Actes", abbr: "Ac", chapters: 28, testament: "NT" },
  { id: 45, name: "Romains", abbr: "Rm", chapters: 16, testament: "NT" },
  { id: 46, name: "1 Corinthiens", abbr: "1Co", chapters: 16, testament: "NT" },
  { id: 47, name: "2 Corinthiens", abbr: "2Co", chapters: 13, testament: "NT" },
  { id: 48, name: "Galates", abbr: "Ga", chapters: 6, testament: "NT" },
  { id: 49, name: "Éphésiens", abbr: "Ép", chapters: 6, testament: "NT" },
  { id: 50, name: "Philippiens", abbr: "Ph", chapters: 4, testament: "NT" },
  { id: 51, name: "Colossiens", abbr: "Col", chapters: 4, testament: "NT" },
  { id: 52, name: "1 Thessaloniciens", abbr: "1Th", chapters: 5, testament: "NT" },
  { id: 53, name: "2 Thessaloniciens", abbr: "2Th", chapters: 3, testament: "NT" },
  { id: 54, name: "1 Timothée", abbr: "1Tm", chapters: 6, testament: "NT" },
  { id: 55, name: "2 Timothée", abbr: "2Tm", chapters: 4, testament: "NT" },
  { id: 56, name: "Tite", abbr: "Tt", chapters: 3, testament: "NT" },
  { id: 57, name: "Philémon", abbr: "Phm", chapters: 1, testament: "NT" },
  { id: 58, name: "Hébreux", abbr: "Hé", chapters: 13, testament: "NT" },
  { id: 59, name: "Jacques", abbr: "Jc", chapters: 5, testament: "NT" },
  { id: 60, name: "1 Pierre", abbr: "1P", chapters: 5, testament: "NT" },
  { id: 61, name: "2 Pierre", abbr: "2P", chapters: 3, testament: "NT" },
  { id: 62, name: "1 Jean", abbr: "1Jn", chapters: 5, testament: "NT" },
  { id: 63, name: "2 Jean", abbr: "2Jn", chapters: 1, testament: "NT" },
  { id: 64, name: "3 Jean", abbr: "3Jn", chapters: 1, testament: "NT" },
  { id: 65, name: "Jude", abbr: "Jude", chapters: 1, testament: "NT" },
  { id: 66, name: "Apocalypse", abbr: "Ap", chapters: 22, testament: "NT" },
];

export const getBook = (id: number) => BIBLE_BOOKS.find((b) => b.id === id);

export type Verse = { pk: number; verse: number; text: string };

// Cache local des chapitres (offline-first).
const CACHE_PREFIX = "bible.chapter.";
function cacheKey(bookId: number, chapter: number, version: string) {
  return `${CACHE_PREFIX}${version}.${bookId}.${chapter}`;
}
function readCache(bookId: number, chapter: number, version: string): Verse[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(bookId, chapter, version));
    return raw ? (JSON.parse(raw) as Verse[]) : null;
  } catch { return null; }
}
function writeCache(bookId: number, chapter: number, version: string, verses: Verse[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(cacheKey(bookId, chapter, version), JSON.stringify(verses)); }
  catch { /* quota plein, ignorer */ }
}

// Bolls.life public API + cache offline.
export async function fetchChapter(bookId: number, chapter: number, version: string = "FRLSG"): Promise<Verse[]> {
  try {
    const res = await fetch(`https://bolls.life/get-text/${version}/${bookId}/${chapter}/`);
    if (!res.ok) throw new Error("Erreur de chargement du chapitre");
    const data = (await res.json()) as Array<{ pk: number; verse: number; text: string }>;
    const verses = data.map((v) => ({ ...v, text: v.text.replace(/<[^>]+>/g, "").trim() }));
    writeCache(bookId, chapter, version, verses);
    return verses;
  } catch (err) {
    const cached = readCache(bookId, chapter, version);
    if (cached) return cached;
    throw err;
  }
}

// Récupère un verset précis dans une version (pour la comparaison).
export async function fetchVerse(bookId: number, chapter: number, verse: number, version: string): Promise<string | null> {
  try {
    const verses = await fetchChapter(bookId, chapter, version);
    return verses.find((v) => v.verse === verse)?.text ?? null;
  } catch { return null; }
}

// Verset du jour stable (basé sur la date)
const DAILY_VERSES: Array<{ book: number; ch: number; v: number }> = [
  { book: 19, ch: 23, v: 1 }, { book: 43, ch: 3, v: 16 }, { book: 50, ch: 4, v: 13 },
  { book: 45, ch: 8, v: 28 }, { book: 23, ch: 41, v: 10 }, { book: 20, ch: 3, v: 5 },
  { book: 19, ch: 46, v: 1 }, { book: 40, ch: 11, v: 28 }, { book: 60, ch: 5, v: 7 },
  { book: 43, ch: 14, v: 27 }, { book: 24, ch: 29, v: 11 }, { book: 19, ch: 119, v: 105 },
  { book: 45, ch: 12, v: 12 }, { book: 49, ch: 2, v: 8 }, { book: 50, ch: 4, v: 6 },
  { book: 19, ch: 27, v: 1 }, { book: 6, ch: 1, v: 9 }, { book: 23, ch: 40, v: 31 },
  { book: 40, ch: 5, v: 16 }, { book: 19, ch: 37, v: 4 }, { book: 50, ch: 4, v: 7 },
  { book: 45, ch: 5, v: 8 }, { book: 19, ch: 1, v: 1 }, { book: 43, ch: 8, v: 32 },
  { book: 58, ch: 11, v: 1 }, { book: 19, ch: 91, v: 1 }, { book: 40, ch: 6, v: 33 },
  { book: 47, ch: 5, v: 17 }, { book: 19, ch: 34, v: 8 }, { book: 51, ch: 3, v: 23 },
  { book: 23, ch: 26, v: 3 },
];
export function getDailyRef() {
  const day = Math.floor(Date.now() / 86_400_000);
  return DAILY_VERSES[day % DAILY_VERSES.length];
}
