import { useEffect, useState } from "react";
import { useToast } from "../../contexts/useToast";
import wrappedApi from "../../api/wrappedApi";

const FIELDS = [
  { key: "bestBook", label: "Årets beste bok" },
  { key: "worstBook", label: "Årets dårligste bok" },
  { key: "mostTalkedAbout", label: "Årets mest snakket om bok" },
  { key: "mostConfusing", label: "Mest forvirrende bok" },
  { key: "bestHateRead", label: 'Beste "hate read"' },
  { key: "favoriteCharacter", label: "Årets favorittkarakter", helper: "navn + bok" },
  { key: "mostAnnoyingCharacter", label: "Årets mest irriterende karakter", helper: "navn + bok" },
  { key: "bestSideCharacter", label: "Årets beste sidekarakter", helper: "navn + bok" },
  { key: "bestSpicyScene", label: "Årets beste smutscene", helper: "valgfritt" },
];

const emptyAwards = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});

const AwardsStep = ({ year, onBack, onSubmitted }) => {
  const toast = useToast();
  const [awards, setAwards] = useState(emptyAwards);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wrappedApi
      .getStatus(year)
      .then((data) => setAwards({ ...emptyAwards, ...(data.awards || {}) }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const update = (key, value) => setAwards((prev) => ({ ...prev, [key]: value }));

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await wrappedApi.saveAwards(year, awards);
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
      await wrappedApi.saveAwards(year, awards);
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
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-bold mb-1">
              {field.label}
              {field.helper && (
                <span className="font-normal ml-1" style={{ color: "var(--color-text-faint)" }}>
                  {field.helper}
                </span>
              )}
            </label>
            <input
              type="text"
              value={awards[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder="Søk blant bøkene dine..."
              className="input-field"
            />
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
