# AI Music Cover

Cover song arrangement planner and album sleeve designer built with React, Vite, Tailwind CSS, Express, and Gemini API (`@google/genai`), configured for both local Node.js development and Vercel deployment.

## Features

- **AI Cover & Arrangement Direction (`/api/generate-cover`)**: Uses server-side Gemini (`gemini-4-hydrogen`) to generate sleeve color palettes, typography pairings, visual motifs, vocal direction, instrumentation stacks, and bar-by-bar arrangement cues.
- **Sleeve & Vinyl Mockup Studio**: Preview flat 1:1 album sleeves, spinning vinyl gatefold mockups, and streaming player cards with customizable typography, layout alignment, film grain, and contrast scrims.
- **Audio Reference Deck**: Audition built-in synthesized demo stems via Web Audio API or load local audio files with a real-time frequency spectrum visualizer.
- **1500×1500 PNG Export**: Renders print-ready square album artwork directly in the browser.

## Local Development

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```

The server starts on `http://0.0.0.0:3000`.

## Deploying to Vercel

1. Push this repository to GitHub or run `vercel` from the project root.
2. Vercel automatically reads `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Serverless API routes: `api/health.ts` and `api/generate-cover.ts`
3. In Vercel **Project Settings → Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key
4. Deploy!