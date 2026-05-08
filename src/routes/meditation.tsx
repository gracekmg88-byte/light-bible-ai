import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { INSTRUMENTALS, type Instrumental } from "@/lib/instrumentals";
import { useGlobalAudio } from "@/lib/audio-player";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Sparkles, Maximize2, Minimize2, Volume2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/meditation")({
  head: () => ({
    meta: [
      { title: "Méditation & Prière — Bible Lumière" },
      { name: "description", content: "Instrumentales de prière et mode méditation sans distractions." },
    ],
  }),
  component: MeditationPage,
});

function MeditationPage() {
  const { current, playing, loading, volume, play, toggle, setVolume } = useGlobalAudio();
  const [focus, setFocus] = useState(false);
  const [customs, setCustoms] = useState<Instrumental[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("custom_instrumentals")
        .select("id,title,mood,storage_path")
        .order("created_at", { ascending: false });
      if (!data) return;
      const list = data.map((d) => {
        const { data: pub } = supabase.storage.from("instrumentals").getPublicUrl(d.storage_path);
        return { id: d.id, title: d.title, mood: d.mood || "Importé", url: pub.publicUrl };
      });
      setCustoms(list);
    })();
  }, []);

  const all = [...customs, ...INSTRUMENTALS];

  const select = (i: Instrumental) => {
    if (current?.id === i.id) toggle();
    else play(i);
  };

  return (
    <MobileShell>
      <PageHeader title="Méditation" subtitle="Prière & contemplation" />
      <div className="px-5 pt-6 pb-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-glow">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold">
            <Sparkles className="h-3 w-3" /> Instrumentales de prière
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Choisis une ambiance — elle continue de jouer même quand tu lis la Bible.
          </p>
        </div>

        {all.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune instrumentale disponible pour le moment. Un administrateur peut en importer depuis le tableau de bord.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {all.map((i) => {
              const active = current?.id === i.id;
              return (
                <li key={i.id}>
                  <button
                    onClick={() => select(i)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                      active ? "border-gold/60 bg-gold/5 shadow-glow" : "border-border bg-card hover:border-gold/40"
                    }`}
                  >
                    <div>
                      <p className="font-display text-base">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.mood}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-gradient-gold text-gold-foreground" : "bg-secondary"}`}>
                      {active && loading ? <Loader2 className="h-4 w-4 animate-spin" /> : active && playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {current && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input
                type="range" min={0} max={1} step={0.01} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.82_0.13_85)]"
              />
            </div>
            <button
              onClick={() => setFocus(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-medium text-gold-foreground"
            >
              <Maximize2 className="h-4 w-4" /> Mode Méditation (sans distraction)
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Active "Ne pas déranger" sur ton téléphone pour bloquer les notifications.
            </p>
          </div>
        )}
      </div>

      {focus && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-8 text-center">
          <div className="absolute inset-0 bg-gradient-aurora opacity-20" />
          <div className="relative z-10">
            <Sparkles className="mx-auto h-10 w-10 text-gold animate-pulse" />
            <h2 className="mt-6 font-display text-3xl">Sois en paix.</h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              « Tiens-toi tranquille devant l'Éternel, et espère en lui. » — Ps 37:7
            </p>
            {current && <p className="mt-6 text-xs uppercase tracking-widest text-gold">{current.title}</p>}
            <div className="mt-8 flex items-center justify-center gap-3">
              <button onClick={toggle} className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground">
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={() => setFocus(false)} className="flex h-14 w-14 items-center justify-center rounded-full border border-border">
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
