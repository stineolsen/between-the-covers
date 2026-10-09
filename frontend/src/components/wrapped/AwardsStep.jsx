import { useEffect, useState } from "react";
import { useToast } from "../../contexts/useToast";
import wrappedApi from "../../api/wrappedApi";
import BookPicker from "./BookPicker";

const AwardsStep = ({ year, onBack, onSubmitted }) => {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [values, setValues] = useState({}); // questionId -> string | Book | null
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([wrappedApi.getQuestions(year), wrappedApi.getStatus(year)])
      .then(([questionsData, statusData]) => {
        const qs = questionsData.questions || [];
        setQuestions(qs);

        const initial = {};
        for (const answer of statusData.answers || []) {
          const questionId = answer.question;
          if (answer.textValue !== null && answer.textValue !== undefined) {
            initial[questionId] = answer.textValue;
          } else if (answer.numberValue !== null && answer.numberValue !== undefined) {
            initial[questionId] = String(answer.numberValue);
          } else if (answer.bookValue) {
            initial[questionId] = answer.bookValue;
          }
        }
        setValues(initial);
      })
      .catch(() => toast.error("Klarte ikke hente spørsmålene"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const update = (questionId, value) => setValues((prev) => ({ ...prev, [questionId]: value }));

  const buildAnswers = () =>
    questions.map((q) => {
      const raw = values[q._id];
      let value = raw;
      if (q.type === "book-library" || q.type === "book-bookclub") {
        value = raw?._id || null;
      }
      return { questionId: q._id, value };
    });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await wrappedApi.saveAwards(year, buildAnswers());
      toast.success("Kladd lagret ✓");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre kladden");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await wrappedApi.saveAwards(year, buildAnswers());
      await wrappedApi.submit(year);
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke sende inn nominasjonene");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Laster...</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        Dine nominasjoner
      </h3>
      <p className="text-sm mb-1" style={{ color: "var(--color-text-muted)" }}>
        Svarene dine samles inn til BTC Book Awards i januar. Hopp gjerne over kategorier du er
        usikker på.
      </p>
      <p className="text-xs font-bold mb-4" style={{ color: "var(--color-terracotta)" }}>
        ⏰ Frist: 27. desember
      </p>

      <div className="flex flex-col gap-3.5 mb-5">
        {questions.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
            Ingen spørsmål er satt opp for {year} ennå.
          </p>
        )}
        {questions.map((q) => (
          <div key={q._id}>
            <label className="block text-xs font-bold mb-1">
              {q.label}
              {q.helper && (
                <span className="font-normal ml-1" style={{ color: "var(--color-text-faint)" }}>
                  {q.helper}
                </span>
              )}
            </label>

            {q.type === "text" && (
              <input
                type="text"
                value={values[q._id] || ""}
                onChange={(e) => update(q._id, e.target.value)}
                placeholder="Skriv svaret ditt..."
                className="input-field"
              />
            )}

            {q.type === "number" && (
              <input
                type="number"
                value={values[q._id] || ""}
                onChange={(e) => update(q._id, e.target.value)}
                className="input-field"
              />
            )}

            {(q.type === "book-library" || q.type === "book-bookclub") && (
              <BookPicker
                mode={q.type === "book-library" ? "library" : "bookclub"}
                year={year}
                value={values[q._id] || null}
                onChange={(book) => update(q._id, book)}
              />
            )}
          </div>
        ))}
      </div>

      <div
        className="flex justify-between items-center pt-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <button onClick={onBack} className="btn-secondary text-sm">← Tilbake</button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="text-sm font-bold"
            style={{ color: "var(--color-text-faint)" }}
          >
            Lagre kladd
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary text-sm">
            Send inn nominasjoner
          </button>
        </div>
      </div>
    </div>
  );
};

export default AwardsStep;
