import { useState } from "react";
import { usersApi } from "../../api/usersApi";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { goalProgress } from "../../utils/readingGoal";

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
              style={{ width: `${pct}%`, background: "var(--color-sage)" }}
            />
          </div>
          <p
            className="text-xs mt-1.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {pct} % oppnådd
          </p>
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
