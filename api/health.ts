import type { IncomingMessage, ServerResponse } from "http";

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

export default function handler(_req: IncomingMessage, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    runtime: "vercel-serverless",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
}
