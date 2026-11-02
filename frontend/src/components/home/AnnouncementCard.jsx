import { useState } from "react";
import { useToast } from "../../contexts/useToast";
import announcementsApi from "../../api/announcementsApi";

const htmlToText = (html) =>
  new DOMParser().parseFromString(html, "text/html").body.textContent || "";

// Admin message on the homepage. After a few days (decided by the backend
// via dismissibleAt) the user can collapse it to a one-line bar - it stays
// collapsed for them until admin deletes it or it expires.
const AnnouncementCard = ({ announcement }) => {
  const toast = useToast();
  const [dismissed, setDismissed] = useState(announcement.dismissed);
  const [expanded, setExpanded] = useState(false);

  const canDismiss = !dismissed && new Date() >= new Date(announcement.dismissibleAt);
  const collapsed = dismissed && !expanded;

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await announcementsApi.dismiss(announcement._id);
    } catch (err) {
      setDismissed(false);
      toast.error(err.response?.data?.message || "Klarte ikke skjule meldingen");
    }
  };

  const label = (
    <span
      className="text-xs font-bold uppercase tracking-wide flex-shrink-0"
      style={{ color: "var(--color-primary)" }}
    >
      Melding fra Admin
    </span>
  );

  if (collapsed) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mb-3 px-4 py-2 rounded-xl flex items-center gap-3 text-left text-sm animate-fadeIn hover:opacity-90 transition-opacity"
        style={{
          background: "var(--color-sunken)",
          border: "1px solid var(--color-border)",
        }}
        title="Vis meldingen"
      >
        {label}
        <span className="truncate flex-1 min-w-0" style={{ color: "var(--color-text-muted)" }}>
          {htmlToText(announcement.html)}
        </span>
        <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--color-text-faint)" }}>
          Vis ▾
        </span>
      </button>
    );
  }

  return (
    <div
      className="mb-6 p-4 rounded-2xl animate-fadeIn text-sm leading-relaxed relative"
      style={{
        background: "linear-gradient(135deg, var(--color-wine-tint), var(--color-gold-tint))",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        {label}
        {canDismiss && (
          <button
            onClick={handleDismiss}
            className="text-base leading-none font-bold -mt-1"
            style={{ color: "var(--color-text-faint)" }}
            title="Skjul meldingen"
            aria-label="Skjul meldingen"
          >
            ✕
          </button>
        )}
        {dismissed && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs font-bold"
            style={{ color: "var(--color-text-faint)" }}
          >
            Skjul ▴
          </button>
        )}
      </div>
      <div style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: announcement.html }} />
    </div>
  );
};

export default AnnouncementCard;
