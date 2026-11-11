import { useEffect, useState } from "react";
import { booksApi } from "../../../api/booksApi";

// Full-bleed slide palettes. Fixed colours (not the site's light/dark
// tokens) - each slide is its own poster. Text/background pairs keep at
// least 4.5:1 contrast.
export const THEMES = {
  wine: { bg: "linear-gradient(160deg,#93264d 0%,#4f1129 100%)", solid: "#7a1d40", fg: "#fff6ec", muted: "rgba(255,246,236,0.78)", accent: "#f2c46d" },
  gold: { bg: "linear-gradient(160deg,#f0c672 0%,#c98f35 100%)", solid: "#b9802a", fg: "#2a1a10", muted: "rgba(42,26,16,0.75)", accent: "#6b1938" },
  sage: { bg: "linear-gradient(160deg,#2f7a50 0%,#143d29 100%)", solid: "#225e3d", fg: "#f2fbf4", muted: "rgba(242,251,244,0.78)", accent: "#f2c46d" },
  blue: { bg: "linear-gradient(160deg,#1e7a93 0%,#0d3a47 100%)", solid: "#155a6d", fg: "#f0fafd", muted: "rgba(240,250,253,0.78)", accent: "#f2c46d" },
  terracotta: { bg: "linear-gradient(160deg,#c1502a 0%,#6e2610 100%)", solid: "#9a3d1d", fg: "#fff4ec", muted: "rgba(255,244,236,0.8)", accent: "#ffe0a8" },
  ink: { bg: "linear-gradient(160deg,#3a2c2f 0%,#140f10 100%)", solid: "#2c2224", fg: "#f1e6dc", muted: "rgba(241,230,220,0.72)", accent: "#e8799f" },
  blush: { bg: "linear-gradient(160deg,#f8e3ea 0%,#e9b9ca 100%)", solid: "#e2a8bd", fg: "#4a1226", muted: "rgba(74,18,38,0.75)", accent: "#93264d" },
};

export const nb = (n) => Number(n || 0).toLocaleString("nb-NO");
export const dec = (n) => String(n).replace(".", ",");
// Norwegian genitive: "Stines", but "Jonas'"
export const genitive = (name) => (/[sxz]$/i.test(name) ? `${name}'` : `${name}s`);
export const plural = (n, one, many) => `${nb(n)} ${n === 1 ? one : many}`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Counts up from 0 to `value` with an ease-out
export function CountUp({ value, duration = 1400, delay = 200, format = nb }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let frame;
    const startAt = performance.now() + delay;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay]);

  return <>{format(shown)}</>;
}

// Staggered rise-in wrapper
export const Rise = ({ delay = 0, className = "", style, children, as: Tag = "div" }) => (
  <Tag className={`wrapped-rise ${className}`} style={{ ...style, animationDelay: `${delay}s` }}>
    {children}
  </Tag>
);

export const Kicker = ({ theme, children, delay = 0 }) => (
  <Rise delay={delay} className="text-sm font-bold uppercase tracking-[0.18em] mb-3" as="p">
    <span style={{ color: theme.muted }}>{children}</span>
  </Rise>
);

export const Headline = ({ children, delay = 0.1, className = "" }) => (
  <Rise
    delay={delay}
    as="h2"
    className={`text-3xl sm:text-[2rem] leading-tight font-semibold ${className}`}
  >
    <span style={{ fontFamily: "'Fraunces', serif" }}>{children}</span>
  </Rise>
);

export const BigNumber = ({ children, theme, delay = 0.2 }) => (
  <Rise delay={delay} className="my-2">
    <span
      className="block font-bold leading-none tracking-tight text-[5.5rem] sm:text-[6.5rem]"
      style={{ fontFamily: "'Fraunces', serif", color: theme.accent }}
    >
      {children}
    </span>
  </Rise>
);

export function Cover({ book, className = "", style }) {
  const src = book?.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;
  return (
    <div
      className={`aspect-[2/3] rounded-lg overflow-hidden shadow-xl flex-shrink-0 ${className}`}
      style={{ background: "rgba(255,255,255,0.18)", ...style }}
    >
      {src ? (
        <img src={src} alt={book.title} className="w-full h-full object-cover" draggable="false" />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs font-semibold leading-tight">
          {book?.title}
        </div>
      )}
    </div>
  );
}

// A cover with title/author underneath - the "one book" fact layout
export const BookFact = ({ book, theme, caption, delay = 0.3, size = "w-36" }) => (
  <Rise delay={delay} className="flex flex-col items-center text-center mt-6">
    <Cover book={book} className={`${size} wrapped-pop`} style={{ animationDelay: `${delay + 0.1}s` }} />
    <p className="mt-4 text-xl font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
      {book.title}
    </p>
    {book.author && (
      <p className="text-sm" style={{ color: theme.muted }}>
        {book.author}
      </p>
    )}
    {caption && (
      <p className="mt-3 text-base font-semibold" style={{ color: theme.fg }}>
        {caption}
      </p>
    )}
  </Rise>
);

// Vertically centres slide content
export const Center = ({ children, className = "" }) => (
  <div className={`flex-1 flex flex-col justify-center ${className}`}>{children}</div>
);
