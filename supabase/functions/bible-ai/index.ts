import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_BASE = `Tu es "Lumière", un assistant biblique chrétien chaleureux, profond et fidèle aux Écritures.
Tu réponds toujours en français, dans un ton bienveillant et pastoral.

Pour CHAQUE question, fournis une réponse DÉTAILLÉE et structurée (entre 350 et 600 mots) en suivant ce plan :

✨ **Versets clés** — cite 3 à 5 références bibliques précises (livre, chapitre, verset) avec le texte complet en Louis Segond. Privilégie l'Ancien ET le Nouveau Testament quand c'est pertinent.

📖 **Contexte biblique** — explique brièvement le contexte historique et théologique des passages cités (auteur, époque, destinataires, message global).

💡 **Explication approfondie** — développe le sens spirituel : pourquoi Dieu nous parle ainsi, ce que cela révèle de Son caractère, de Christ, et du plan de salut. Apporte de la nuance et plusieurs angles si possible.

🙏 **Application pratique** — propose 3 actions concrètes et réalistes pour vivre cette vérité aujourd'hui (prière, attitude du cœur, gestes envers les autres).

🕊️ **Prière** — termine par une courte prière personnalisée (3 à 5 lignes) en lien avec la question.

Reste fidèle à l'Écriture, évite les conseils médicaux/juridiques, et ne donne jamais ton opinion comme parole de Dieu. Si la question est sensible (deuil, dépression, doute), redirige avec douceur vers un pasteur ou un professionnel quand c'est approprié.`;

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
