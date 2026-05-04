import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant biblique — Bible Lumière" },
      { name: "description", content: "Pose tes questions spirituelles et reçois des réponses ancrées dans les Écritures." },
    ],
  }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Que dit la Bible sur la peur ?",
  "Comment prier selon Jésus ?",
  "Versets sur l'espérance",
  "Que faire face à la souffrance ?",
];

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("bible-ai", {
        body: { mode: "chat", messages: next },
      });
      if (error) throw error;
      setMessages((m) => [...m, { role: "assistant", content: data.text ?? "" }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Je ne peux pas répondre pour le moment. Réessaie dans un instant." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 50);
    }
  };

  return (
    <MobileShell>
      <PageHeader title="Assistant" subtitle="Une lumière dans la Parole" />

      <div ref={scrollRef} className="px-5 pt-4">
        {messages.length === 0 ? (
          <div className="py-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-aurora shadow-glow">
                <Sparkles className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="font-display text-xl">Pose ta question</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recherche de versets, méditation, application pratique.</p>
            </div>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm hover:border-gold/50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-gradient-gold text-gold-foreground" : "border border-border bg-card text-foreground"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border glass p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Pose ta question…"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
          <button type="submit" disabled={!input.trim() || loading} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-gold text-gold-foreground disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </MobileShell>
  );
}
