// Zero-dependency Web Audio API synthesizer for focus timer & goal completion chimes

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("openwork_sound_enabled");
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("openwork_sound_enabled", enabled ? "true" : "false");
  } catch {}
}

export function playGoalChime() {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Friendly 2-tone chime: C5 -> G5
    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
    gain2.gain.setValueAtTime(0.18, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}
