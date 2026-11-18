import type { DemoStemPreset } from "../data/presets";

export class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private synthTimer: number | null = null;
  private mediaAudio: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private activeOscillators: OscillatorNode[] = [];

  ensureContext(): { ctx: AudioContext; analyser: AnalyserNode } {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return { ctx: this.ctx, analyser: this.analyser! };
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  startDemoStem(stem: DemoStemPreset): void {
    this.stop();
    const { ctx, analyser } = this.ensureContext();
    const stepMs = (60 / stem.bpm) * 500;
    let step = 0;

    const triggerNote = () => {
      if (!this.ctx || !this.analyser) return;
      const now = ctx.currentTime;
      const semitone = stem.scaleIntervals[step % stem.scaleIntervals.length];
      const freq = stem.rootHz * Math.pow(2, semitone / 12);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = stem.waveform;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000);

      osc.connect(gain);
      gain.connect(analyser);
      osc.start(now);
      osc.stop(now + stepMs / 1000 + 0.05);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
      step += 1;
    };

    triggerNote();
    this.synthTimer = window.setInterval(triggerNote, stepMs);
  }

  loadUploadedAudio(url: string): HTMLAudioElement {
    this.stop();
    const { ctx, analyser } = this.ensureContext();
    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    this.mediaAudio = audio;
    this.mediaSource = source;
    return audio;
  }

  stop(): void {
    if (this.synthTimer !== null) {
      window.clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // oscillator already stopped
      }
    });
    this.activeOscillators = [];

    if (this.mediaAudio) {
      this.mediaAudio.pause();
      this.mediaAudio.currentTime = 0;
      this.mediaAudio = null;
    }
    if (this.mediaSource) {
      this.mediaSource.disconnect();
      this.mediaSource = null;
    }
  }
}
