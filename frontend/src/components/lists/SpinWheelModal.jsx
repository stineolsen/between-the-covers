import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { booksApi } from "../../api/booksApi";
import BookCoverFallback from "../common/BookCoverFallback";

// Fixed segment colours (same family as the Bokwrapped book spines) with
// dark text - readable on every slice in both light and dark mode.
const SLICE_COLORS = ["#f2c46d", "#e8799f", "#59c08a", "#4fc1de", "#e8825a", "#f1e6dc", "#c9a0dc"];
const SLICE_TEXT = "#2a1a10";

const SIZE = 200;
const C = SIZE / 2;
const R = 96;

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Angles are degrees clockwise from 12 o'clock, where the pointer sits
const point = (deg, r) => {
  const rad = (deg * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
};

const slicePath = (start, end) => {
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
};

// Fair pick, not Math.random's
const randomIndex = (n) => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % n;
};

// Never two neighbours with the same colour, including last -> first
const sliceColor = (i, n) => {
  const color = SLICE_COLORS[i % SLICE_COLORS.length];
  if (i === n - 1 && n > 1 && color === SLICE_COLORS[0]) return SLICE_COLORS[2];
  return color;
};

const truncate = (text, max) => (text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text);

// Lucky wheel over a list's books. Picks are local to the modal - "Fjern fra
// hjulet" only takes a book off the wheel for the next spin, never off the
// list itself.
const SpinWheelModal = ({ listTitle, books, onClose }) => {
  const [removedIds, setRemovedIds] = useState(() => new Set());
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const pending = useRef(null);

  const pool = useMemo(() => books.filter((b) => !removedIds.has(b._id)), [books, removedIds]);
  const n = pool.length;
  const seg = n ? 360 / n : 360;

  // Smaller text as slices get thinner; label length to match
  const fontSize = Math.max(4, Math.min(9, ((2 * Math.PI * 60) / Math.max(n, 1)) * 0.55));
  const maxChars = Math.max(4, Math.floor(66 / (fontSize * 0.56)));

  const spin = () => {
    if (spinning || n < 2) return;
    const index = randomIndex(n);
    // Land somewhere inside the slice, not always dead centre
    const jitter = (randomIndex(1000) / 1000 - 0.5) * seg * 0.7;
    const target = index * seg + seg / 2 + jitter;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (((360 - target - current) % 360) + 360) % 360;

    // Reduced motion: no spin at all, just point at the pick
    if (prefersReducedMotion()) {
      setRotation(rotation + delta);
      setWinner(pool[index]);
      return;
    }

    pending.current = pool[index];
    setWinner(null);
    setSpinning(true);
    setRotation(rotation + (5 + randomIndex(3)) * 360 + delta);
  };

  const finish = () => {
    if (!pending.current) return;
    setWinner(pending.current);
    pending.current = null;
    setSpinning(false);
  };

  const removeWinner = () => {
    setRemovedIds((prev) => new Set(prev).add(winner._id));
    setWinner(null);
  };

  const reset = () => {
    setRemovedIds(new Set());
    setWinner(null);
  };

  const duration = 5200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spin-wheel-title"
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-6 animate-fadeIn shadow-2xl"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 id="spin-wheel-title" className="font-bold text-lg gradient-text truncate">
            🎡 Snurr hjulet · {listTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-xl font-bold leading-none hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: "var(--color-text-faint)" }}
            aria-label="Lukk"
          >
            ✕
          </button>
        </div>

        {n < 2 ? (
          <div className="text-center py-8">
            <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>
              {n === 1 ? "Bare én bok igjen på hjulet – den vinner uansett! 😄" : "Ingen bøker igjen på hjulet."}
            </p>
            <button onClick={reset} className="btn-secondary text-sm px-4 py-2">
              ↺ Legg alle bøkene tilbake
            </button>
          </div>
        ) : (
          <>
            <div className="relative mx-auto w-full max-w-[340px] aspect-square">
              {/* Pointer */}
              <div
                className="absolute left-1/2 -top-1 z-10 -translate-x-1/2"
                aria-hidden="true"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "12px solid transparent",
                  borderRight: "12px solid transparent",
                  borderTop: "22px solid var(--color-primary)",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
                }}
              />
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="w-full h-full"
                role="img"
                aria-label={`Lykkehjul med ${n} bøker`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? `transform ${duration}ms cubic-bezier(0.15, 0.7, 0.1, 1)` : "none",
                }}
                onTransitionEnd={finish}
              >
                <circle cx={C} cy={C} r={R + 3} fill="var(--color-primary)" />
                {pool.map((book, i) => {
                  const start = i * seg;
                  const mid = start + seg / 2;
                  return (
                    <g key={book._id}>
                      <path d={slicePath(start, start + seg)} fill={sliceColor(i, n)} stroke="rgba(0,0,0,0.12)" strokeWidth="0.4" />
                      <text
                        x={C + R - 6}
                        y={C}
                        transform={`rotate(${mid - 90} ${C} ${C})`}
                        textAnchor="end"
                        dominantBaseline="central"
                        fontSize={fontSize}
                        fontWeight="600"
                        fill={SLICE_TEXT}
                      >
                        {truncate(book.title, maxChars)}
                      </text>
                    </g>
                  );
                })}
                <circle cx={C} cy={C} r={14} fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth="3" />
              </svg>
            </div>

            <button
              onClick={spin}
              disabled={spinning}
              className="btn-primary w-full mt-5 py-3 text-base disabled:opacity-60"
            >
              {spinning ? "Snurrer…" : winner ? "🎡 Snurr igjen" : "🎡 Snurr!"}
            </button>
          </>
        )}

        <div aria-live="polite">
          {winner && (
            <div className="mt-5 p-4 rounded-2xl flex gap-4 items-center animate-fadeIn" style={{ background: "var(--color-sunken)" }}>
              <div className="w-16 aspect-[2/3] flex-shrink-0">
                <BookCoverFallback
                  src={winner.coverImage ? booksApi.getCoverUrl(winner.coverImage) : null}
                  alt={winner.title}
                  className="w-full h-full object-cover rounded-md shadow-md"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                  Hjulet har valgt 🎉
                </p>
                <p className="font-semibold leading-snug">{winner.title}</p>
                {winner.author && (
                  <p className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                    {winner.author}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-bold">
                  <Link to={`/books/${winner._id}`} style={{ color: "var(--color-primary)" }}>
                    Gå til boken →
                  </Link>
                  {n > 1 && (
                    <button onClick={removeWinner} style={{ color: "var(--color-text-muted)" }}>
                      Fjern fra hjulet
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {removedIds.size > 0 && n >= 2 && (
          <p className="mt-3 text-xs text-center" style={{ color: "var(--color-text-faint)" }}>
            {removedIds.size} {removedIds.size === 1 ? "bok" : "bøker"} tatt av hjulet ·{" "}
            <button onClick={reset} className="font-bold underline underline-offset-2">
              legg tilbake
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default SpinWheelModal;
