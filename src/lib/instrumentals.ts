// Instrumentaux pour la méditation. Sources publiques avec CORS ouvert.
export type Instrumental = {
  id: string;
  title: string;
  mood: string;
  url: string;
};

// Sources fiables avec CORS ouvert (SoundHelix - démos libres).
// Les administrateurs peuvent en ajouter via le tableau de bord.
export const INSTRUMENTALS: Instrumental[] = [
  {
    id: "peaceful-1",
    title: "Lumière douce",
    mood: "Calme & contemplation",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "peaceful-2",
    title: "Souffle de paix",
    mood: "Cœur ouvert",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "peaceful-3",
    title: "Vers les hauteurs",
    mood: "Méditation profonde",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "peaceful-4",
    title: "Élévation",
    mood: "Adoration & louange",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  },
];
