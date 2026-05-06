import { useGlobalAudio } from "@/lib/audio-player";
import { Pause, Play, X, Music } from "lucide-react";

/** Mini player flottant qui apparaît dès qu'un instrumental est sélectionné. */
export function MiniPlayer() {
  const { current, playing, toggle, stop } = useGlobalAudio();
  if (!current) return null;
  return (
    <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-card/95 p-2.5 pl-3 shadow-glow backdrop-blur">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-aurora">
          <Music className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm leading-tight">{current.title}</p>
          <p className="truncate text-[10px] text-muted-foreground">{current.mood}</p>
        </div>
        <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={stop} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
