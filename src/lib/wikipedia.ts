// Récupère un résumé Wikipédia (REST API publique, sans clé).
export type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
};

export async function fetchWikiSummary(query: string, lang = "fr"): Promise<WikiSummary | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const d: any = await r.json();
    if (d.type === "disambiguation" || !d.extract) return null;
    return {
      title: d.title,
      extract: d.extract,
      thumbnail: d.thumbnail?.source,
      url: d.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(query)}`,
    };
  } catch {
    return null;
  }
}
