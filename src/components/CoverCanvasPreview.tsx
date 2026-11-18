import { useState } from "react";
import { Disc3, Music2, Pause, Play, Sparkles } from "lucide-react";
import type { CoverProjectState, PreviewMode } from "../types/cover";
import { ARTWORK_PRESETS } from "../data/presets";

interface CoverCanvasPreviewProps {
  project: CoverProjectState;
  previewMode: PreviewMode;
  onChangePreviewMode: (mode: PreviewMode) => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

function GenerativeSvgMotif({ project }: { project: CoverProjectState }) {
  const { palette, motifPattern } = project;
  return (
    <svg
      viewBox="0 0 600 600"
      className="h-full w-full object-cover"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="motifGlow" cx="55%" cy="38%" r="70%">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.45" />
          <stop offset="55%" stopColor={palette.surface} stopOpacity="0.85" />
          <stop offset="100%" stopColor={palette.background} stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill={palette.background} />
      <rect width="600" height="600" fill="url(#motifGlow)" />

      {motifPattern === "vinyl-rings" && (
        <g fill="none" stroke={palette.textPrimary} strokeOpacity="0.2">
          {[70, 105, 140, 175, 210, 245, 280].map((r) => (
            <circle key={r} cx="300" cy="285" r={r} strokeWidth="1.5" />
          ))}
          <circle cx="300" cy="285" r="36" fill={palette.accent} stroke="none" />
        </g>
      )}

      {motifPattern === "brutalist-horizon" && (
        <g>
          <rect y="325" width="600" height="275" fill={palette.surface} />
          <path
            d="M 190 325 A 110 110 0 0 1 410 325 Z"
            fill={palette.accent}
            fillOpacity="0.82"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x="0"
              y={340 + i * 24}
              width="600"
              height="6"
              fill={palette.background}
              fillOpacity="0.55"
            />
          ))}
        </g>
      )}

      {motifPattern === "prism-rays" && (
        <g stroke={palette.textPrimary} strokeOpacity="0.22">
          {[0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600].map((x) => (
            <line key={x} x1="300" y1="210" x2={x} y2="600" strokeWidth="1.2" />
          ))}
          <polygon
            points="300,135 410,335 190,335"
            fill="none"
            stroke={palette.accent}
            strokeWidth="2.5"
            strokeOpacity="0.9"
          />
        </g>
      )}

      {motifPattern === "botanical-waves" && (
        <g fill="none" stroke={palette.textPrimary} strokeOpacity="0.24">
          {[140, 190, 240, 290, 340, 390, 440].map((y) => (
            <path
              key={y}
              d={`M 0 ${y} Q 150 ${y - 34} 300 ${y} T 600 ${y}`}
              strokeWidth="1.5"
            />
          ))}
        </g>
      )}

      {motifPattern === "acoustic-grid" && (
        <g stroke={palette.textPrimary} strokeOpacity="0.18">
          {[100, 200, 300, 400, 500].map((pos) => (
            <g key={pos}>
              <line x1={pos} y1="48" x2={pos} y2="552" strokeWidth="1" />
              <line x1="48" y1={pos} x2="552" y2={pos} strokeWidth="1" />
            </g>
          ))}
          <circle
            cx="300"
            cy="300"
            r="96"
            fill="none"
            stroke={palette.accent}
            strokeWidth="2.5"
            strokeOpacity="0.85"
          />
        </g>
      )}
    </svg>
  );
}

function getTitleFontClass(typography: CoverProjectState["typography"]): string {
  switch (typography) {
    case "editorial":
      return "font-editorial tracking-tight";
    case "condensed":
      return "font-condensed uppercase tracking-wide";
    case "mono":
      return "font-mono-tabular tracking-tight";
    case "display":
    default:
      return "font-display tracking-tight";
  }
}

