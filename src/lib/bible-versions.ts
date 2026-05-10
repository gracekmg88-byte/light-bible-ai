// Versions disponibles via l'API publique Bolls.life (IDs vérifiés)
export type BibleVersion = {
  id: string;
  name: string;
  short: string;
  lang: "fr" | "en";
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "FRLSG",   name: "Louis Segond 1910",         short: "LSG",  lang: "fr" },
  { id: "NBS",     name: "Nouvelle Bible Segond",     short: "NBS",  lang: "fr" },
  { id: "BDS",     name: "Bible du Semeur",           short: "BDS",  lang: "fr" },
  { id: "FRPDV17", name: "Parole de Vie 2017",        short: "PDV",  lang: "fr" },
  { id: "FRDBY",   name: "Darby (français)",          short: "DBY",  lang: "fr" },
  { id: "KJV",     name: "King James Version",        short: "KJV",  lang: "en" },
  { id: "NIV",     name: "New International Ver.",    short: "NIV",  lang: "en" },
  { id: "ESV",     name: "English Standard Ver.",     short: "ESV",  lang: "en" },
];

const KEY = "bible.version";
export const DEFAULT_VERSION = "FRLSG";

export function getVersion(): string {
  if (typeof window === "undefined") return DEFAULT_VERSION;
  const v = localStorage.getItem(KEY) || DEFAULT_VERSION;
  // Migration : anciennes versions invalides -> LSG
  if (!BIBLE_VERSIONS.find((b) => b.id === v)) {
    localStorage.setItem(KEY, DEFAULT_VERSION);
    return DEFAULT_VERSION;
  }
  return v;
}
export function setVersion(v: string) {
  localStorage.setItem(KEY, v);
}
