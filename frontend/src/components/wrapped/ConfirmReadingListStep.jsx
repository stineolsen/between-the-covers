import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../contexts/useToast";
import { booksApi } from "../../api/booksApi";
import { userBooksApi } from "../../api/userBooksApi";
import wrappedApi from "../../api/wrappedApi";
import BookCoverFallback from "../common/BookCoverFallback";
import DateEditor from "../common/DateEditor";
import MonthChart, { MONTHS } from "./MonthChart";
import StarRating from "../reviews/StarRating";

// This many books on one finish date usually means they were registered in
// one go (an import, or catching up), not actually finished that day
const SAME_DAY_WARNING = 4;
// A month this far above the reader's typical month gets flagged
const SPIKE_FACTOR = 2.5;
const SPIKE_MIN_BOOKS = 6;

const OTHER_DATE = "other";
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const capitalize = (s) => s[0].toUpperCase() + s.slice(1);

const ConfirmReadingListStep = ({ year, onNext }) => {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingDateId, setSavingDateId] = useState(null);
  // Narrow the list to one month (from the chart) or one finish date (from a warning)
  const [filter, setFilter] = useState(null); // { month } | { day } | { missing: true } | { unrated: true }

  const [showAddField, setShowAddField] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    wrappedApi
      .getOverview(year)
      .then((data) => setRows(data.books || []))
      .catch(() => toast.error("Klarte ikke hente leselisten"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    if (!showAddField) return;
    const timeout = setTimeout(() => {
      setSearching(true);
      booksApi
        .getBooks({ search: search || undefined, sort: "title" })
        .then((data) => setSearchResults((data.books || []).slice(0, 8)))
        .catch(() => toast.error("Klarte ikke søke etter bøker"))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showAddField]);

  const inYear = (row) => row.finishedAt && new Date(row.finishedAt).getFullYear() === year;
  const counted = useMemo(() => rows.filter((r) => r.checked && inYear(r)), [rows, year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Books per month among the ones that will count - updates live as dates change
  const months = useMemo(() => {
    const m = Array.from({ length: 12 }, () => ({ books: 0, pages: 0 }));
    for (const r of counted) m[new Date(r.finishedAt).getMonth()].books += 1;
    return m;
  }, [counted]);

  // Things that usually make a wrapped wrong
  const warnings = useMemo(() => {
    const list = [];
    const missing = rows.filter((r) => r.checked && !r.finishedAt).length;
    if (missing) {
      list.push({
        key: "missing",
        text: `${missing} ${missing === 1 ? "bok mangler" : "bøker mangler"} fullført-dato og havner ikke riktig i månedsoversikten.`,
        filter: { missing: true },
      });
    }

    const unrated = counted.filter((r) => r.rating === null || r.rating === undefined).length;
    if (unrated) {
      list.push({
        key: "unrated",
        text: `${unrated} ${unrated === 1 ? "bok mangler" : "bøker mangler"} stjerner. Vurderingene brukes i snittet ditt, «høyest vurdert», din mest kontroversielle mening og flere personligheter.`,
        filter: { unrated: true },
      });
    }

    const byDay = new Map();
    for (const r of counted) byDay.set(dayKey(r.finishedAt), (byDay.get(dayKey(r.finishedAt)) || 0) + 1);
    for (const [day, n] of byDay) {
      if (n < SAME_DAY_WARNING) continue;
      list.push({
        key: `day-${day}`,
        text: `${n} bøker er registrert som lest samme dag (${new Date(day).toLocaleDateString("nb-NO")}). Ble de lagt inn på én gang? Sjekk at måneden stemmer.`,
        filter: { day },
      });
    }

    const active = months.map((m) => m.books).filter((n) => n > 0).sort((a, b) => a - b);
    const typical = active.length ? active[Math.floor(active.length / 2)] : 0;
    months.forEach((m, i) => {
      if (active.length >= 3 && m.books >= SPIKE_MIN_BOOKS && m.books >= typical * SPIKE_FACTOR) {
        list.push({
          key: `spike-${i}`,
          text: `${capitalize(MONTHS[i])} har ${m.books} bøker - mye mer enn en vanlig måned for deg (${typical}). Stemmer det?`,
          filter: { month: i },
        });
      }
    });
    return list;
  }, [rows, counted, months]);

  const visibleRows = useMemo(() => {
    if (!filter) return rows;
    if (filter.missing) return rows.filter((r) => !r.finishedAt);
    if (filter.unrated) return rows.filter((r) => r.checked && inYear(r) && (r.rating === null || r.rating === undefined));
    if (filter.day) return rows.filter((r) => r.finishedAt && dayKey(r.finishedAt) === filter.day);
    return rows.filter((r) => inYear(r) && new Date(r.finishedAt).getMonth() === filter.month);
  }, [rows, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Grouped by month, newest first; missing dates and other years on top
  const groups = useMemo(() => {
    const map = new Map();
    for (const r of visibleRows) {
      const key = !r.finishedAt ? "missing" : inYear(r) ? new Date(r.finishedAt).getMonth() : "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    const order = ["missing", "other", ...Array.from({ length: 12 }, (_, i) => 11 - i)];
    return order.filter((k) => map.has(k)).map((k) => ({ key: k, rows: map.get(k) }));
  }, [visibleRows]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleChecked = (userBookId) => {
    setRows((prev) => prev.map((r) => (r.userBookId === userBookId ? { ...r, checked: !r.checked } : r)));
  };

  const handleDateSave = async (userBookId, iso) => {
    setSavingDateId(userBookId);
    try {
      await userBooksApi.updateFinishedDate(userBookId, iso);
      const movedOut = new Date(iso).getFullYear() !== year;
      setRows((prev) =>
        prev.map((r) =>
          r.userBookId === userBookId
            ? // Moved to another year: it no longer belongs in this wrapped
              { ...r, finishedAt: iso, flagged: false, dateEdited: true, checked: movedOut ? false : r.checked }
            : r,
        ),
      );
      setEditingId(null);
      if (movedOut) toast.info(`Flyttet til ${new Date(iso).getFullYear()} - teller ikke med i ${year}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre datoen");
    } finally {
      setSavingDateId(null);
    }
  };

  // Stars are saved straight away (a star-only review, kept out of the feed)
  const handleRating = async (row, rating) => {
    const previous = row.rating;
    setRows((prev) => prev.map((r) => (r.userBookId === row.userBookId ? { ...r, rating } : r)));
    try {
      await wrappedApi.setQuickRating(year, row.book._id, rating);
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.userBookId === row.userBookId ? { ...r, rating: previous } : r)));
      toast.error(err.response?.data?.message || "Klarte ikke lagre vurderingen");
    }
  };

  // Month picker: keep the day of month where possible (clamped to the
  // month's length, and never in the future); 15th if there was no date
  const handleMonthChange = (row, value) => {
    if (value === OTHER_DATE) {
      setEditingId(row.userBookId);
      return;
    }
    const month = Number(value);
    const oldDay = row.finishedAt ? new Date(row.finishedAt).getDate() : 15;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let date = new Date(year, month, Math.min(oldDay, daysInMonth));
    const today = new Date();
    if (date > today) date = today;
    handleDateSave(row.userBookId, `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
  };

  const handleAddBook = async (book) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { userBook } = await userBooksApi.setBookStatus(book._id, "read");
      await userBooksApi.updateFinishedDate(userBook._id, today);
      setRows((prev) => [
        {
          userBookId: userBook._id,
          book,
          finishedAt: today,
          flagged: false,
          checked: true,
        },
        ...prev,
      ]);
      setShowAddField(false);
      setSearch("");
      setSearchResults([]);
      toast.success(`${book.title} lagt til som lest i ${year} - husk å velge riktig måned`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke legge til boken");
    }
  };

  // Unticked books whose date wasn't corrected get parked on 01.01.2024 when
  // the step is confirmed (not on draft save, so they can still be re-ticked).
  const persist = async ({ parkUnticked = false } = {}) => {
    const unticked = rows.filter((r) => !r.checked);
    const excludedBookIds = unticked.map((r) => r.book?._id);
    const parkUserBookIds = parkUnticked ? unticked.filter((r) => !r.dateEdited).map((r) => r.userBookId) : [];
    await wrappedApi.confirmBooks(year, excludedBookIds, parkUserBookIds);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await persist();
      toast.success("Kladd lagret ✓");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre kladden");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await persist({ parkUnticked: true });
      onNext();
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre leselisten");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Henter leselisten din...</p>;
  }

  // The latest month that can be picked this year (no future dates)
  const now = new Date();
  const lastPickableMonth = year < now.getFullYear() ? 11 : now.getMonth();

  const groupLabel = (key) =>
    key === "missing" ? "Mangler dato" : key === "other" ? "Flyttet til et annet år" : `${capitalize(MONTHS[key])} ${year}`;

  const filterLabel = !filter
    ? null
    : filter.missing
      ? "bøker uten dato"
      : filter.unrated
        ? "bøker uten stjerner"
        : filter.day
        ? `lest ${new Date(filter.day).toLocaleDateString("nb-NO")}`
        : capitalize(MONTHS[filter.month]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        Stemmer dette?
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
        Vi har markert disse bøkene som lest i {year} basert på datoene dine. Fjern de som egentlig hører til et annet
        år, og sjekk at månedene stemmer - Bokwrapped viser leseåret ditt måned for måned. Du kan også legge til bøker du
        har glemt å markere.
      </p>

      {/* Month overview */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--color-sunken)" }}>
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <p className="text-sm font-bold">Slik fordeler {counted.length} bøker seg</p>
          <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            Trykk på en måned for å se bøkene
          </p>
        </div>
        <MonthChart
          months={months}
          bestMonthIndex={null}
          height={110}
          onSelectMonth={(month) => setFilter(month === null ? null : { month })}
          selectedMonth={filter && "month" in filter ? filter.month : null}
        />
        <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
          Ser fordelingen rar ut, for eksempel mange bøker i én måned du vet du leste lite? Da er datoene trolig feil, og
          månedsgrafen, toppmåneden og «Den stødige»/«Maratonleseren» i Bokwrapped blir feil også.
        </p>
      </div>

      {/* Checklist */}
      {warnings.length > 0 && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "var(--color-gold-tint)", border: "1px solid var(--color-border)" }}
          role="status"
        >
          <p className="text-sm font-bold mb-2">⚠ Verdt å sjekke</p>
          <ul className="flex flex-col gap-2">
            {warnings.map((w) => (
              <li key={w.key} className="text-sm flex items-start justify-between gap-3">
                <span>{w.text}</span>
                <button
                  onClick={() => setFilter(w.filter)}
                  className="text-xs font-bold whitespace-nowrap"
                  style={{ color: "var(--color-primary)" }}
                >
                  Vis →
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filter && (
        <div className="flex items-center justify-between text-sm mb-2">
          <span>
            Viser <b>{filterLabel}</b> ({visibleRows.length})
          </span>
          <button onClick={() => setFilter(null)} className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
            Vis alle ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-4">
        {rows.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>
            Ingen bøker markert som lest ennå.
          </p>
        )}
        {groups.map((group) => (
          <section key={group.key}>
            <h4
              className="text-xs font-bold uppercase tracking-wide mb-1.5 flex justify-between"
              style={{ color: group.key === "missing" ? "var(--color-terracotta)" : "var(--color-text-faint)" }}
            >
              <span>{groupLabel(group.key)}</span>
              <span>{group.rows.length}</span>
            </h4>
            <div className="flex flex-col gap-2">
              {group.rows.map((row) => {
                const book = row.book;
                if (!book) return null;
                const coverUrl = book.coverImage ? booksApi.getCoverUrl(book.coverImage) : null;
                const monthValue = inYear(row) ? String(new Date(row.finishedAt).getMonth()) : "";

                return (
                  <div
                    key={row.userBookId}
                    className="grid gap-3 p-2.5 rounded-xl items-center"
                    style={{
                      gridTemplateColumns: "34px 1fr auto",
                      border: `1px solid ${row.flagged ? "var(--color-terracotta)" : "var(--color-border)"}`,
                      background: row.flagged ? "var(--color-terracotta-tint)" : "var(--color-card)",
                      opacity: row.checked ? 1 : 0.55,
                    }}
                  >
                    <div className="w-[34px] aspect-[2/3] rounded overflow-hidden flex-shrink-0">
                      <BookCoverFallback src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <b className="block text-sm truncate">{book.title}</b>
                      {editingId === row.userBookId ? (
                        <DateEditor
                          initialDate={row.finishedAt}
                          onSave={(iso) => handleDateSave(row.userBookId, iso)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
                          <span className="truncate max-w-[45%]">{book.author}</span>
                          <span aria-hidden="true">·</span>
                          <label className="sr-only" htmlFor={`month-${row.userBookId}`}>
                            Måned lest for {book.title}
                          </label>
                          <select
                            id={`month-${row.userBookId}`}
                            value={monthValue}
                            disabled={savingDateId === row.userBookId}
                            onChange={(e) => handleMonthChange(row, e.target.value)}
                            className="rounded-md px-1.5 py-0.5 text-xs font-semibold"
                            style={{
                              background: "var(--color-sunken)",
                              border: `1px solid ${row.finishedAt ? "var(--color-border)" : "var(--color-terracotta)"}`,
                              color: "var(--color-text)",
                            }}
                          >
                            {!monthValue && (
                              <option value="" disabled>
                                {row.finishedAt ? `Lest ${new Date(row.finishedAt).toLocaleDateString("nb-NO")}` : "Velg måned"}
                              </option>
                            )}
                            {MONTHS.map((name, i) => (
                              <option key={name} value={i} disabled={i > lastPickableMonth}>
                                {capitalize(name)}
                              </option>
                            ))}
                            <option value={OTHER_DATE}>Annen dato / annet år…</option>
                          </select>
                          {row.finishedAt && inYear(row) && (
                            <span style={{ color: "var(--color-text-faint)" }}>
                              {new Date(row.finishedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                            </span>
                          )}
                          {savingDateId === row.userBookId && <span>Lagrer…</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={row.rating || 0} onRatingChange={(value) => handleRating(row, value)} size="sm" />
                        {(row.rating === null || row.rating === undefined) && (
                          <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-faint)" }}>
                            Gi stjerner
                          </span>
                        )}
                      </div>
                      {row.flagged && (
                        <div className="text-xs font-bold mt-0.5" style={{ color: "var(--color-terracotta)" }}>
                          ⚠ Sjekk om denne faktisk ble lest i {year}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleChecked(row.userBookId)}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        border: `2px solid ${row.checked ? "var(--color-primary)" : "var(--color-border-strong)"}`,
                        background: row.checked ? "var(--color-primary-solid)" : "none",
                        color: "#fff",
                      }}
                      title={row.checked ? "Teller med i wrapped" : "Teller ikke med"}
                      aria-label={`${row.checked ? "Fjern" : "Ta med"} ${book.title}`}
                      aria-pressed={row.checked}
                    >
                      {row.checked ? "✓" : ""}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {!showAddField ? (
        <button
          onClick={() => setShowAddField(true)}
          className="w-full text-left p-2.5 rounded-xl text-sm font-bold mb-5"
          style={{
            border: "1.5px dashed var(--color-border-strong)",
            color: "var(--color-primary)",
          }}
        >
          ＋ Legg til en bok du glemte å markere som lest
        </button>
      ) : (
        <div className="mb-5">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter tittel eller forfatter..."
            className="input-field mb-2"
          />
          {searching && (
            <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
              Søker...
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            {searchResults.map((book) => (
              <button
                key={book._id}
                onClick={() => handleAddBook(book)}
                className="flex items-center gap-2.5 p-2 rounded-lg text-left text-sm"
                style={{ background: "var(--color-sunken)" }}
              >
                <b className="truncate">{book.title}</b>
                <span style={{ color: "var(--color-text-muted)" }}>{book.author}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowAddField(false);
              setSearch("");
              setSearchResults([]);
            }}
            className="text-xs font-bold mt-2"
            style={{ color: "var(--color-text-faint)" }}
          >
            Avbryt
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button onClick={handleSaveDraft} disabled={saving} className="text-sm font-bold" style={{ color: "var(--color-text-faint)" }}>
          Lagre kladd
        </button>
        <button onClick={handleNext} disabled={saving} className="btn-primary text-sm">
          Neste: ranger bokklubbøker →
        </button>
      </div>
    </div>
  );
};

export default ConfirmReadingListStep;
