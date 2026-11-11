import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../../contexts/useToast";
import { shareOrDownload } from "../../../utils/wrappedShareImage";

const HOLD_MS = 180;

// Full-screen tap-through story, Spotify Wrapped style. Each slide is
// { key, theme, duration, render(), share? }. The current progress segment
// is a CSS animation whose end advances the story - pausing (hold, the
// pause button, or the tab going to the background) just pauses that
// animation, so there are no timers to keep in sync.
const StoryPlayer = ({ slides, onClose, badge }) => {
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [sharing, setSharing] = useState(false);
  const holdTimer = useRef(null);
  const wasHold = useRef(false);

  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "p") {
        setPaused((p) => !p);
      }
    };
    const onVisibility = () => document.hidden && setPaused(true);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.style.overflow = overflow;
    };
  }, [next, prev, onClose]);

  const onPointerDown = () => {
    wasHold.current = false;
    holdTimer.current = setTimeout(() => {
      wasHold.current = true;
      setHeld(true);
    }, HOLD_MS);
  };
  const onPointerUp = () => {
    clearTimeout(holdTimer.current);
    setHeld(false);
  };
  const onTap = (e) => {
    if (wasHold.current) return;
    if (e.target.closest("button, a")) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    if (e.clientX - left < width * 0.3) prev();
    else next();
  };

  const handleShare = async () => {
    if (!slide.share || sharing) return;
    setSharing(true);
    setPaused(true);
    try {
      const blob = await slide.share.render();
      const result = await shareOrDownload(blob, slide.share.filename);
      if (result === "downloaded") toast.success("Bildet er lastet ned 📸");
    } catch (error) {
      console.error("Share image failed:", error);
      toast.error("Klarte ikke lage bildet");
    } finally {
      setSharing(false);
    }
  };

  const running = !paused && !held && !isLast;
  const theme = slide.theme;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(10,6,8,0.92)" }}>
      <div
        role="region"
        aria-roledescription="historie"
        aria-label={`Bokwrapped, side ${index + 1} av ${slides.length}`}
        className="relative w-full h-[100dvh] sm:h-[min(92dvh,880px)] sm:w-auto sm:aspect-[9/16] sm:rounded-3xl overflow-hidden select-none shadow-2xl"
        style={{ background: theme.bg, color: theme.fg, transition: "background 0.5s ease" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onTap}
      >
        {/* Progress segments */}
        <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-3 pt-3" aria-hidden="true">
          {slides.map((s, i) => (
            <div key={s.key} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: `${theme.fg}40` }}>
              <div
                className="h-full origin-left"
                style={{
                  background: theme.fg,
                  transform: i < index ? "scaleX(1)" : "scaleX(0)",
                  animation:
                    i === index && !isLast
                      ? `wrappedProgress ${s.duration || 7000}ms linear forwards`
                      : i === index && isLast
                        ? "none"
                        : undefined,
                  animationPlayState: running ? "running" : "paused",
                  ...(i === index && isLast ? { transform: "scaleX(1)" } : {}),
                }}
                onAnimationEnd={i === index ? next : undefined}
              />
            </div>
          ))}
        </div>

        {/* Top bar */}
        <div className="absolute top-6 inset-x-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: theme.muted }}>
            <img src="/logo_cropped.png" alt="" className="h-6 w-auto" />
            {badge}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ color: theme.fg }}
              aria-label={paused ? "Spill av" : "Pause"}
            >
              {paused ? "▶" : "❚❚"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
              style={{ color: theme.fg }}
              aria-label="Lukk Bokwrapped"
            >
              ×
            </button>
          </div>
        </div>

        {/* Slide - keyed so its entrance animations replay */}
        <div key={slide.key} className="absolute inset-0 pt-20 pb-24 px-6 flex flex-col overflow-hidden" aria-live="polite">
          {slide.render({ next, restart: () => setIndex(0), close: onClose })}
        </div>

        {slide.share && (
          <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center">
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="px-6 py-3 rounded-full font-bold text-sm shadow-lg disabled:opacity-60 transition-transform hover:scale-105"
              style={{ background: theme.fg, color: theme.solid }}
            >
              {sharing ? "Lager bilde…" : `📤 ${slide.share.label}`}
            </button>
          </div>
        )}
      </div>

      {/* Desktop arrows outside the frame */}
      <button
        type="button"
        onClick={prev}
        disabled={index === 0}
        className="hidden sm:flex absolute left-[max(1rem,calc(50%-min(46dvh,440px)*0.5625-4.5rem))] w-12 h-12 rounded-full items-center justify-center text-2xl text-white/80 hover:text-white disabled:opacity-20"
        aria-label="Forrige"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        disabled={isLast}
        className="hidden sm:flex absolute right-[max(1rem,calc(50%-min(46dvh,440px)*0.5625-4.5rem))] w-12 h-12 rounded-full items-center justify-center text-2xl text-white/80 hover:text-white disabled:opacity-20"
        aria-label="Neste"
      >
        ›
      </button>
    </div>
  );
};

export default StoryPlayer;
