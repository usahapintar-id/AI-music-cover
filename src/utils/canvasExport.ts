import type { CoverProjectState } from "../types/cover";
import { ARTWORK_PRESETS } from "../data/presets";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load artwork image."));
    img.src = src;
  });
}

function getFontStack(style: CoverProjectState["typography"]): string {
  switch (style) {
    case "editorial":
      return "'Fraunces', Georgia, serif";
    case "condensed":
      return "'Oswald', sans-serif";
    case "mono":
      return "'JetBrains Mono', monospace";
    case "display":
    default:
      return "'Bricolage Grotesque', sans-serif";
  }
}

function drawGenerativeMotif(
  ctx: CanvasRenderingContext2D,
  size: number,
  project: CoverProjectState
) {
  const { palette, motifPattern } = project;
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(
    size * 0.55,
    size * 0.38,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.78
  );
  grad.addColorStop(0, palette.accent + "55");
  grad.addColorStop(0.55, palette.surface + "CC");
  grad.addColorStop(1, palette.background);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.strokeStyle = palette.textPrimary + "33";
  ctx.lineWidth = 2;

  if (motifPattern === "vinyl-rings") {
    for (let r = 120; r <= 680; r += 36) {
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.48, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.48, 84, 0, Math.PI * 2);
    ctx.fill();
  } else if (motifPattern === "brutalist-horizon") {
    ctx.fillStyle = palette.surface;
    ctx.fillRect(0, size * 0.54, size, size * 0.46);
    ctx.fillStyle = palette.accent + "CC";
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.54, size * 0.19, Math.PI, 0);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? palette.background : palette.surface;
      ctx.fillRect(0, size * 0.56 + i * 28, size, 8);
    }
  } else if (motifPattern === "prism-rays") {
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.35);
      ctx.lineTo(i * (size / 11), size);
      ctx.stroke();
    }
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.22);
    ctx.lineTo(size * 0.68, size * 0.56);
    ctx.lineTo(size * 0.32, size * 0.56);
    ctx.closePath();
    ctx.stroke();
  } else if (motifPattern === "botanical-waves") {
    for (let y = 180; y < size - 160; y += 44) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += 24) {
        const offset = Math.sin(x * 0.008 + y * 0.02) * 32;
        if (x === 0) ctx.moveTo(x, y + offset);
        else ctx.lineTo(x, y + offset);
      }
      ctx.stroke();
    }
  } else {
    const step = 125;
    for (let x = step; x < size; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x, size - 80);
      ctx.stroke();
    }
    for (let y = step; y < size; y += step) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(size - 80, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export async function exportCoverAsPng(project: CoverProjectState): Promise<void> {
  const size = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  let imageUrl: string | null = null;
  if (project.artworkSource === "upload" && project.uploadedImageUrl) {
    imageUrl = project.uploadedImageUrl;
  } else if (project.artworkSource === "preset") {
    const preset = ARTWORK_PRESETS.find((p) => p.id === project.presetId);
    imageUrl = preset?.imageUrl ?? null;
  }

  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl);
      const scale = Math.max(size / img.width, size / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
    } catch {
      drawGenerativeMotif(ctx, size, project);
    }
  } else {
    drawGenerativeMotif(ctx, size, project);
  }

  // Contrast scrim
  const alpha = Math.min(0.92, Math.max(0.15, project.scrimIntensity / 100));
  const scrim = ctx.createLinearGradient(0, 0, 0, size);
  if (project.layoutAlignment === "top-split") {
    scrim.addColorStop(0, `rgba(10, 11, 14, ${alpha})`);
    scrim.addColorStop(0.5, `rgba(10, 11, 14, ${alpha * 0.35})`);
    scrim.addColorStop(1, `rgba(10, 11, 14, ${alpha * 0.7})`);
  } else {
    scrim.addColorStop(0, `rgba(10, 11, 14, ${alpha * 0.25})`);
    scrim.addColorStop(0.45, `rgba(10, 11, 14, ${alpha * 0.35})`);
    scrim.addColorStop(1, `rgba(10, 11, 14, ${alpha})`);
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, size, size);

  // Subtle film grain texture
  if (project.showFilmGrain) {
    ctx.save();
    for (let i = 0; i < 6500; i++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.045)";
      ctx.fillRect(gx, gy, 2, 2);
    }
    ctx.restore();
  }

  // Framing border
  const pad = 96;
  const textColor =
    project.artworkSource === "generative"
      ? project.palette.textPrimary
      : "#F6F4EF";
  const mutedColor =
    project.artworkSource === "generative"
      ? project.palette.textMuted
      : "rgba(246, 244, 239, 0.78)";

  ctx.fillStyle = mutedColor;
  ctx.font = "500 26px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(project.catalogCode.toUpperCase(), pad, pad + 26);

  ctx.textAlign = "right";
  ctx.fillText(project.editionLabel.toUpperCase(), size - pad, pad + 26);

  const fontStack = getFontStack(project.typography);
  const titleSize = project.typography === "condensed" ? 124 : 106;
  ctx.font = `700 ${titleSize}px ${fontStack}`;
  const titleLines = wrapTextLines(ctx, project.songTitle || "Untitled", size - pad * 2);
  const lineHeight = titleSize * 1.06;

  ctx.fillStyle = textColor;

  if (project.layoutAlignment === "centered") {
    ctx.textAlign = "center";
    const blockH = titleLines.length * lineHeight;
    const startY = size * 0.5 - blockH * 0.35;
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, size / 2, startY + idx * lineHeight);
    });
    ctx.fillStyle = mutedColor;
    ctx.font = "500 38px 'DM Sans', sans-serif";
    ctx.fillText(project.coverArtist, size / 2, startY + titleLines.length * lineHeight + 32);
  } else if (project.layoutAlignment === "top-split") {
    ctx.textAlign = "left";
    const startY = pad + 170;
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, pad, startY + idx * lineHeight);
    });
    ctx.fillStyle = mutedColor;
    ctx.font = "500 38px 'DM Sans', sans-serif";
    ctx.fillText(
      `${project.coverArtist} · ${project.targetStyle}`,
      pad,
      size - pad - 12
    );
  } else {
    ctx.textAlign = "left";
    const artistY = size - pad - 10;
    const titleStartY = artistY - 64 - (titleLines.length - 1) * lineHeight;
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, pad, titleStartY + idx * lineHeight);
    });
    ctx.fillStyle = mutedColor;
    ctx.font = "500 38px 'DM Sans', sans-serif";
    const subtitle = project.originalArtist
      ? `${project.coverArtist} (Cover of ${project.originalArtist})`
      : project.coverArtist;
    ctx.fillText(subtitle, pad, artistY);
  }

  if (project.showParentalMark) {
    const boxW = 210;
    const boxH = 66;
    const bx = size - pad - boxW;
    const by = size - pad - boxH;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.font = "700 20px 'JetBrains Mono', monospace";
    ctx.fillText("STUDIO MASTER", bx + boxW / 2, by + 40);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const safeName = (project.songTitle || "ai-music-cover")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  link.download = `${safeName || "ai-music-cover"}-1500px.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