export function CoverCanvasPreview({
  project,
  previewMode,
  onChangePreviewMode,
  isAudioPlaying,
  onToggleAudio,
}: CoverCanvasPreviewProps) {
  const [imageError, setImageError] = useState(false);

  const activePreset = ARTWORK_PRESETS.find((p) => p.id === project.presetId);
  const resolvedImageUrl =
    project.artworkSource === "upload" && project.uploadedImageUrl
      ? project.uploadedImageUrl
      : project.artworkSource === "preset"
        ? activePreset?.imageUrl ?? null
        : null;

  const showImage = Boolean(resolvedImageUrl) && !imageError;
  const scrimAlpha = Math.min(0.9, Math.max(0.15, project.scrimIntensity / 100));
  const titleFontClass = getTitleFontClass(project.typography);

  const textColor =
    project.artworkSource === "generative" || !showImage
      ? project.palette.textPrimary
      : "#F6F4EF";
  const mutedColor =
    project.artworkSource === "generative" || !showImage
      ? project.palette.textMuted
      : "rgba(246, 244, 239, 0.8)";

  const sleeveArtwork = (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#121316]/12 bg-[#161920] shadow-sm select-none"
      style={{ backgroundColor: project.palette.background }}
    >
      {showImage && resolvedImageUrl ? (
        <img
          src={resolvedImageUrl}
          alt={`${project.songTitle} cover artwork`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <GenerativeSvgMotif project={project} />
      )}

      {/* Contrast Scrim */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            project.layoutAlignment === "top-split"
              ? `linear-gradient(180deg, rgba(10,11,14,${scrimAlpha}) 0%, rgba(10,11,14,${scrimAlpha * 0.3}) 52%, rgba(10,11,14,${scrimAlpha * 0.72}) 100%)`
              : `linear-gradient(180deg, rgba(10,11,14,${scrimAlpha * 0.25}) 0%, rgba(10,11,14,${scrimAlpha * 0.35}) 48%, rgba(10,11,14,${scrimAlpha}) 100%)`,
        }}
      />

      {/* Film Grain Overlay */}
      {project.showFilmGrain && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.45) 0.5px, transparent 0.5px), radial-gradient(rgba(0,0,0,0.45) 0.5px, transparent 0.5px)",
            backgroundSize: "4px 4px",
            backgroundPosition: "0 0, 2px 2px",
          }}
        />
      )}

      {/* Sleeve Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
        <div
          className="flex items-center justify-between gap-4 font-mono-tabular text-[11px] uppercase tracking-[0.14em]"
          style={{ color: mutedColor }}
        >
          <span className="truncate">{project.catalogCode || "AMC-001"}</span>
          <span className="truncate text-right">
            {project.editionLabel || "COVER EDITION"}
          </span>
        </div>

        {project.layoutAlignment === "centered" && (
          <div className="my-auto text-center px-2">
            <h2
              className={`text-3xl sm:text-4xl font-bold leading-[1.05] text-balance ${titleFontClass}`}
              style={{ color: textColor }}
            >
              {project.songTitle || "Untitled Cover"}
            </h2>
            <p
              className="mt-3 text-sm sm:text-base font-medium"
              style={{ color: mutedColor }}
            >
              {project.coverArtist || "Artist Name"}
            </p>
          </div>
        )}

        {project.layoutAlignment === "top-split" && (
          <div className="mt-6 mb-auto">
            <h2
              className={`text-3xl sm:text-4xl font-bold leading-[1.04] text-balance ${titleFontClass}`}
              style={{ color: textColor }}
            >
              {project.songTitle || "Untitled Cover"}
            </h2>
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          {project.layoutAlignment === "bottom-left" && (
            <div className="min-w-0">
              <h2
                className={`text-3xl sm:text-4xl font-bold leading-[1.04] text-balance ${titleFontClass}`}
                style={{ color: textColor }}
              >
                {project.songTitle || "Untitled Cover"}
              </h2>
              <p
                className="mt-2.5 text-sm sm:text-base font-medium truncate"
                style={{ color: mutedColor }}
              >
                {project.coverArtist || "Artist Name"}
                {project.originalArtist
                  ? ` · Cover of ${project.originalArtist}`
                  : ""}
              </p>
            </div>
          )}

          {project.layoutAlignment === "top-split" && (
            <p
              className="text-sm font-medium truncate"
              style={{ color: mutedColor }}
            >
              {project.coverArtist || "Artist Name"} · {project.targetStyle}
            </p>
          )}

          {project.layoutAlignment === "centered" && (
            <span
              className="font-mono-tabular text-[11px] uppercase tracking-wider"
              style={{ color: mutedColor }}
            >
              {project.targetStyle}
            </span>
          )}

          {project.showParentalMark && (
            <div
              className="shrink-0 border px-2.5 py-1 font-mono-tabular text-[10px] font-semibold tracking-wider"
              style={{ borderColor: textColor, color: textColor }}
            >
              STUDIO MASTER
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Preview Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#5B5D64]">
          <span>1500 × 1500 px</span>
          <span aria-hidden="true">·</span>
          <span>sRGB Sleeve Master</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{project.arrangement.targetBpm} BPM</span>
        </div>

        <div
          className="inline-flex items-center rounded-lg border border-[#E4E4DF] bg-[#EFEFEA] p-1"
          role="tablist"
          aria-label="Cover preview mode"
        >
          {(
            [
              { id: "sleeve", label: "Flat Sleeve" },
              { id: "vinyl", label: "Vinyl Mockup" },
              { id: "streaming", label: "Streaming" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={previewMode === mode.id}
              onClick={() => onChangePreviewMode(mode.id)}
              className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                previewMode === mode.id
                  ? "bg-white text-[#121316] shadow-xs"
                  : "text-[#5B5D64] hover:text-[#121316]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Artwork Viewport */}
      {previewMode === "sleeve" && (
        <div className="mx-auto w-full max-w-[540px]">{sleeveArtwork}</div>
      )}

      {previewMode === "vinyl" && (
        <div className="mx-auto flex w-full max-w-[620px] items-center justify-center py-4">
          <div className="relative flex w-full max-w-[480px] items-center">
            <div className="relative z-10 w-[84%] shrink-0">{sleeveArtwork}</div>
            {/* Vinyl Record Emerging from Sleeve */}
            <div
              className={`-ml-[34%] aspect-square w-[74%] rounded-full border border-[#22242A] bg-[#141519] shadow-md flex items-center justify-center ${
                isAudioPlaying ? "vinyl-spinning" : ""
              }`}
              style={{
                backgroundImage:
                  "repeating-radial-gradient(circle at center, #141519 0px, #141519 3px, #1F2128 4px, #141519 5px)",
              }}
            >
              <div
                className="h-[34%] w-[34%] rounded-full border border-white/15 flex flex-col items-center justify-center p-2 text-center"
                style={{ backgroundColor: project.palette.accent }}
              >
                <span className="text-[9px] font-semibold uppercase tracking-widest text-white/90 truncate max-w-full">
                  {project.catalogCode}
                </span>
                <div className="my-1.5 h-3 w-3 rounded-full bg-[#F7F7F5]" />
                <span className="text-[8px] font-medium text-white/85 truncate max-w-full">
                  33⅓ RPM
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewMode === "streaming" && (
        <div className="mx-auto w-full max-w-[400px] rounded-xl border border-[#E4E4DF] bg-[#121316] p-5 text-[#F7F7F5]">
          {sleeveArtwork}
          <div className="mt-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight truncate">
                {project.songTitle || "Untitled Cover"}
              </p>
              <p className="mt-1 text-sm text-[#A5A7AE] truncate">
                {project.coverArtist || "Artist Name"}
              </p>
            </div>
            <span className="font-mono-tabular text-xs text-[#A5A7AE] shrink-0 pt-1">
              {project.arrangement.musicalKey}
            </span>
          </div>

          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full w-2/5 rounded-full transition-all"
                style={{ backgroundColor: project.palette.accent }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono-tabular text-[11px] text-[#8F929B]">
              <span>1:24</span>
              <span>3:42</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#A5A7AE]">
              <Music2 className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{project.targetStyle}</span>
            </div>
            <button
              type="button"
              onClick={onToggleAudio}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#121316] transition-transform hover:scale-105"
              aria-label={isAudioPlaying ? "Pause cover preview" : "Play cover preview"}
            >
              {isAudioPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Art Direction Summary Bar */}
      <div className="rounded-lg border border-[#E4E4DF] bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5B5D64]">
              <Sparkles className="h-3.5 w-3.5 text-[#B8432A]" />
              <span>Art Direction Note</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular uppercase">{project.motifPattern}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-[#26282E]">
              {project.artDirection}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5" title="Active cover palette">
            {[
              project.palette.background,
              project.palette.surface,
              project.palette.accent,
              project.palette.textPrimary,
            ].map((hex, i) => (
              <span
                key={`${hex}-${i}`}
                className="h-5 w-5 rounded border border-black/15"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hidden icon reference to prevent unused warning if vinyl is toggled */}
      <span className="sr-only">
        <Disc3 />
      </span>
    </div>
  );
}
