// Synthèse vocale du navigateur — gestion de la voix préférée par langue.
const VOICE_KEY = "bible.tts.voice";

export function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function onVoicesReady(cb: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const handler = () => cb();
  window.speechSynthesis.addEventListener?.("voiceschanged", handler);
  // Trigger one initial check (Safari)
  setTimeout(cb, 0);
  return () => window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
}

export function getPreferredVoiceName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VOICE_KEY);
}
export function setPreferredVoiceName(name: string | null) {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem(VOICE_KEY, name);
  else localStorage.removeItem(VOICE_KEY);
}

export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = getVoices();
  const pref = getPreferredVoiceName();
  if (pref) {
    const v = voices.find((x) => x.name === pref);
    if (v) return v;
  }
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase())) ??
    voices[0] ?? null
  );
}

export function speak(text: string, lang = "fr-FR", rate = 0.95) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export function speakQueue(texts: string[], lang = "fr-FR", rate = 0.95, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const v = pickVoice(lang);
  texts.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = lang;
    u.rate = rate;
    if (v) u.voice = v;
    if (i === texts.length - 1 && onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
