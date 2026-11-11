import { useEffect, useState } from "react";
import { useToast } from "../../contexts/useToast";
import wrappedApi from "../../api/wrappedApi";

// "Which meetings were you actually at?" - RSVPs are only sign-ups, so the
// member confirms (pre-ticked from their RSVPs). Every change is saved.
const MeetingAttendance = ({ year }) => {
  const toast = useToast();
  const [meetings, setMeetings] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wrappedApi
      .getMeetings(year)
      .then((data) => {
        setMeetings(data.meetings || []);
        setConfirmed(data.confirmed);
      })
      .catch(() => setMeetings([]));
  }, [year]);

  const save = async (next) => {
    setSaving(true);
    try {
      await wrappedApi.saveMeetings(
        year,
        next.filter((m) => m.attended).map((m) => m._id),
      );
      setConfirmed(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre oppmøtet");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id) => {
    const next = meetings.map((m) => (m._id === id ? { ...m, attended: !m.attended } : m));
    setMeetings(next);
    save(next);
  };

  if (!meetings || meetings.length === 0) return null;
  const attendedCount = meetings.filter((m) => m.attended).length;

  return (
    <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--color-sunken)" }}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h4 className="text-sm font-bold">📅 Hvilke bokklubbmøter var du på i {year}?</h4>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
          {attendedCount} av {meetings.length}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
        Vi har krysset av møtene du meldte deg på. Rett opp hvis du likevel ikke kom, eller kom uten å melde deg på.
      </p>
      <div className="flex flex-col gap-1.5">
        {meetings.map((m) => (
          <label
            key={m._id}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
            style={{ background: "var(--color-card)" }}
          >
            <input
              type="checkbox"
              checked={m.attended}
              onChange={() => toggle(m._id)}
              disabled={saving}
              className="w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm min-w-0">
              <b className="block truncate">{m.book?.title || m.title}</b>
              <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                {new Date(m.date).toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}
                {m.rsvp ? " · påmeldt" : ""}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 mt-3 text-xs">
        {confirmed ? (
          <span className="font-bold" style={{ color: "var(--color-sage)" }}>
            ✓ Oppmøtet er lagret
          </span>
        ) : (
          <button onClick={() => save(meetings)} disabled={saving} className="font-bold" style={{ color: "var(--color-primary)" }}>
            Ja, dette stemmer ✓
          </button>
        )}
      </div>
    </div>
  );
};

export default MeetingAttendance;
