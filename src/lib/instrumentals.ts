// Instrumentaux : uniquement ceux importés par les administrateurs.
export type Instrumental = {
  id: string;
  title: string;
  mood: string;
  url: string;
};

export const INSTRUMENTALS: Instrumental[] = [];
