import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookmarkPlus,
  Download,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  ARTWORK_PRESETS,
  DEMO_STEMS,
  INITIAL_PROJECT,
  STYLE_OPTIONS,
  type DemoStemPreset,
} from "./data/presets";
import type {
  ArtworkSource,
  CoverProjectState,
  LayoutAlignment,
  MotifPattern,
  PreviewMode,
  TypographyStyle,
} from "./types/cover";
import { CoverCanvasPreview } from "./components/CoverCanvasPreview";
import { AudioDeck } from "./components/AudioDeck";
import { ArrangementSheet } from "./components/ArrangementSheet";
import { DeployReadinessPanel } from "./components/DeployReadinessPanel";
import { exportCoverAsPng } from "./utils/canvasExport";
import { StudioAudioEngine } from "./utils/audioPreview";
import type { GeneratedCoverPackage } from "../server/coverService";

const STORAGE_KEY = "ai-music-cover:saved-projects:v1";

export function App() {
  const [project, setProject] = useState<CoverProjectState>(INITIAL_PROJECT);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("sleeve");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<CoverProjectState[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CoverProjectState[]) : [];
    } catch {
      return [];
    }
  });

  // Audio Preview state
  const audioEngineRef = useRef<StudioAudioEngine | null>(null);
  const [activeStemId, setActiveStemId] = useState<string>(DEMO_STEMS[0].id);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    audioEngineRef.current = new StudioAudioEngine();
    return () => {
      audioEngineRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
    } catch {
      // ignore storage quota errors
    }
  }, [savedProjects]);

  const stopAudio = () => {
    audioEngineRef.current?.stop();
    setIsAudioPlaying(false);
  };

  const handleToggleAudio = () => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    if (isAudioPlaying) {
      stopAudio();
      return;
    }

    if (uploadedAudioUrl) {
      const audioEl = engine.loadUploadedAudio(uploadedAudioUrl);
      audioEl.onended = () => setIsAudioPlaying(false);
      void audioEl.play();
      setAnalyser(engine.getAnalyser());
      setIsAudioPlaying(true);
      return;
    }

    const stem =
      DEMO_STEMS.find((s) => s.id === activeStemId) ?? DEMO_STEMS[0];
    engine.startDemoStem(stem);
    setAnalyser(engine.getAnalyser());
    setIsAudioPlaying(true);
  };

  const handleSelectStem = (stem: DemoStemPreset) => {
    setUploadedAudioName(null);
    setUploadedAudioUrl(null);
    setActiveStemId(stem.id);
    if (isAudioPlaying && audioEngineRef.current) {
      audioEngineRef.current.startDemoStem(stem);
      setAnalyser(audioEngineRef.current.getAnalyser());
    }
  };

  const handleUploadAudio = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setUploadedAudioName(file.name);
    setUploadedAudioUrl(objectUrl);
    if (audioEngineRef.current) {
      const audioEl = audioEngineRef.current.loadUploadedAudio(objectUrl);
      audioEl.onended = () => setIsAudioPlaying(false);
      void audioEl.play();
      setAnalyser(audioEngineRef.current.getAnalyser());
      setIsAudioPlaying(true);
    }
  };

  const handleUploadCoverImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProject((prev) => ({
          ...prev,
          artworkSource: "upload",
          uploadedImageUrl: reader.result as string,
          updatedAt: new Date().toISOString(),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCover = async () => {
    setIsGenerating(true);
    setApiError(null);
    try {
      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle: project.songTitle,
          coverArtist: project.coverArtist,
          originalArtist: project.originalArtist,
          targetStyle: project.targetStyle,
          moodPrompt: project.moodPrompt,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          (payload as { error?: string }).error ||
            "Failed to generate cover concept."
        );
      }

      const generated = payload as GeneratedCoverPackage;
      setProject((prev) => ({
        ...prev,
        artworkSource:
          prev.artworkSource === "upload" ? "upload" : "generative",
        presetId: generated.visualConcept.recommendedPresetId,
        typography: generated.visualConcept.recommendedTypography,
        layoutAlignment: generated.visualConcept.layoutAlignment,
        motifPattern: generated.visualConcept.motifPattern,
        palette: generated.visualConcept.palette,
        artDirection: generated.visualConcept.artDirection,
        linerNotes: generated.linerNotes,
        arrangement: generated.arrangementBlueprint,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Unable to connect to cover generation endpoint."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      await exportCoverAsPng(project);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSnapshot = () => {
    const snapshot: CoverProjectState = {
      ...project,
      id: `cover-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setSavedProjects((prev) => [snapshot, ...prev].slice(0, 8));
  };

  const handleDeleteSnapshot = (id: string) => {
    setSavedProjects((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setApiError(null);
    setProject(INITIAL_PROJECT);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#121316]">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-[#E4E4DF] bg-[#F7F7F5]/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-6 py-3.5">
          <a
            href="#studio-top"
            className="font-display text-lg font-bold tracking-tight text-[#121316] whitespace-nowrap shrink-0"
          >
            AI Music Cover
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5B5D64]"
          >
            <a
              href="#studio-top"
              className="hover:text-[#121316] transition-colors whitespace-nowrap shrink-0"
            >
              Studio
            </a>
            <a
              href="#cover-preview"
              className="hover:text-[#121316] transition-colors whitespace-nowrap shrink-0"
            >
              Cover Art
            </a>
            <a
              href="#arrangement-section"
              className="hover:text-[#121316] transition-colors whitespace-nowrap shrink-0"
            >
              Arrangement
            </a>
            <a
              href="#vercel-section"
              className="hover:text-[#121316] transition-colors whitespace-nowrap shrink-0"
            >
              Vercel Setup
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-md bg-[#121316] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#2A2C33] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExporting ? "Exporting..." : "Export PNG"}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="studio-top" className="mx-auto max-w-[1360px] px-6 py-8 space-y-8">
        {/* Intro Row */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E4E4DF] pb-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#121316] text-balance">
              Cover Song Arrangement &amp; Sleeve Studio
            </h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#5B5D64]">
              Plan your cover song arrangement, generate sleeve art direction with Gemini, audition reference stems, and export print-ready 1500px artwork.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E4E4DF] bg-white px-3.5 py-2 text-xs font-medium text-[#121316] transition-colors hover:bg-[#EFEFEA] whitespace-nowrap shrink-0"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save Snapshot</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E4E4DF] bg-white px-3.5 py-2 text-xs font-medium text-[#5B5D64] transition-colors hover:text-[#121316] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Controls & AI Direction */}
          <div className="lg:col-span-5 space-y-6">
            {/* Release Metadata & AI Generator */}
            <section className="rounded-lg border border-[#E4E4DF] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-[#121316]">
                  Track &amp; Cover Direction
                </h2>
                <span className="font-mono-tabular text-xs text-[#5B5D64]">
                  Step 01
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="song-title"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Song Title
                  </label>
                  <input
                    id="song-title"
                    type="text"
                    value={project.songTitle}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, songTitle: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cover-artist"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Cover Artist
                  </label>
                  <input
                    id="cover-artist"
                    type="text"
                    value={project.coverArtist}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, coverArtist: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="original-artist"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Original Artist
                  </label>
                  <input
                    id="original-artist"
                    type="text"
                    value={project.originalArtist}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        originalArtist: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="target-style"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Target Cover Style
                  </label>
                  <select
                    id="target-style"
                    value={project.targetStyle}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, targetStyle: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:bg-white focus:outline-none"
                  >
                    {STYLE_OPTIONS.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mood-prompt"
                  className="block text-xs font-medium text-[#43454C]"
                >
                  Sonic &amp; Visual Mood Notes
                </label>
                <textarea
                  id="mood-prompt"
                  rows={2}
                  value={project.moodPrompt}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, moodPrompt: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:bg-white focus:outline-none"
                />
              </div>

              {apiError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-md border border-[#DC2626]/30 bg-[#DC2626]/6 p-3 text-xs text-[#991B1B]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{apiError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateCover}
                disabled={isGenerating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#B8432A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9E3721] disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Cover &amp; Arrangement...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Cover Concept</span>
                  </>
                )}
              </button>
            </section>

            {/* Artwork Source & Presets */}
            <section className="rounded-lg border border-[#E4E4DF] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-[#121316]">
                  Artwork Layer
                </h2>
                <div className="inline-flex rounded-md border border-[#E4E4DF] bg-[#EFEFEA] p-0.5">
                  {(
                    [
                      { id: "preset", label: "Presets" },
                      { id: "generative", label: "Generative" },
                      { id: "upload", label: "Upload" },
                    ] as const
                  ).map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() =>
                        setProject((p) => ({
                          ...p,
                          artworkSource: src.id as ArtworkSource,
                        }))
                      }
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        project.artworkSource === src.id
                          ? "bg-white text-[#121316] shadow-xs"
                          : "text-[#5B5D64] hover:text-[#121316]"
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              {project.artworkSource === "preset" && (
                <div className="grid grid-cols-2 gap-3">
                  {ARTWORK_PRESETS.map((preset) => {
                    const selected = project.presetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setProject((p) => ({
                            ...p,
                            presetId: preset.id,
                            palette: preset.defaultPalette,
                          }))
                        }
                        className={`group overflow-hidden rounded-md border text-left transition-colors ${
                          selected
                            ? "border-[#121316] ring-1 ring-[#121316]"
                            : "border-[#E4E4DF] hover:border-[#A8A8A0]"
                        }`}
                      >
                        <div className="aspect-square w-full overflow-hidden bg-[#161920]">
                          <img
                            src={preset.imageUrl}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-[#121316] truncate">
                            {preset.name}
                          </p>
                          <p className="text-[11px] text-[#5B5D64] truncate">
                            {preset.genreHint}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {project.artworkSource === "generative" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-[#43454C]">
                    Vector Motif Pattern
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "brutalist-horizon", label: "Brutalist Horizon" },
                        { id: "vinyl-rings", label: "Vinyl Rings" },
                        { id: "prism-rays", label: "Prism Rays" },
                        { id: "botanical-waves", label: "Botanical Waves" },
                        { id: "acoustic-grid", label: "Acoustic Grid" },
                      ] as { id: MotifPattern; label: string }[]
                    ).map((motif) => (
                      <button
                        key={motif.id}
                        type="button"
                        onClick={() =>
                          setProject((p) => ({ ...p, motifPattern: motif.id }))
                        }
                        className={`rounded-md border px-3 py-2 text-xs font-medium text-left transition-colors ${
                          project.motifPattern === motif.id
                            ? "border-[#121316] bg-[#121316] text-white"
                            : "border-[#E4E4DF] bg-[#F7F7F5] text-[#43454C] hover:text-[#121316]"
                        }`}
                      >
                        {motif.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {project.artworkSource === "upload" && (
                <div>
                  <input
                    ref={imageUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCoverImage(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageUploadRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[#C7C7BF] bg-[#F7F7F5] px-4 py-6 text-center transition-colors hover:border-[#121316]"
                  >
                    <ImagePlus className="h-5 w-5 text-[#5B5D64]" />
                    <span className="text-xs font-medium text-[#121316]">
                      {project.uploadedImageUrl
                        ? "Replace Cover Photo"
                        : "Upload Square Album Photo"}
                    </span>
                    <span className="text-[11px] text-[#5B5D64]">
                      PNG, JPG, or WebP cropped to 1:1 sleeve
                    </span>
                  </button>
                </div>
              )}
            </section>

            {/* Typography & Sleeve Controls */}
            <section className="rounded-lg border border-[#E4E4DF] bg-white p-5 space-y-4">
              <h2 className="font-display text-base font-semibold text-[#121316]">
                Typography &amp; Framing
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="typography-select"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Typeface
                  </label>
                  <select
                    id="typography-select"
                    value={project.typography}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        typography: e.target.value as TypographyStyle,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:outline-none"
                  >
                    <option value="display">Display Grotesk</option>
                    <option value="editorial">Editorial Serif</option>
                    <option value="condensed">Condensed Poster</option>
                    <option value="mono">Mono Archive</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="alignment-select"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Layout Alignment
                  </label>
                  <select
                    id="alignment-select"
                    value={project.layoutAlignment}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        layoutAlignment: e.target.value as LayoutAlignment,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 text-sm text-[#121316] focus:border-[#121316] focus:outline-none"
                  >
                    <option value="bottom-left">Bottom Left</option>
                    <option value="centered">Centered Sleeve</option>
                    <option value="top-split">Top Split</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="catalog-code"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Catalog Code
                  </label>
                  <input
                    id="catalog-code"
                    type="text"
                    value={project.catalogCode}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, catalogCode: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 font-mono-tabular text-xs text-[#121316] focus:border-[#121316] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edition-label"
                    className="block text-xs font-medium text-[#43454C]"
                  >
                    Edition Label
                  </label>
                  <input
                    id="edition-label"
                    type="text"
                    value={project.editionLabel}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        editionLabel: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3 py-2 font-mono-tabular text-xs text-[#121316] focus:border-[#121316] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="scrim-range"
                    className="font-medium text-[#43454C]"
                  >
                    Scrim Contrast Depth
                  </label>
                  <span className="font-mono-tabular text-[#5B5D64]">
                    {project.scrimIntensity}%
                  </span>
                </div>
                <input
                  id="scrim-range"
                  type="range"
                  min={15}
                  max={85}
                  value={project.scrimIntensity}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      scrimIntensity: Number(e.target.value),
                    }))
                  }
                  className="mt-1.5 w-full accent-[#121316]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-[#26282E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.showFilmGrain}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        showFilmGrain: e.target.checked,
                      }))
                    }
                    className="rounded border-[#C7C7BF] accent-[#121316]"
                  />
                  <span>35mm Film Grain</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-[#26282E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.showParentalMark}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        showParentalMark: e.target.checked,
                      }))
                    }
                    className="rounded border-[#C7C7BF] accent-[#121316]"
                  />
                  <span>Studio Master Seal</span>
                </label>
              </div>
            </section>
          </div>

          {/* Right Column: Dominant Focal Canvas + Audio Reference Deck */}
          <div id="cover-preview" className="lg:col-span-7 space-y-6">
            <CoverCanvasPreview
              project={project}
              previewMode={previewMode}
              onChangePreviewMode={setPreviewMode}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={handleToggleAudio}
            />

            <AudioDeck
              activeStemId={activeStemId}
              uploadedFileName={uploadedAudioName}
              isPlaying={isAudioPlaying}
              analyser={analyser}
              onSelectStem={handleSelectStem}
              onTogglePlay={handleToggleAudio}
              onUploadAudio={handleUploadAudio}
            />

            {/* Saved Snapshots Library */}
            {savedProjects.length > 0 && (
              <section className="rounded-lg border border-[#E4E4DF] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-[#121316]">
                    Saved Cover Snapshots
                  </h3>
                  <span className="font-mono-tabular text-xs text-[#5B5D64]">
                    {savedProjects.length} stored
                  </span>
                </div>
                <div className="mt-3 divide-y divide-[#EFEFEA]">
                  {savedProjects.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => setProject(item)}
                        className="min-w-0 text-left hover:underline"
                      >
                        <p className="text-sm font-medium text-[#121316] truncate">
                          {item.songTitle}
                        </p>
                        <p className="text-xs text-[#5B5D64] truncate">
                          {item.coverArtist} · {item.targetStyle}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(item.id)}
                        className="rounded p-1.5 text-[#7A7D85] hover:bg-[#F7F7F5] hover:text-[#DC2626]"
                        aria-label={`Delete ${item.songTitle}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Full-Width Arrangement Blueprint */}
        <ArrangementSheet
          project={project}
          onUpdateLinerNotes={(linerNotes) =>
            setProject((p) => ({ ...p, linerNotes }))
          }
        />

        {/* Vercel Deployment Readiness Section */}
        <DeployReadinessPanel />
      </main>

      <footer className="border-t border-[#E4E4DF] bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-xs text-[#5B5D64]">
          <span>AI Music Cover · Album Sleeve &amp; Arrangement Studio</span>
          <span>Vite + React + Vercel Serverless Functions</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
