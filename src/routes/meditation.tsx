import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileShell, PageHeader } from "@/components/MobileShell";
import { INSTRUMENTALS, type Instrumental } from "@/lib/instrumentals";
import { Play, Pause, Sparkles, Maximize2, Minimize2, Volume2 } from "lucide-react";
import { toast } from "sonner";

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
  const [current, setCurrent] = useState<Instrumental | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [focus, setFocus] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  // Wake Lock pendant le mode focus
  useEffect(() => {
    const acquire = async () => {
      try {
        // @ts-ignore
        if (focus && "wakeLock" in navigator) {
          // @ts-ignore
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch { /* noop */ }
    };
    const release = () => {
      try { wakeLockRef.current?.release?.(); wakeLockRef.current = null; } catch {}
    };
    if (focus) acquire(); else release();
    return release;
  }, [focus]);

  const select = (i: Instrumental) => {
    setCurrent(i);
    setTimeout(() => {
      const a = audioRef.current;
      if (!a) return;
      a.src = i.url;
      a.loop = true;
      a.volume = volume;
      a.play().then(() => setPlaying(true)).catch(() => toast.error("Impossible de lire l'audio"));
    }, 50);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)); }
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
            Choisis une ambiance pour accompagner ta méditation.
          </p>
        </div>

        <ul className="mt-4 space-y-2">
          {INSTRUMENTALS.map((i) => {
            const active = current?.id === i.id;
            return (
              <li key={i.id}>
                <button
                  onClick={() => (active ? toggle() : select(i))}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                    active ? "border-gold/60 bg-gold/5 shadow-glow" : "border-border bg-card hover:border-gold/40"
                  }`}
                >
                  <div>
                    <p className="font-display text-base">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{i.mood}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-gradient-gold text-gold-foreground" : "bg-secondary"}`}>
                    {active && playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

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
              Active "Ne pas déranger" sur ton téléphone pour bloquer les autres notifications.
            </p>
          </div>
        )}
      </div>

      <audio ref={audioRef} />

      {focus && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-8 text-center">
          <div className="absolute inset-0 bg-gradient-aurora opacity-20" />
          <div className="relative z-10">
            <Sparkles className="mx-auto h-10 w-10 text-gold animate-pulse" />
            <h2 className="mt-6 font-display text-3xl">Sois en paix.</h2>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              « Tiens-toi tranquille devant l'Éternel, et espère en lui. » — Ps 37:7
            </p>
            {current && (
              <p className="mt-6 text-xs uppercase tracking-widest text-gold">{current.title}</p>
            )}
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
