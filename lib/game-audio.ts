export type BattleSound = "enemy" | "player" | "victory" | "ui";

const AUDIO_KEY = "devdex:audio-enabled";
let context: AudioContext | null = null;

export function audioEnabled() {
  return typeof window !== "undefined" && localStorage.getItem(AUDIO_KEY) !== "false";
}

export function setAudioEnabled(enabled: boolean) {
  localStorage.setItem(AUDIO_KEY, String(enabled));
}

export function playBattleSound(sound: BattleSound) {
  if (!audioEnabled()) return;
  context ??= new AudioContext();
  const notes = sound === "victory" ? [392, 523, 659] : sound === "enemy" ? [190, 120] : sound === "player" ? [95, 65] : [330];
  notes.forEach((frequency, index) => {
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();
    const start = context!.currentTime + index * .08;
    oscillator.type = sound === "victory" ? "square" : "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.035, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + .12);
    oscillator.connect(gain).connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + .13);
  });
}
