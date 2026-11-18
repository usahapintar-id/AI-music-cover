import { useState } from "react";
import { CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

interface HealthState {
  checked: boolean;
  loading: boolean;
  ok: boolean;
  runtime?: string;
  geminiConfigured?: boolean;
  error?: string;
}

export function DeployReadinessPanel() {
  const [health, setHealth] = useState<HealthState>({
    checked: false,
    loading: false,
    ok: false,
  });

  const checkHealth = async () => {
    setHealth((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth({
        checked: true,
        loading: false,
        ok: Boolean(data.ok),
        runtime: data.runtime,
        geminiConfigured: Boolean(data.geminiConfigured),
      });
    } catch (err) {
      setHealth({
        checked: true,
        loading: false,
        ok: false,
        error: err instanceof Error ? err.message : "Health check failed",
      });
    }
  };

  return (
    <section
      id="vercel-section"
      className="rounded-lg border border-[#E4E4DF] bg-white p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E4DF] pb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#121316]">
            Vercel Deployment Configuration
          </h2>
          <p className="mt-1 text-sm text-[#5B5D64]">
            Configured for zero-friction static frontend + serverless API routes on Vercel and Express in local dev.
          </p>
        </div>

        <button
          type="button"
          onClick={checkHealth}
          disabled={health.loading}
          className="inline-flex items-center gap-2 rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3.5 py-2 text-xs font-medium text-[#121316] transition-colors hover:bg-[#EFEFEA] disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${health.loading ? "animate-spin" : ""}`} />
          <span>{health.loading ? "Checking API..." : "Verify API Route"}</span>
        </button>
      </div>

      {health.checked && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-4 py-3 text-xs">
          {health.ok ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
              <span className="font-medium text-[#121316]">API Online</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-[#5B5D64]">
                Runtime: {health.runtime}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#5B5D64]">
                GEMINI_API_KEY:{" "}
                <strong className="font-medium text-[#121316]">
                  {health.geminiConfigured ? "Configured" : "Not Set"}
                </strong>
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
              <span className="text-[#DC2626]">
                {health.error ?? "Unable to reach /api/health"}
              </span>
            </>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-[#E4E4DF] bg-[#FAFAF8] p-4">
          <p className="font-mono-tabular text-xs font-medium text-[#121316]">
            vercel.json
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5B5D64]">
            Routes <code className="font-mono-tabular">/api/*</code> to serverless handlers and rewrites SPA routes to{" "}
            <code className="font-mono-tabular">dist/index.html</code>.
          </p>
        </div>

        <div className="rounded-md border border-[#E4E4DF] bg-[#FAFAF8] p-4">
          <p className="font-mono-tabular text-xs font-medium text-[#121316]">
            api/generate-cover.ts
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5B5D64]">
            Serverless endpoint calling Gemini on the server using{" "}
            <code className="font-mono-tabular">process.env.GEMINI_API_KEY</code>.
          </p>
        </div>

        <div className="rounded-md border border-[#E4E4DF] bg-[#FAFAF8] p-4">
          <p className="font-mono-tabular text-xs font-medium text-[#121316]">
            npm run build → dist
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5B5D64]">
            Add <code className="font-mono-tabular">GEMINI_API_KEY</code> in Vercel Project Settings → Environment Variables before deploying.
          </p>
        </div>
      </div>
    </section>
  );
}
