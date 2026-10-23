// AabSara PRO — Streamlabs & StreamElements Overlay Engine & Chroma Key Compositor
// High-performance real-time 60 FPS Canvas rendering with customizable templates

export interface OverlayConfig {
  theme: "none" | "crimson" | "cyber" | "gold" | "minimal";
  streamerName: string;
  socialYt: string;
  socialFb: string;
  socialTwitch: string;
  tickerText: string;
  showWebcamBorder: boolean;
  webcamPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  webcamWidth: number;
  webcamHeight: number;
  greenScreenEnabled: boolean;
  greenScreenColor: string; // hex
  greenScreenTolerance: number; // 0.1 - 0.8
  greenScreenSmoothness: number; // 0.01 - 0.3
}

export const defaultOverlayConfig: OverlayConfig = {
  theme: "crimson",
  streamerName: "AabSara Streamer",
  socialYt: "@AabSaraLive",
  socialFb: "/AabSaraGaming",
  socialTwitch: "aabsara_pro",
  tickerText: "★ LIVE WITH AABSARA PRO • LIKE & SUBSCRIBE • 1080P 60FPS ★",
  showWebcamBorder: true,
  webcamPosition: "bottom-right",
  webcamWidth: 280,
  webcamHeight: 160,
  greenScreenEnabled: false,
  greenScreenColor: "#00ff00",
  greenScreenTolerance: 0.38,
  greenScreenSmoothness: 0.12,
};

// Fast Hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Real-Time Chroma Key (Green Screen background removal)
export function processChromaKey(
  sourceCanvas: HTMLCanvasElement,
  keyColorHex: string,
  tolerance: number,
  smoothness: number
) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (w === 0 || h === 0) return;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const [kr, kg, kb] = hexToRgb(keyColorHex);

  const tol = tolerance * 441.67; // max distance between RGB vectors is sqrt(255^2*3) = 441.67
  const smooth = smoothness * 441.67;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);

    if (dist < tol) {
      data[i + 3] = 0; // Completely transparent
    } else if (dist < tol + smooth) {
      const alpha = (dist - tol) / smooth;
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

// Render Streamlabs / StreamElements Style Overlays onto the Composited Video Canvas
export function renderOverlayElements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cfg: OverlayConfig
) {
  if (cfg.theme === "none") return;

  ctx.save();

  // Colors based on theme
  let primaryColor = "#e60026"; // Crimson
  let secondaryColor = "#ff334b";
  let bgGradientStart = "rgba(20, 10, 15, 0.85)";

  if (cfg.theme === "cyber") {
    primaryColor = "#00f0ff";
    secondaryColor = "#9d4edd";
    bgGradientStart = "rgba(10, 15, 30, 0.85)";
  } else if (cfg.theme === "gold") {
    primaryColor = "#d4af37";
    secondaryColor = "#fced95";
    bgGradientStart = "rgba(25, 20, 10, 0.85)";
  } else if (cfg.theme === "minimal") {
    primaryColor = "rgba(255, 255, 255, 0.8)";
    secondaryColor = "rgba(255, 255, 255, 0.4)";
    bgGradientStart = "rgba(10, 12, 18, 0.75)";
  }

  // 1. TOP STREAM HEADER / TICKER (StreamElements Style)
  const topBarHeight = 36;
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, bgGradientStart);
  topGrad.addColorStop(0.5, "rgba(5, 7, 12, 0.95)");
  topGrad.addColorStop(1, bgGradientStart);

  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, topBarHeight);

  // Top Neon Accent Border Line
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, topBarHeight);
  ctx.lineTo(width, topBarHeight);
  ctx.stroke();

  // Left: Streamer Name Badge
  ctx.fillStyle = primaryColor;
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`🎮 ${cfg.streamerName.toUpperCase()}`, 16, 23);

  // Center: Ticker Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const tickerWidth = ctx.measureText(cfg.tickerText).width;
  ctx.fillText(cfg.tickerText, (width - tickerWidth) / 2, 22);

  // Right: Social Tags
  const socials = `YT: ${cfg.socialYt}  |  FB: ${cfg.socialFb}`;
  ctx.fillStyle = secondaryColor;
  ctx.font = "bold 11px monospace";
  const socialWidth = ctx.measureText(socials).width;
  ctx.fillText(socials, width - socialWidth - 16, 22);

  // 2. BOTTOM CORNER STREAM WATERMARK
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 10px monospace";
  ctx.fillText("POWERED BY AABSARA PRO", 16, height - 14);

  ctx.restore();
}

// Render Streamlabs Style Webcam PiP Frame
export function renderWebcamFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cfg: OverlayConfig
) {
  if (!cfg.showWebcamBorder) return;

  ctx.save();

  let borderColor = "#e60026";
  let glowColor = "rgba(230, 0, 38, 0.6)";

  if (cfg.theme === "cyber") {
    borderColor = "#00f0ff";
    glowColor = "rgba(0, 240, 255, 0.6)";
  } else if (cfg.theme === "gold") {
    borderColor = "#d4af37";
    glowColor = "rgba(212, 175, 55, 0.6)";
  } else if (cfg.theme === "minimal") {
    borderColor = "rgba(255, 255, 255, 0.5)";
    glowColor = "rgba(255, 255, 255, 0.2)";
  }

  // Outer Border Box
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  // Corner Accent Brackets (Cyber / Esports Look)
  const bracketLen = 14;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(x, y + bracketLen);
  ctx.lineTo(x, y);
  ctx.lineTo(x + bracketLen, y);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(x + w - bracketLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + bracketLen);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - bracketLen);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + bracketLen, y + h);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(x + w - bracketLen, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - bracketLen);
  ctx.stroke();

  // Streamer Name Pill Under Webcam
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(10, 12, 18, 0.85)";
  ctx.fillRect(x, y + h - 22, w, 22);

  ctx.fillStyle = borderColor;
  ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(cfg.streamerName, x + 8, y + h - 8);

  ctx.fillStyle = "#00e676";
  ctx.beginPath();
  ctx.arc(x + w - 12, y + h - 11, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
