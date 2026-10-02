import { useRef, useState } from "react";

const toDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const parseDisplayDate = (str) => {
  const parts = str.trim().split(/[./]/);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (yyyy.length !== 4) return null;
  const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  const d = new Date(iso);
  if (isNaN(d) || d > new Date()) return null;
  return iso;
};

const DateEditor = ({ initialDate, onSave, onCancel }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState(false);

  const handleSave = () => {
    const iso = parseDisplayDate(inputRef.current?.value || "");
    if (!iso) {
      setError(true);
      return;
    }
    onSave(iso);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        defaultValue={toDisplayDate(initialDate)}
        placeholder="dd.mm.åååå"
        onKeyDown={handleKey}
        onChange={() => setError(false)}
        className="w-28 border rounded px-2 py-0.5 text-sm focus:outline-none"
        style={{ borderColor: error ? "var(--color-terracotta)" : "var(--color-border-strong)" }}
        autoFocus
      />
      <button
        onClick={handleSave}
        className="font-bold text-lg leading-none"
        style={{ color: "var(--color-sage)" }}
        title="Lagre"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="font-bold text-lg leading-none"
        style={{ color: "var(--color-text-faint)" }}
        title="Avbryt"
      >
        ✕
      </button>
    </div>
  );
};

export default DateEditor;
