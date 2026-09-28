// A small accessible on/off switch - plain checkboxes elsewhere in the app
// look like form inputs, this reads as a toggle for view/display options.
const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-2 cursor-pointer select-none"
  >
    <span
      className="relative inline-flex items-center rounded-full transition-colors flex-shrink-0"
      style={{
        width: "2.25rem",
        height: "1.25rem",
        background: checked ? "var(--color-primary-solid)" : "var(--color-border-strong)",
      }}
    >
      <span
        className="inline-block rounded-full shadow-sm transition-transform"
        style={{
          width: "0.95rem",
          height: "0.95rem",
          background: "white",
          transform: checked ? "translateX(1.1rem)" : "translateX(0.15rem)",
        }}
      />
    </span>
    <span className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
      {label}
    </span>
  </button>
);

export default Switch;
