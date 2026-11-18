import { GoogleGenAI, Type } from "@google/genai";

export interface CoverGenerationRequest {
  songTitle: string;
  coverArtist: string;
  originalArtist?: string;
  targetStyle: string;
  moodPrompt: string;
}

export interface GeneratedCoverPackage {
  visualConcept: {
    artDirection: string;
    palette: {
      background: string;
      surface: string;
      accent: string;
      textPrimary: string;
      textMuted: string;
    };
    recommendedTypography: "editorial" | "display" | "condensed" | "mono";
    layoutAlignment: "bottom-left" | "centered" | "top-split";
    motifPattern:
      | "vinyl-rings"
      | "brutalist-horizon"
      | "prism-rays"
      | "botanical-waves"
      | "acoustic-grid";
    recommendedPresetId:
      | "midnight-echo"
      | "botanical-acoustic"
      | "velvet-jazz"
      | "kinetic-indie";
  };
  arrangementBlueprint: {
    targetBpm: number;
    musicalKey: string;
    timeSignature: string;
    vocalDirection: string;
    instrumentation: string[];
    sectionCues: Array<{
      section: string;
      bars: string;
      productionNote: string;
    }>;
  };
  linerNotes: string;
}

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function generateCoverPackage(
  input: CoverGenerationRequest
): Promise<GeneratedCoverPackage> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ServiceError(
      "GEMINI_API_KEY is not configured. Add GEMINI_API_KEY in your environment settings to enable AI cover direction.",
      503
    );
  }

  const songTitle = input.songTitle.trim();
  const coverArtist = input.coverArtist.trim();
  const targetStyle = input.targetStyle.trim();
  const moodPrompt = input.moodPrompt.trim();

  if (!songTitle || !coverArtist || !targetStyle) {
    throw new ServiceError(
      "Song title, cover artist, and target style are required.",
      400
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const prompt = [
    `Design a cohesive album cover visual direction and song cover production arrangement.`,
    `Song Title: ${songTitle}`,
    `Cover Performer: ${coverArtist}`,
    input.originalArtist?.trim()
      ? `Original Artist: ${input.originalArtist.trim()}`
      : `Original Artist: Traditional / Original Reinterpretation`,
    `Target Cover Style / Genre: ${targetStyle}`,
    moodPrompt ? `Visual & Sonic Mood Notes: ${moodPrompt}` : "",
    `Return valid hex color codes with high foreground/background contrast for sleeve typography.`,
    `Choose recommendedTypography from: editorial, display, condensed, mono.`,
    `Choose layoutAlignment from: bottom-left, centered, top-split.`,
    `Choose motifPattern from: vinyl-rings, brutalist-horizon, prism-rays, botanical-waves, acoustic-grid.`,
    `Choose recommendedPresetId from: midnight-echo, botanical-acoustic, velvet-jazz, kinetic-indie.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an experienced record label creative director and music producer specializing in reimagined cover songs, vinyl sleeve typography, and studio arrangement blueprints. Keep descriptions concise, concrete, and musically authentic.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualConcept: {
              type: Type.OBJECT,
              properties: {
                artDirection: { type: Type.STRING },
                palette: {
                  type: Type.OBJECT,
                  properties: {
                    background: { type: Type.STRING },
                    surface: { type: Type.STRING },
                    accent: { type: Type.STRING },
                    textPrimary: { type: Type.STRING },
                    textMuted: { type: Type.STRING },
                  },
                  required: [
                    "background",
                    "surface",
                    "accent",
                    "textPrimary",
                    "textMuted",
                  ],
                },
                recommendedTypography: { type: Type.STRING },
                layoutAlignment: { type: Type.STRING },
                motifPattern: { type: Type.STRING },
                recommendedPresetId: { type: Type.STRING },
              },
              required: [
                "artDirection",
                "palette",
                "recommendedTypography",
                "layoutAlignment",
                "motifPattern",
                "recommendedPresetId",
              ],
            },
            arrangementBlueprint: {
              type: Type.OBJECT,
              properties: {
                targetBpm: { type: Type.INTEGER },
                musicalKey: { type: Type.STRING },
                timeSignature: { type: Type.STRING },
                vocalDirection: { type: Type.STRING },
                instrumentation: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                sectionCues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      section: { type: Type.STRING },
                      bars: { type: Type.STRING },
                      productionNote: { type: Type.STRING },
                    },
                    required: ["section", "bars", "productionNote"],
                  },
                },
              },
              required: [
                "targetBpm",
                "musicalKey",
                "timeSignature",
                "vocalDirection",
                "instrumentation",
                "sectionCues",
              ],
            },
            linerNotes: { type: Type.STRING },
          },
          required: ["visualConcept", "arrangementBlueprint", "linerNotes"],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new ServiceError("Empty response from Gemini API.", 502);
    }

    return JSON.parse(rawText) as GeneratedCoverPackage;
  } catch (err) {
    if (err instanceof ServiceError) {
      throw err;
    }
    const message =
      err instanceof Error ? err.message : "Failed to generate cover package.";
    throw new ServiceError(message, 502);
  }
}
