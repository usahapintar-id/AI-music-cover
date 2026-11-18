import type { IncomingMessage, ServerResponse } from "http";
import {
  generateCoverPackage,
  ServiceError,
  type CoverGenerationRequest,
} from "../server/coverService.ts";

interface VercelRequest extends IncomingMessage {
  method?: string;
  body?: CoverGenerationRequest | string;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const parsedBody =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as CoverGenerationRequest)
        : (req.body ?? ({} as CoverGenerationRequest));

    const result = await generateCoverPackage(parsedBody);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
}
