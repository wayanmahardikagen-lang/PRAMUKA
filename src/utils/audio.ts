// Web Audio API Sound Effects Engine & Morse Synthesizer

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy suppression fallback
    }
  }

  public playSuccess() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.22);
      });
    } catch {
      // AudioContext fallback
    }
  }

  public playError() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // AudioContext fallback
    }
  }

  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Fanfare: G4, C5, E5, G5 (longer)
      const chord = [
        { f: 392.00, t: 0, d: 0.15 },
        { f: 523.25, t: 0.15, d: 0.15 },
        { f: 659.25, t: 0.30, d: 0.15 },
        { f: 783.99, t: 0.45, d: 0.60 }
      ];

      chord.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.25, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d);
      });
    } catch {
      // AudioContext fallback
    }
  }

  public playMorseCode(morse: string, onEnd?: () => void) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }
    this.initContext();
    if (!this.ctx) {
      if (onEnd) onEnd();
      return;
    }

    try {
      const dotTime = 0.08; // 80ms
      const dashTime = dotTime * 3;
      const intraCharGap = dotTime;
      const charGap = dotTime * 3;
      const wordGap = dotTime * 7;

      let currentTime = this.ctx.currentTime + 0.05;
      const freq = 700; // standard morse frequency (Hz)

      for (let i = 0; i < morse.length; i++) {
        const symbol = morse[i];
        if (symbol === '.') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, currentTime);
          gain.gain.setValueAtTime(0.2, currentTime);
          gain.gain.setValueAtTime(0.0001, currentTime + dotTime);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(currentTime);
          osc.stop(currentTime + dotTime);
          currentTime += dotTime + intraCharGap;
        } else if (symbol === '-') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, currentTime);
          gain.gain.setValueAtTime(0.2, currentTime);
          gain.gain.setValueAtTime(0.0001, currentTime + dashTime);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(currentTime);
          osc.stop(currentTime + dashTime);
          currentTime += dashTime + intraCharGap;
        } else if (symbol === ' ') {
          currentTime += charGap;
        } else if (symbol === '/') {
          currentTime += wordGap;
        }
      }

      if (onEnd) {
        const totalDuration = (currentTime - this.ctx.currentTime) * 1000;
        setTimeout(onEnd, Math.max(100, totalDuration));
      }
    } catch {
      if (onEnd) onEnd();
    }
  }
}

export const sound = new AudioManager();
