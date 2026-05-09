// Versions disponibles via l'API publique Bolls.life
export type BibleVersion = {
  id: string;        // code Bolls
  name: string;      // nom complet
  short: string;     // étiquette courte
  lang: "fr" | "en";
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "FRLSG",   name: "Louis Segond 1910",      short: "LSG",  lang: "fr" },
  { id: "FRDBY",   name: "Darby (français)",       short: "DBY",  lang: "fr" },
  { id: "FRCRA",   name: "Crampon",                 short: "CRA",  lang: "fr" },
  { id: "FRMART",  name: "Martin 1744",             short: "MAR",  lang: "fr" },
  { id: "FROST",   name: "Ostervald",               short: "OST",  lang: "fr" },
  { id: "KJV",     name: "King James Version",      short: "KJV",  lang: "en" },
  { id: "NIV",     name: "New International Ver.",  short: "NIV",  lang: "en" },
  { id: "ESV",     name: "English Standard Ver.",   short: "ESV",  lang: "en" },
];

const KEY = "bible.version";
export const DEFAULT_VERSION = "FRLSG";

export function getVersion(): string {
  if (typeof window === "undefined") return DEFAULT_VERSION;
  return localStorage.getItem(KEY) || DEFAULT_VERSION;
}
export function setVersion(v: string) {
  localStorage.setItem(KEY, v);
}
