// Instrumentaux libres pour la prière et la méditation.
// URLs publiques stables. Remplaçables par tes propres morceaux.
export type Instrumental = {
  id: string;
  title: string;
  mood: string;
  url: string;
};

export const INSTRUMENTALS: Instrumental[] = [
  {
    id: "peaceful-piano",
    title: "Piano paisible",
    mood: "Calme & contemplation",
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_a8e603753c.mp3?filename=relaxing-piano-music-22380.mp3",
  },
  {
    id: "soft-worship",
    title: "Adoration douce",
    mood: "Cœur ouvert",
    url: "https://cdn.pixabay.com/download/audio/2022/10/18/audio_3c5f8e2167.mp3?filename=worship-piano-115668.mp3",
  },
  {
    id: "ambient-light",
    title: "Lumière ambiante",
    mood: "Méditation profonde",
    url: "https://cdn.pixabay.com/download/audio/2023/02/28/audio_550482721b.mp3?filename=ambient-piano-amp-strings-10711.mp3",
  },
  {
    id: "celestial-strings",
    title: "Cordes célestes",
    mood: "Élévation & louange",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=spiritual-meditation-7800.mp3",
  },
];
