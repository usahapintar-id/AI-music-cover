import midnightEchoImg from "../assets/images/cover_midnight_echo_1794984175047.jpg";
import botanicalAcousticImg from "../assets/images/cover_botanical_acoustic_1794984175733.jpg";
import velvetJazzImg from "../assets/images/cover_velvet_jazz_1794984176417.jpg";
import kineticIndieImg from "../assets/images/cover_kinetic_indie_1794984176130.jpg";
import type { CoverProjectState, PresetId } from "../types/cover";

export interface ArtworkPreset {
  id: PresetId;
  name: string;
  genreHint: string;
  imageUrl: string;
  defaultPalette: {
    background: string;
    surface: string;
    accent: string;
    textPrimary: string;
    textMuted: string;
  };
}

export const ARTWORK_PRESETS: ArtworkPreset[] = [
  {
    id: "midnight-echo",
    name: "Brutalist Dusk",
    genreHint: "Synthwave / Ambient Cover",
    imageUrl: midnightEchoImg,
    defaultPalette: {
      background: "#161920",
      surface: "#232732",
      accent: "#E07A48",
      textPrimary: "#F5F2EB",
      textMuted: "#C2BEB4",
    },
  },
  {
    id: "botanical-acoustic",
    name: "Linen Shadow",
    genreHint: "Acoustic Folk / Indie Cover",
    imageUrl: botanicalAcousticImg,
    defaultPalette: {
      background: "#EBE5D8",
      surface: "#DFD7C6",
      accent: "#6B4E37",
      textPrimary: "#1E1B18",
      textMuted: "#564F47",
    },
  },
  {
    id: "velvet-jazz",
    name: "Tungsten Brass",
    genreHint: "Late-Night Jazz / Soul Cover",
    imageUrl: velvetJazzImg,
    defaultPalette: {
      background: "#17110D",
      surface: "#261B14",
      accent: "#D49B4B",
      textPrimary: "#F7EFE4",
      textMuted: "#CBB8A0",
    },
  },
  {
    id: "kinetic-indie",
    name: "Refracted Slate",
    genreHint: "Electronic / Chamber Pop Cover",
    imageUrl: kineticIndieImg,
    defaultPalette: {
      background: "#14171D",
      surface: "#1E242E",
      accent: "#5A84C2",
      textPrimary: "#F3F5F8",
      textMuted: "#B4BDCB",
    },
  },
];

export const STYLE_OPTIONS = [
  "Lo-Fi Acoustic Folk",
  "Analog Synthwave '84",
  "Late-Night Jazz Quartet",
  "Chamber Pop & Strings",
  "Neo-Soul Tape Rework",
  "Minimal Electronic",
];

export interface DemoStemPreset {
  id: string;
  label: string;
  bpm: number;
  rootHz: number;
  scaleIntervals: number[];
  waveform: OscillatorType;
}

export const DEMO_STEMS: DemoStemPreset[] = [
  {
    id: "dusk-synth",
    label: "Analog Pad Demo",
    bpm: 88,
    rootHz: 146.83,
    scaleIntervals: [0, 3, 7, 10, 14],
    waveform: "triangle",
  },
  {
    id: "folk-pluck",
    label: "Acoustic Pluck Demo",
    bpm: 96,
    rootHz: 196.0,
    scaleIntervals: [0, 4, 7, 11, 14],
    waveform: "sine",
  },
  {
    id: "velvet-rhodes",
    label: "Jazz Voicing Demo",
    bpm: 76,
    rootHz: 130.81,
    scaleIntervals: [0, 3, 7, 10, 14, 17],
    waveform: "sine",
  },
];

export const INITIAL_PROJECT: CoverProjectState = {
  id: "session-default",
  songTitle: "Afterglow Horizon",
  coverArtist: "Nadia Hartono",
  originalArtist: "The Midnight Collective",
  targetStyle: "Analog Synthwave '84",
  moodPrompt:
    "Warm analog tape saturation over concrete twilight architecture with intimate vocal harmonies.",
  catalogCode: "AMC-014",
  editionLabel: "REIMAGINED EDITION",
  showParentalMark: false,
  showFilmGrain: true,
  scrimIntensity: 55,
  artworkSource: "preset",
  presetId: "midnight-echo",
  uploadedImageUrl: null,
  typography: "display",
  layoutAlignment: "bottom-left",
  motifPattern: "brutalist-horizon",
  palette: ARTWORK_PRESETS[0].defaultPalette,
  artDirection:
    "Twilight brutalist silhouettes anchored by warm tungsten amber light and crisp negative-space typography.",
  linerNotes:
    "Recorded live to two-track tape in Jakarta. Reimagined from the original synth progression using Juno chorus pads, muted upright piano, and close-miked vocal doubles.",
  arrangement: {
    targetBpm: 88,
    musicalKey: "D Minor",
    timeSignature: "4/4",
    vocalDirection:
      "Intimate breathy chest voice in verses; double-tracked octave harmonies entering on Chorus 1 with plate reverb.",
    instrumentation: [
      "Warm Analog Poly Synth (Chorus Pad)",
      "Muted Upright Felt Piano",
      "Fender Precision Bass (Flatwound)",
      "TR-808 Brush Rimshot & Sub Kick",
    ],
    sectionCues: [
      {
        section: "Intro",
        bars: "1–8",
        productionNote: "Filtered tape pad swell with vinyl room floor and sparse piano root notes.",
      },
      {
        section: "Verse 1",
        bars: "9–24",
        productionNote: "Dry close-mic lead vocal over pulse bassline and soft rimshot groove.",
      },
      {
        section: "Chorus 1",
        bars: "25–40",
        productionNote: "Wide stereo Juno chord layer opens up; add high vocal harmony a third above.",
      },
      {
        section: "Bridge & Outro",
        bars: "41–56",
        productionNote: "Strip drums back to half-time; sustain final minor-ninth pad into tape fade.",
      },
    ],
  },
  updatedAt: new Date().toISOString(),
};
