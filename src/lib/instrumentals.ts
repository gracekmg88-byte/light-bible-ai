// Instrumentaux pour la méditation. Sources publiques avec CORS ouvert.
export type Instrumental = {
  id: string;
  title: string;
  mood: string;
  url: string;
};

// Sources: archive.org (CORS *) — domaine public / licence libre.
export const INSTRUMENTALS: Instrumental[] = [
  {
    id: "peaceful-piano",
    title: "Piano paisible",
    mood: "Calme & contemplation",
    url: "https://archive.org/download/relaxing-piano-music_202005/relaxing-piano-music.mp3",
  },
  {
    id: "soft-worship",
    title: "Adoration douce",
    mood: "Cœur ouvert",
    url: "https://archive.org/download/AmazingGracePianoInstrumental/Amazing%20Grace%20-%20Piano%20Instrumental.mp3",
  },
  {
    id: "ambient-light",
    title: "Lumière ambiante",
    mood: "Méditation profonde",
    url: "https://archive.org/download/AmbientMusicForMeditation/Ambient%20Music%20for%20Meditation.mp3",
  },
  {
    id: "celestial-strings",
    title: "Hymne — Be Thou My Vision",
    mood: "Élévation & louange",
    url: "https://archive.org/download/BeThouMyVisionInstrumental/Be%20Thou%20My%20Vision%20-%20Instrumental.mp3",
  },
];
