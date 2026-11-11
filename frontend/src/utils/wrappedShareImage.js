import { booksApi } from "../api/booksApi";
import { genitive } from "../components/wrapped/results/slideParts";

// Draws Bokwrapped share cards as 1080x1920 PNGs (Instagram/phone story
// size) on a canvas. Covers are loaded through the API as same-origin blob
// URLs - a cover drawn straight from another origin would "taint" the
// canvas and make toBlob() throw.

const W = 1080;
const H = 1920;
const SERIF = "Fraunces, Georgia, serif";
const SANS = "'Public Sans', system-ui, sans-serif";

export const SHARE_THEMES = {
  wine: { from: "#93264d", to: "#4f1129", text: "#fff6ec", muted: "rgba(255,246,236,0.75)", accent: "#e0ac52" },
  gold: { from: "#e8b860", to: "#b9802a", text: "#2a1a10", muted: "rgba(42,26,16,0.72)", accent: "#6b1938" },
  sage: { from: "#2f7a50", to: "#174630", text: "#f2fbf4", muted: "rgba(242,251,244,0.75)", accent: "#e0ac52" },
  ink: { from: "#2c2224", to: "#140f10", text: "#f1e6dc", muted: "rgba(241,230,220,0.7)", accent: "#e8799f" },
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadCovers(books, limit) {
  const urls = [];
  const images = await Promise.all(
    books.slice(0, limit).map(async (book) => {
      if (!book.coverImage) return null;
      try {
        const url = await booksApi.getCoverBlobUrl(book._id);
        urls.push(url);
        return loadImage(url);
      } catch {
        return null;
      }
    }),
  );
  return { images, release: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx, text, x, y, { font, color, align = "center", maxWidth = W - 160, lineHeight }) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  const lines = wrapLines(ctx, text, maxWidth);
  const step = lineHeight || parseInt(font.match(/(\d+)px/)[1], 10) * 1.15;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * step));
  return y + lines.length * step;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx, img, book, x, y, w, h, theme) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = theme.muted;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  if (img) {
    // object-fit: cover
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x, y, w, h);
    drawText(ctx, book.title, x + w / 2, y + h / 2 - 10, {
      font: `600 ${Math.max(16, Math.round(w / 9))}px ${SERIF}`,
      color: theme.text,
      maxWidth: w - 20,
    });
  }
  ctx.restore();
}

async function baseCanvas(theme) {
  await Promise.all([
    document.fonts.load(`700 80px ${SERIF}`),
    document.fonts.load(`600 40px ${SANS}`),
  ]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, W * 0.4, H);
  gradient.addColorStop(0, theme.from);
  gradient.addColorStop(1, theme.to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Soft light blobs for depth
  for (const [x, y, r] of [[W * 0.85, H * 0.12, 420], [W * 0.1, H * 0.9, 520]]) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, "rgba(255,255,255,0.16)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  const logo = await loadImage("/logo_cropped.png");
  if (logo) {
    const lw = 220;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 90, lw, lh);
  }
  return { canvas, ctx };
}

function footer(ctx, theme, year) {
  drawText(ctx, `BTC Bokwrapped ${year}`, W / 2, H - 90, {
    font: `600 34px ${SANS}`,
    color: theme.muted,
  });
}

const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

