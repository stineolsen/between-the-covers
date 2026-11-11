// A lesemerke: a bookmark in the family's colour with a thin outline icon
// and the level printed on it. Earned badges are filled and stitched; the
// top level of a family gets a gold tab; badges not earned yet are dashed;
// secret ones show a lock. Icons follow the app's icon style (24px grid,
// 1.8 stroke, round caps).

const ICONS = {
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5z" />
      <path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19" />
      <path d="M9 7.5h6" />
    </>
  ),
  pages: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <path d="M4 15h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M20 15h-2.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1z" />
    </>
  ),
  pen: (
    <>
      <path d="M15.5 4.5l4 4L9 19H5v-4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
  bookx: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5z" />
      <path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19" />
      <path d="M10 7.5l4 4M14 7.5l-4 4" />
    </>
  ),
  gift: (
    <>
      <path d="M4.5 10.5h15V20h-15z" />
      <path d="M3.5 7.5h17v3h-17z" />
      <path d="M12 7.5V20" />
      <path d="M12 7.5C10.5 4.5 7 4.5 7 6.2S10 7.5 12 7.5c2 0 5 .4 5-1.3s-3.5-1.7-5 1.3" />
    </>
  ),
  people: (
    <>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.3a3 3 0 0 1 0 5.4" />
      <path d="M17.5 14.5A5.5 5.5 0 0 1 20.5 20" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z" />
      <path d="M3.5 12.5l8.5 4.5 8.5-4.5" />
      <path d="M3.5 16.5l8.5 4.5 8.5-4.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3.5l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7z" />
      <path d="M18 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  clock: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <path d="M8 11V8.5a4 4 0 0 1 8 0V11" />
      <path d="M6 11h12v9H6z" />
    </>
  ),
};

const RIBBON = "M10 1h44a9 9 0 0 1 9 9v76l-31-15-31 15V10a9 9 0 0 1 9-9z";
const STITCH = "M12 6h40a5 5 0 0 1 5 5v65l-25-12-25 12V11a5 5 0 0 1 5-5z";
const TAB = "M24 0h16v9l-8-3.5-8 3.5z";
const CREAM = "#fbeee2";
const GOLD = "#e0ac52";

// state: "earned" | "locked" | "secret"
const Bookmark = ({ color, icon, label, state = "earned", top = false, width = 48, title, className = "" }) => {
  const earned = state === "earned";
  const text = state === "secret" ? "?" : String(label ?? "");
  const fontSize = text.length > 4 ? 10.5 : text.length > 3 ? 12 : 14;
  const ink = earned ? CREAM : "var(--color-text-faint)";

  return (
    <svg
      viewBox="-1 -1 66 90"
      width={width}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
      style={{ display: "block", flexShrink: 0, filter: earned ? "drop-shadow(0 2px 3px rgba(0,0,0,0.18))" : undefined }}
    >
      {title && <title>{title}</title>}
      <path
        d={RIBBON}
        fill={earned ? color : "var(--color-card)"}
        stroke={earned ? "none" : "var(--color-border-strong)"}
        strokeWidth="1.5"
        strokeDasharray={earned ? undefined : "4 3"}
      />
      {earned && <path d={STITCH} fill="none" stroke={CREAM} strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 2.5" />}
      {earned && top && <path d={TAB} fill={GOLD} />}
      <g transform="translate(20 15)" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[state === "secret" ? "lock" : icon] || ICONS.sparkle}
      </g>
      <text x="32" y="56" textAnchor="middle" fontSize={fontSize} fill={ink} style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>
        {text}
      </text>
    </svg>
  );
};

export default Bookmark;
