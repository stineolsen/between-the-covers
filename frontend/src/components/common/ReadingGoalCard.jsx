import { useState } from "react";
import { usersApi } from "../../api/usersApi";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { goalProgress, getPaceStatus } from "../../utils/readingGoal";

const PACE_STYLES = {
  done: { label: "🎉 Mål nådd!", background: "var(--color-sage-tint)", color: "var(--color-sage)" },
  ahead: (diff) => ({
    label: `🔥 ${diff} ${diff === 1 ? "bok" : "bøker"} foran skjema`,
    background: "var(--color-sage-tint)",
    color: "var(--color-sage)",
  }),
  "on-track": { label: "I rute", background: "var(--color-gold-tint)", color: "var(--color-secondary)" },
  behind: (diff) => ({
    label: `${diff} ${diff === 1 ? "bok" : "bøker"} bak skjema`,
    background: "var(--color-terracotta-tint)",
    color: "var(--color-terracotta)",
  }),
};

const paceBadge = (pace) => {
  if (!pace) return null;
  const style = PACE_STYLES[pace.state];
  return typeof style === "function" ? style(pace.diff) : style;
};

// "Din leseframgang" — shows progress toward a per-user, per-year reading
// goal (user.readingGoal) and lets the user set/change it inline.
const ReadingGoalCard = ({ readCount }) => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user?.readingGoal || 20);
  const [saving, setSaving] = useState(false);

  const goal = user?.readingGoal;
  const pct = goalProgress(readCount, goal);
  const pace = paceBadge(getPaceStatus(readCount, goal));

  const handleSave = async () => {
    const goalNum = Math.max(1, parseInt(value, 10) || 1);
    setSaving(true);
    try {
      const data = await usersApi.updateProfile({ readingGoal: goalNum });
      setUser(data.user);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Greide ikke lagre lesemål");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mb-5">
      <div className="flex justify-between items-center mb-1">
        <h3
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--color-text-faint)" }}
        >
          Din leseframgang
        </h3>
        {!editing && (
          <button
            onClick={() => {
              setValue(goal || 20);
              setEditing(true);
            }}
            className="text-xs font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            {goal ? "Endre mål" : "Sett et mål"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-field"
            style={{ width: "5.5rem", padding: "0.5rem 0.6rem" }}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm py-2 px-3 disabled:opacity-50"
          >
            {saving ? "…" : "Lagre"}
          </button>
        </div>
      ) : goal ? (
        <>
          <div
            className="font-semibold"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "2rem",
              lineHeight: 1,
            }}
          >
            {readCount}
            <span
              className="text-lg font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              {" "}
              / {goal}
            </span>
          </div>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            bøker lest mot årets mål
          </p>
          <div
            className="h-2 rounded-full mt-3 overflow-hidden"
            style={{ background: "var(--color-sunken)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pace?.color === "var(--color-terracotta)" ? "var(--color-terracotta)" : "var(--color-sage)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {pct} % oppnådd
            </p>
            {pace && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: pace.background, color: pace.color }}
              >
                {pace.label}
              </span>
            )}
          </div>
        </>
      ) : (
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          Du har lest {readCount} {readCount === 1 ? "bok" : "bøker"} i år.
          Sett et mål for å følge fremgangen din.
        </p>
      )}
    </div>
  );
};

export default ReadingGoalCard;