// Summary: name, the headline numbers, personality and a row of covers
export async function renderSummaryCard({ year, name, personal, theme = SHARE_THEMES.wine }) {
  const { canvas, ctx } = await baseCanvas(theme);
  const { images, release } = await loadCovers(personal.books, 5);

  let y = drawText(ctx, `${genitive(name)} leseår`, W / 2, 470, { font: `700 92px ${SERIF}`, color: theme.text });
  drawText(ctx, String(year), W / 2, y + 10, { font: `700 64px ${SERIF}`, color: theme.accent });

  const stats = [
    [personal.count, personal.count === 1 ? "bok" : "bøker"],
    [personal.pages.toLocaleString("nb-NO"), "sider"],
    [personal.avgRating !== null ? `${String(personal.avgRating).replace(".", ",")}★` : "–", "snittvurdering"],
    [personal.topGenres[0]?.name || "–", "toppsjanger"],
  ];
  stats.forEach(([value, label], i) => {
    const cx = i % 2 === 0 ? W * 0.29 : W * 0.71;
    const cy = 790 + Math.floor(i / 2) * 230;
    drawText(ctx, String(value), cx, cy, { font: `700 ${String(value).length > 9 ? 54 : 84}px ${SERIF}`, color: theme.text, maxWidth: 440 });
    drawText(ctx, label, cx, cy + 62, { font: `500 34px ${SANS}`, color: theme.muted });
  });

  const personalities = personal.personalities || [personal.personality];
  roundRect(ctx, 110, 1230, W - 220, personalities.length > 1 ? 200 : 150, 60);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fill();
  personalities.forEach((p, i) => {
    drawText(ctx, `${p.emoji}  ${p.label}`, W / 2, (personalities.length > 1 ? 1312 : 1325) + i * 72, {
      font: `700 ${personalities.length > 1 ? 48 : 54}px ${SERIF}`,
      color: theme.text,
      maxWidth: W - 280,
    });
  });

  const cw = 160;
  const ch = 240;
  const gap = 22;
  const n = images.length;
  const startX = (W - (n * cw + (n - 1) * gap)) / 2;
  images.forEach((img, i) => {
    drawCover(ctx, img, personal.books[i], startX + i * (cw + gap), 1470, cw, ch, theme);
  });

  footer(ctx, theme, year);
  release();
  return toBlob(canvas);
}

// Personalities: one or two blocks of emoji, label and description
export async function renderPersonalityCard({ year, name, personalities, theme = SHARE_THEMES.ink }) {
  const { canvas, ctx } = await baseCanvas(theme);
  const two = personalities.length > 1;
  drawText(ctx, two ? `${name} er både` : `${name} er`, W / 2, 500, { font: `500 46px ${SANS}`, color: theme.muted });

  const blockTop = two ? [560, 1150] : [700];
  personalities.forEach((personality, i) => {
    const top = blockTop[i];
    if (two) {
      roundRect(ctx, 90, top, W - 180, 520, 48);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
    }
    ctx.font = `${two ? 130 : 200}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = theme.text;
    ctx.fillText(personality.emoji, W / 2, top + (two ? 160 : 160));
    const y = drawText(ctx, personality.label, W / 2, top + (two ? 280 : 360), {
      font: `700 ${two ? 68 : 104}px ${SERIF}`,
      color: theme.accent,
      lineHeight: two ? 78 : 116,
      maxWidth: W - 260,
    });
    drawText(ctx, personality.description, W / 2, y + (two ? 30 : 60), {
      font: `400 ${two ? 36 : 44}px ${SANS}`,
      color: theme.muted,
      maxWidth: W - 280,
      lineHeight: two ? 50 : 62,
    });
  });
  footer(ctx, theme, year);
  return toBlob(canvas);
}

// Cover wall: every book of the year, tiles shrinking until all of them fit
export async function renderCoverWallCard({ year, personal, theme = SHARE_THEMES.gold }) {
  const { canvas, ctx } = await baseCanvas(theme);
  const books = personal.books;
  const { images, release } = await loadCovers(books, books.length);

  drawText(ctx, `${year} i ${personal.count} ${personal.count === 1 ? "bok" : "bøker"}`, W / 2, 450, {
    font: `700 84px ${SERIF}`,
    color: theme.text,
  });

  const top = 540;
  const bottom = H - 170;
  const areaW = W - 140;
  const areaH = bottom - top;
  const gap = books.length > 60 ? 8 : 14;
  // Fewest columns whose 2:3 tiles fit the area
  let cols = 1;
  while (cols < 30) {
    const w = (areaW - (cols - 1) * gap) / cols;
    const rows = Math.ceil(books.length / cols);
    if (rows * (w * 1.5) + (rows - 1) * gap <= areaH) break;
    cols++;
  }
  const tw = (areaW - (cols - 1) * gap) / cols;
  const th = tw * 1.5;
  const rows = Math.ceil(books.length / cols);
  const offsetY = top + (areaH - (rows * th + (rows - 1) * gap)) / 2;
  books.forEach((book, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? books.length - row * cols : cols;
    const rowOffset = (areaW - (inRow * tw + (inRow - 1) * gap)) / 2;
    drawCover(ctx, images[i], book, 70 + rowOffset + col * (tw + gap), offsetY + row * (th + gap), tw, th, theme);
  });

  footer(ctx, theme, year);
  release();
  return toBlob(canvas);
}

// Native share sheet where available (phones), download otherwise
export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
