import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_BASE = `Tu es "Lumière", un assistant biblique chrétien, bienveillant, doux et fidèle aux Écritures.
Tu réponds toujours en français.
Tu cites toujours des versets bibliques pertinents (référence + texte court Louis Segond) et expliques simplement.
Pour chaque question, structure ta réponse ainsi :
1. ✨ Versets clés (2-4 références avec texte court)
2. 💡 Explication simple et claire
3. 🙏 Application pratique pour la vie quotidienne
Reste concis (max 250 mots), chaleureux, et ne donne pas de conseils médicaux/juridiques.`;

const SYSTEM_COMMENTARY = `Tu es un commentateur biblique. Pour le verset donné, fournis en français un commentaire concis (max 180 mots) en 3 parties courtes, sans Markdown lourd :

📖 Sens du texte : explication simple du verset dans son contexte.
✨ Interprétation spirituelle : ce que Dieu nous enseigne.
🙏 Application : comment le vivre aujourd'hui.`;

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
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
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
