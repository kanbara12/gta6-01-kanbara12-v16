// SUNCOAST: HEATLINE — original audio, synthesized live with WebAudio.
// No audio files, no network: engine hum, two-tone siren, gunshot, chime
// and a cash-register blip are all built from oscillators and noise.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.muted = false;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      // Engine: two detuned saws through a lowpass, pitch follows speed.
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55;
      const engineOsc2 = this.ctx.createOscillator();
      engineOsc2.type = 'sawtooth';
      engineOsc2.frequency.value = 55.5;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.0;
      this.engineOsc.connect(filter);
      engineOsc2.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engineOsc.start();
      engineOsc2.start();
      this.engineOsc2 = engineOsc2;
      // Siren: triangle alternating 700 / 950 Hz.
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.value = 700;
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0.0;
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.master);
      this.sirenOsc.start();
      this.sirenTimer = 0;
      this.unlocked = true;
    } catch (err) {
      this.unlocked = false;
    }
  }

  setEngine(speedKmh, driving) {
    if (!this.unlocked) return;
    const target = driving ? 0.05 + Math.min(0.16, speedKmh / 900) : 0.0;
    this.engineGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    const freq = 55 + speedKmh * 1.6;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(freq * 1.01, this.ctx.currentTime, 0.08);
  }

  setSiren(on, dt) {
    if (!this.unlocked) return;
    this.sirenGain.gain.setTargetAtTime(on ? 0.05 : 0.0, this.ctx.currentTime, 0.2);
    if (on) {
      this.sirenTimer += dt;
      const hi = Math.floor(this.sirenTimer * 2.2) % 2 === 0;
      this.sirenOsc.frequency.setTargetAtTime(hi ? 950 : 700, this.ctx.currentTime, 0.05);
    }
  }

  blip(freq, dur, type = 'sine', gain = 0.15) {
    if (!this.unlocked) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  chime() {
    this.blip(880, 0.18);
    setTimeout(() => this.blip(1318, 0.25), 90);
  }

  cash() {
    this.blip(988, 0.12);
    setTimeout(() => this.blip(1318, 0.12), 80);
    setTimeout(() => this.blip(1760, 0.3), 160);
  }

  gunshot() {
    if (!this.unlocked) return;
    const len = this.ctx.sampleRate * 0.16;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    const g = this.ctx.createGain();
    g.gain.value = 0.4;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
}
