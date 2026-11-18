export type TypographyStyle = "editorial" | "display" | "condensed" | "mono";
export type LayoutAlignment = "bottom-left" | "centered" | "top-split";
export type PreviewMode = "sleeve" | "vinyl" | "streaming";
export type ArtworkSource = "preset" | "generative" | "upload";
export type MotifPattern =
  | "vinyl-rings"
  | "brutalist-horizon"
  | "prism-rays"
  | "botanical-waves"
  | "acoustic-grid";

export type PresetId =
  | "midnight-echo"
  | "botanical-acoustic"
  | "velvet-jazz"
  | "kinetic-indie";

export interface CoverPalette {
  background: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
}

export interface SectionCue {
  section: string;
  bars: string;
  productionNote: string;
}

export interface ArrangementBlueprint {
  targetBpm: number;
  musicalKey: string;
  timeSignature: string;
  vocalDirection: string;
  instrumentation: string[];
  sectionCues: SectionCue[];
}

export interface CoverProjectState {
  id: string;
  songTitle: string;
  coverArtist: string;
  originalArtist: string;
  targetStyle: string;
  moodPrompt: string;
  catalogCode: string;
  editionLabel: string;
  showParentalMark: boolean;
  showFilmGrain: boolean;
  scrimIntensity: number;
  artworkSource: ArtworkSource;
  presetId: PresetId;
  uploadedImageUrl: string | null;
  typography: TypographyStyle;
  layoutAlignment: LayoutAlignment;
  motifPattern: MotifPattern;
  palette: CoverPalette;
  artDirection: string;
  linerNotes: string;
  arrangement: ArrangementBlueprint;
  updatedAt: string;
}
