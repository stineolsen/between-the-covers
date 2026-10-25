import { useEffect, useRef, useState } from "react";
import announcementsApi from "../../api/announcementsApi";

const DURATION_OPTIONS = [
  { key: "1d", label: "1 dag" },
  { key: "3d", label: "3 dager" },
  { key: "1w", label: "1 uke" },
  { key: "2w", label: "2 uker" },
  { key: "1m", label: "1 måned" },
  { key: "forever", label: "Til jeg sletter den" },
];

const ToolbarButton = ({ onClick, title, children }) => (
  <button
    type="button"
    // onMouseDown (not onClick) with preventDefault keeps the current text
    // selection inside the contentEditable div alive - otherwise clicking
    // the button would blur the editor and collapse the selection before
    // the format command ever runs.
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors hover:opacity-80"
    style={{ background: "var(--color-sunken)", color: "var(--color-text)" }}
  >
    {children}
  </button>
);

const formatExpiry = (expiresAt, now) => {
  if (!expiresAt) return "Ingen utløpsdato";
  const date = new Date(expiresAt);
  const expired = date.getTime() < now;
  const formatted = date.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  return expired ? `Utløpt ${formatted}` : `Utløper ${formatted}`;
};

// Admin can stack several site-wide homepage messages at once, each with
// its own lifespan - replaces the old single always-on/off banner.
const BannerAdminPanel = () => {
  const editorRef = useRef(null);
  const [now] = useState(() => Date.now());
  const [duration, setDuration] = useState("1w");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadAll = () => {
    setLoading(true);
    announcementsApi
      .getAllForAdmin()
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => setFeedback("Klarte ikke laste meldingene"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const format = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const handleLink = () => {
    const url = window.prompt("Lenke (https://...)");
    if (!url) return;
    format("createLink", url);
  };

  const handleAdd = async () => {
    const html = editorRef.current?.innerHTML || "";
    setSaving(true);
    setFeedback("");
    try {
      await announcementsApi.create(html, duration);
      if (editorRef.current) editorRef.current.innerHTML = "";
      loadAll();
      setFeedback("Melding lagt til!");
    } catch (err) {
      setFeedback(err.response?.data?.message || "Klarte ikke lagre meldingen");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await announcementsApi.remove(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch {
      setFeedback("Klarte ikke slette meldingen");
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h3 className="text-2xl font-bold gradient-text mb-2">📣 Meldinger på forsiden</h3>
      <p className="text-text-muted mb-4">
        Hver melding vises øverst på forsiden for alle medlemmer til den utløper (eller til du
        sletter den) - legg til flere for å stable dem etter hverandre.
      </p>

      <div className="flex gap-1.5 mb-2 flex-wrap">
        <ToolbarButton onClick={() => format("bold")} title="Fet">B</ToolbarButton>
        <ToolbarButton onClick={() => format("italic")} title="Kursiv"><i>I</i></ToolbarButton>
        <ToolbarButton onClick={() => format("underline")} title="Understreket"><u>U</u></ToolbarButton>
        <ToolbarButton onClick={handleLink} title="Legg til lenke">🔗</ToolbarButton>
        <ToolbarButton onClick={() => format("insertUnorderedList")} title="Punktliste">•≡</ToolbarButton>
        <ToolbarButton onClick={() => format("removeFormat")} title="Fjern formatering">✕</ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="rounded-xl px-4 py-3 text-sm min-h-[90px] focus:outline-none"
        style={{
          background: "var(--color-sunken)",
          border: "1px solid var(--color-border-strong)",
          color: "var(--color-text)",
          whiteSpace: "pre-wrap",
        }}
      />

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="input-field w-auto text-sm"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        <button onClick={handleAdd} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Legger til..." : "➕ Legg til melding"}
        </button>
        {feedback && (
          <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
            {feedback}
          </span>
        )}
      </div>

      <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-faint)" }}>
          Alle meldinger
        </p>
        {loading ? (
          <p className="text-text-muted text-sm">Laster ...</p>
        ) : announcements.length === 0 ? (
          <p className="text-text-muted text-sm">Ingen meldinger lagt til ennå.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => {
              const expired = a.expiresAt && new Date(a.expiresAt).getTime() < now;
              return (
                <div
                  key={a._id}
                  className="rounded-xl p-3 flex items-start gap-3"
                  style={{
                    background: "var(--color-sunken)",
                    border: "1px solid var(--color-border)",
                    opacity: expired ? 0.55 : 1,
                  }}
                >
                  <div
                    className="flex-1 min-w-0 text-sm"
                    style={{ whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ __html: a.html }}
                  />
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs mb-1.5" style={{ color: "var(--color-text-faint)" }}>
                      {formatExpiry(a.expiresAt, now)}
                    </p>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-[var(--color-terracotta-tint)] transition-all"
                      style={{ color: "var(--color-terracotta)" }}
                    >
                      🗑️ Slett
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerAdminPanel;
