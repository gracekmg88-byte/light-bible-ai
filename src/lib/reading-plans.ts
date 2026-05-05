// Plans de lecture biblique. Chaque jour = une ou plusieurs références.
export type DayReading = { bookId: number; chapter: number };
export type ReadingPlan = {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  description: string;
  schedule: DayReading[][]; // schedule[i] = lectures du jour i+1
};

// Helpers
const range = (bookId: number, from: number, to: number): DayReading[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ bookId, chapter: from + i }));

// 7 jours — Les essentiels de l'Évangile (Jean)
const PLAN_7: DayReading[][] = Array.from({ length: 7 }, (_, i) => [{ bookId: 43, chapter: i + 1 }]);

// 30 jours — Sagesse & Évangile (Proverbes 1–15 + Marc 1–15)
const PLAN_30: DayReading[][] = Array.from({ length: 30 }, (_, i) =>
  i < 15
    ? [{ bookId: 20, chapter: i + 1 }]
    : [{ bookId: 41, chapter: i - 14 }]
);

// 90 jours — Nouveau Testament (Matthieu→Apocalypse, ~3 ch/jour pour 260 chapitres)
const NT_BOOKS: Array<[number, number]> = [
  [40, 28], [41, 16], [42, 24], [43, 21], [44, 28], [45, 16], [46, 16], [47, 13],
  [48, 6], [49, 6], [50, 4], [51, 4], [52, 5], [53, 3], [54, 6], [55, 4],
  [56, 3], [57, 1], [58, 13], [59, 5], [60, 5], [61, 3], [62, 5], [63, 1],
  [64, 1], [65, 1], [66, 22],
];
const NT_ALL: DayReading[] = NT_BOOKS.flatMap(([b, n]) => range(b, 1, n));
const PLAN_90: DayReading[][] = (() => {
  const perDay = Math.ceil(NT_ALL.length / 90);
  return Array.from({ length: 90 }, (_, i) => NT_ALL.slice(i * perDay, (i + 1) * perDay));
})();

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "essentiel-7",
    title: "L'Évangile en 7 jours",
    subtitle: "Évangile de Jean",
    days: 7,
    description: "Découvre Jésus à travers l'Évangile de Jean, un chapitre par jour.",
    schedule: PLAN_7,
  },
  {
    id: "sagesse-30",
    title: "Sagesse en 30 jours",
    subtitle: "Proverbes & Marc",
    days: 30,
    description: "15 jours de sagesse pratique (Proverbes), puis 15 jours dans la vie de Jésus (Marc).",
    schedule: PLAN_30,
  },
  {
    id: "nt-90",
    title: "Le Nouveau Testament en 90 jours",
    subtitle: "De Matthieu à l'Apocalypse",
    days: 90,
    description: "Lis tout le Nouveau Testament en 3 mois, environ 3 chapitres par jour.",
    schedule: PLAN_90,
  },
];

export const getPlan = (id: string) => READING_PLANS.find((p) => p.id === id);
