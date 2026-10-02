import { useEffect, useState } from "react";
import { useToast } from "../../contexts/useToast";
import wrappedApi from "../../api/wrappedApi";
import BookRankingList from "../lists/BookRankingList";

const RankBookclubStep = ({ year, onBack, onNext }) => {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wrappedApi
      .getRankingList(year)
      .then((data) => setList(data.list))
      .catch(() => toast.error("Klarte ikke hente rangeringslisten"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const handleNext = async () => {
    setSaving(true);
    try {
      await wrappedApi.markRankingDone(year);
      onNext();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Henter bokklubbøkene dine...</p>;
  }

  if (!list || list.books.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          Ranger årets bokklubbøker
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
          Vi fant ingen bokklubbøker registrert for {year} ennå. Hopp videre for nå.
        </p>
        <div className="flex justify-between items-center pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button onClick={onBack} className="btn-secondary text-sm">← Tilbake</button>
          <button onClick={handleNext} disabled={saving} className="btn-primary text-sm">
            Neste: Book Awards →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        Ranger årets bokklubbøker
      </h3>
      <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
        Forhåndssortert etter dine egne stjerner. Dra i ≡ for å endre rekkefølgen om du er uenig
        med deg selv, eller har ombestemt deg siden du anmeldte.
      </p>

      <BookRankingList
        listId={list._id}
        books={list.books}
        canEdit={true}
        onBooksChange={(books) => setList((prev) => ({ ...prev, books }))}
      />

      <div
        className="flex justify-between items-center pt-4 mt-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <button onClick={onBack} className="btn-secondary text-sm">← Tilbake</button>
        <button onClick={handleNext} disabled={saving} className="btn-primary text-sm">
          Neste: Book Awards →
        </button>
      </div>
    </div>
  );
};

export default RankBookclubStep;
