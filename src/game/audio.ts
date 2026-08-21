/* Piccola synth WebAudio: nessun asset, solo blip procedurali. */

type OscType = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscType,
    vol: number,
    when = 0,
    slideTo?: number
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, when = 0, freq = 800, q = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t0 = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  click() {
    this.tone(340, 0.06, "square", 0.12);
  }
  type() {
    this.tone(1900, 0.018, "sine", 0.03);
  }
  chomp() {
    this.noise(0.1, 0.5, 0, 500);
    this.tone(190, 0.13, "triangle", 0.3, 0, 70);
  }
  correct() {
    this.tone(523, 0.09, "sine", 0.2);
    this.tone(659, 0.12, "sine", 0.2, 0.07);
  }
  wrong() {
    this.tone(170, 0.34, "sawtooth", 0.28, 0, 65);
    this.noise(0.3, 0.35, 0.02, 300, 2);
  }
  tick() {
    this.tone(1250, 0.04, "square", 0.1);
  }
  appear() {
    this.tone(110, 0.7, "sawtooth", 0.14, 0, 55);
    this.tone(116, 0.7, "sawtooth", 0.12, 0.03, 58);
    this.tone(220, 0.5, "sine", 0.16, 0.1, 440);
    this.noise(0.5, 0.12, 0, 1200, 0.5);
  }
  recruit() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => this.tone(n, 0.14, "square", 0.16, i * 0.09));
    this.tone(1568, 0.3, "sine", 0.12, 0.38);
    this.noise(0.25, 0.1, 0.36, 3000, 0.5);
  }
  victory() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    seq.forEach((n, i) => this.tone(n, 0.16, "square", 0.15, i * 0.11));
    [523, 659, 784].forEach((n) => this.tone(n, 1.1, "triangle", 0.08, 0.9));
  }
  gameover() {
    const seq = [392, 330, 262, 196];
    seq.forEach((n, i) => this.tone(n, 0.3, "sawtooth", 0.16, i * 0.24, n * 0.8));
    this.noise(0.6, 0.15, 1.0, 200, 1);
  }
  start() {
    this.tone(440, 0.1, "square", 0.16);
    this.tone(660, 0.12, "square", 0.16, 0.1);
    this.tone(880, 0.22, "square", 0.18, 0.2);
  }
  pause() {
    this.tone(600, 0.08, "square", 0.12);
    this.tone(400, 0.1, "square", 0.12, 0.08);
  }

  /* alias usati dal flusso RPG */
  ui() {
    this.click();
  }
  ok() {
    this.correct();
  }
  error() {
    this.wrong();
  }
  spawn() {
    this.appear();
  }
  boss() {
    this.appear();
    this.tone(82, 0.9, "sawtooth", 0.2, 0.1, 41);
    this.noise(0.5, 0.2, 0.2, 250, 1.5);
  }
  power() {
    this.start();
  }
  win() {
    this.victory();
  }
}

export const sfx = new Sfx();

export const initAudio = () => sfx.unlock();
