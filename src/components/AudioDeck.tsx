import { useEffect, useRef } from "react";
import { Pause, Play, Upload, Volume2 } from "lucide-react";
import { DEMO_STEMS, type DemoStemPreset } from "../data/presets";

interface AudioDeckProps {
  activeStemId: string;
  uploadedFileName: string | null;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  onSelectStem: (stem: DemoStemPreset) => void;
  onTogglePlay: () => void;
  onUploadAudio: (file: File) => void;
}

export function AudioDeck({
  activeStemId,
  uploadedFileName,
  isPlaying,
  analyser,
  onSelectStem,
  onTogglePlay,
  onUploadAudio,
}: AudioDeckProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const bars = 28;
    const dataArray = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : new Uint8Array(bars);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      const barW = Math.floor((w - (bars - 1) * 3) / bars);
      for (let i = 0; i < bars; i++) {
        const raw = isPlaying && analyser ? dataArray[i % dataArray.length] ?? 24 : 18;
        const normalized = isPlaying ? Math.max(0.14, raw / 255) : 0.12;
        const barH = Math.max(4, Math.floor(normalized * (h - 4)));
        const x = i * (barW + 3);
        const y = h - barH;
        ctx.fillStyle = isPlaying ? "#B8432A" : "#D4D4CE";
        ctx.fillRect(x, y, barW, barH);
      }

      if (isPlaying) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [analyser, isPlaying]);

  return (
    <section className="rounded-lg border border-[#E4E4DF] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-[#121316]">
            Audio Reference Deck
          </h3>
          <p className="mt-0.5 text-xs text-[#5B5D64]">
            Audition harmonic stem moods or load a local vocal / instrumental mix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadAudio(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-1.5 text-xs font-medium text-[#121316] transition-colors hover:bg-[#EFEFEA] whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Load Audio</span>
          </button>
        </div>
      </div>

      {/* Demo Stem Selector */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {DEMO_STEMS.map((stem) => {
          const active = activeStemId === stem.id && !uploadedFileName;
          return (
            <button
              key={stem.id}
              type="button"
              onClick={() => onSelectStem(stem)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? "border-[#121316] bg-[#121316] text-white"
                  : "border-[#E4E4DF] bg-[#F7F7F5] text-[#43454C] hover:text-[#121316]"
              }`}
            >
              {stem.label} · <span className="font-mono-tabular">{stem.bpm} BPM</span>
            </button>
          );
        })}
        {uploadedFileName && (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-[#B8432A]/40 bg-[#B8432A]/8 px-3 py-1.5 text-xs font-medium text-[#121316]">
            <Volume2 className="h-3.5 w-3.5 text-[#B8432A]" />
            <span className="max-w-[200px] truncate">{uploadedFileName}</span>
          </div>
        )}
      </div>

      {/* Play Control & Live Spectrum */}
      <div className="mt-4 flex items-center gap-4 rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3.5 py-2.5">
        <button
          type="button"
          onClick={onTogglePlay}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#121316] text-white transition-colors hover:bg-[#2A2C33]"
          aria-label={isPlaying ? "Stop audio preview" : "Play audio preview"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        <canvas
          ref={canvasRef}
          width={320}
          height={34}
          className="h-[34px] w-full flex-1"
          aria-label="Audio frequency spectrum"
        />

        <span className="font-mono-tabular text-xs text-[#5B5D64] shrink-0">
          {isPlaying ? "Playing" : "Standby"}
        </span>
      </div>
    </section>
  );
}
