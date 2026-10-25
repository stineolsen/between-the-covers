import { useEffect, useRef, useState } from "react";
import settingsApi from "../../api/settingsApi";

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

// Site-wide homepage announcement, editable here with light rich-text
// formatting (bold/italic/underline/link/list) via a contentEditable div.
// Stored as sanitized HTML server-side (see settingsController.js) since
// it's rendered with dangerouslySetInnerHTML for every member on Home.jsx.
const BannerAdminPanel = () => {
  const editorRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    settingsApi
      .getBannerForAdmin()
      .then((data) => {
        setEnabled(!!data.banner?.enabled);
        if (editorRef.current) editorRef.current.innerHTML = data.banner?.html || "";
      })
      .catch(() => setFeedback("Klarte ikke laste meldingen"))
      .finally(() => setLoading(false));
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

  const handleSave = async () => {
    setSaving(true);
    setFeedback("");
    try {
      const html = editorRef.current?.innerHTML || "";
      const data = await settingsApi.setBanner(html, enabled);
      if (editorRef.current) editorRef.current.innerHTML = data.banner.html;
      setFeedback("Lagret!");
    } catch (err) {
      setFeedback(err.response?.data?.message || "Klarte ikke lagre meldingen");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  return (
    <div className="container-gradient animate-fadeIn">
      <h3 className="text-2xl font-bold gradient-text mb-2">📣 Melding på forsiden</h3>
      <p className="text-text-muted mb-4">
        Vises øverst på forsiden for alle medlemmer helt til du skrur den av igjen - fint for
        beskjeder som gjelder hele klubben (f.eks. endret møtetid, teknisk nedetid).
      </p>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          id="bannerEnabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="bannerEnabled" className="text-sm font-bold text-text-muted">
          Vis meldingen på forsiden
        </label>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Laster ...</p>
      ) : (
        <>
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
            }}
          />

          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Lagrer..." : "💾 Lagre melding"}
            </button>
            {feedback && (
              <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                {feedback}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerAdminPanel;
