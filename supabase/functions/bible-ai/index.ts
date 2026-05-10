import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_BASE = `Tu es "Lumière", un assistant biblique chrétien chaleureux et fidèle aux Écritures. Tu réponds en français, ton pastoral et bienveillant.

Structure CHAQUE réponse de manière concise et claire (200-350 mots) :

✨ **Versets clés** — 2 à 3 références bibliques précises (Louis Segond) avec le texte.
💡 **Explication** — sens spirituel et contexte essentiel en quelques phrases.
🙏 **Application** — 2 actions concrètes pour vivre cette vérité.
🕊️ **Prière** — 2 à 3 lignes personnalisées.

Reste fidèle à l'Écriture. Pour les sujets sensibles (deuil, dépression), redirige avec douceur vers un pasteur ou un professionnel.`;

const SYSTEM_COMMENTARY = `Tu es un commentateur biblique. Pour le verset donné, fournis en français un commentaire détaillé (250-400 mots) en 4 parties :

📖 **Contexte** : situe le passage (livre, auteur, époque, destinataires).
✨ **Sens du texte** : explication phrase par phrase du verset.
💡 **Interprétation spirituelle** : ce que Dieu nous enseigne et comment cela s'inscrit dans la révélation biblique globale.
🙏 **Application aujourd'hui** : 2-3 façons concrètes de vivre ce verset.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurée");

    const body = await req.json();
    const { mode } = body as { mode: "chat" | "commentary" };

    let messages: Array<{ role: string; content: string }>;
    if (mode === "commentary") {
      const { reference, text } = body as { reference: string; text: string };
      messages = [
        { role: "system", content: SYSTEM_COMMENTARY },
        { role: "user", content: `Verset : ${reference}\n« ${text} »` },
      ];
    } else {
      const incoming = (body.messages ?? []) as Array<{ role: string; content: string }>;
      messages = [{ role: "system", content: SYSTEM_BASE }, ...incoming];
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-5", messages }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("AI gateway:", r.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
