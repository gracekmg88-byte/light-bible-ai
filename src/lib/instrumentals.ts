// Instrumentaux libres (Pixabay - licence libre) pour la prière et la méditation.
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
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_8a8b8b8b8b.mp3",
  },
  {
    id: "soft-worship",
    title: "Adoration douce",
    mood: "Cœur ouvert",
    url: "https://cdn.pixabay.com/audio/2023/06/19/audio_24a4ec4f37.mp3",
  },
  {
    id: "ambient-light",
    title: "Lumière ambiante",
    mood: "Méditation profonde",
    url: "https://cdn.pixabay.com/audio/2024/02/07/audio_d5e3e8e835.mp3",
  },
  {
    id: "celestial-strings",
    title: "Cordes célestes",
    mood: "Élévation & louange",
    url: "https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3",
  },
];
