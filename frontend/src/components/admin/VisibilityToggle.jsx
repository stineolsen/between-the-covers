// Shared three-state launch toggle for seasonal features (Bokwrapped,
// Julekalender) - open to everyone, admin-only preview, or fully hidden
// (even from admin on the player-facing pages; admin's own edit screens are
// separate routes and stay reachable regardless).
const OPTIONS = [
  { value: "open", label: "🌍 Åpen for alle", activeBg: "var(--color-sage-solid)" },
  { value: "admin-only", label: "🔒 Kun admin", activeBg: "var(--color-terracotta-solid)" },
  { value: "hidden", label: "🙈 Skjult for alle", activeBg: "var(--color-text)" },
];

const NOTES = {
  "admin-only": { text: "Skjult for medlemmer — kun admin ser den.", color: "var(--color-terracotta)" },
  hidden: {
    text: "Skjult for alle, også admin, på de vanlige sidene. Du kan fortsatt redigere innholdet her.",
    color: "var(--color-text-muted)",
  },
};

const VisibilityToggle = ({ value, busy, onChange, label = "Synlighet:" }) => {
  const note = NOTES[value];
  return (
    <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl" style={{ background: "var(--color-sunken)" }}>
      <span className="text-sm font-bold text-text-muted">{label}</span>
      <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid var(--color-border-strong)" }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={busy || value === null}
            className="px-4 py-1.5 text-sm font-bold disabled:opacity-50"
            style={
              value === opt.value
                ? { background: opt.activeBg, color: "#fff" }
                : { background: "var(--color-card)", color: "var(--color-text-muted)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      {note && (
        <span className="text-xs" style={{ color: note.color }}>
          {note.text}
        </span>
      )}
    </div>
  );
};

export default VisibilityToggle;
