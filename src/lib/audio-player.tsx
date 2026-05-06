import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Instrumental } from "@/lib/instrumentals";

type AudioCtx = {
  current: Instrumental | null;
  playing: boolean;
  volume: number;
  play: (i: Instrumental) => void;
  toggle: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
};

const Ctx = createContext<AudioCtx | null>(null);

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Instrumental | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVol] = useState(0.7);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!audioRef.current) {
      const a = document.createElement("audio");
      a.loop = true;
      a.preload = "auto";
      a.crossOrigin = "anonymous";
      audioRef.current = a;
    }
    const a = audioRef.current;
    a.volume = volume;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("error", onError);
    };
  }, [volume]);

  const play = (i: Instrumental) => {
    const a = audioRef.current;
    if (!a) return;
    if (current?.id !== i.id) {
      a.src = i.url;
      setCurrent(i);
    }
    a.play().catch(() => setPlaying(false));
  };
  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };
  const stop = () => {
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
    setCurrent(null);
  };
  const setVolume = (v: number) => {
    setVol(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return <Ctx.Provider value={{ current, playing, volume, play, toggle, stop, setVolume }}>{children}</Ctx.Provider>;
}

export function useGlobalAudio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGlobalAudio must be used inside GlobalAudioProvider");
  return v;
}
