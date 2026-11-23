import { useState } from "react";
import { userBooksApi } from "../../api/userBooksApi";
import { booksApi } from "../../api/booksApi";
import { useToast } from "../../contexts/useToast";
import { addDays, percentOf, planSchedule, planStatus, previewPlan, toDateInput } from "../../utils/readingPlan";

const fmtDay = (d) => new Date(d).toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" });
const fmtDate = (d) => new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
const pagesWord = (n) => `${n} ${n === 1 ? "side" : "sider"}`;

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-faint)" }}>
    {children}
  </label>
);

// Progress + reading plan for a book the member is currently reading.
// `userBook` is their UserBook (with book populated); onChange gets the
// saved version back. `heading` replaces the default "📖 Fremdrift" title
// (the reading plans page shows the book there instead).
const ReadingProgressCard = ({ userBook, book, onChange, heading }) => {
  const toast = useToast();
  const total = userBook.pageCount || book.pageCount || null;
  const currentPage = userBook.currentPage || 0;
  const plan = userBook.readingPlan;

  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("pages"); // pages | percent
  const [progressInput, setProgressInput] = useState("");
  const [editingPages, setEditingPages] = useState(!total);
  const [pagesInput, setPagesInput] = useState(total ? String(total) : "");
  const [google, setGoogle] = useState(null); // { pageCount, ... } suggestion
  const [googleBusy, setGoogleBusy] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [targetInput, setTargetInput] = useState(() => toDateInput(addDays(new Date(), 14)));
  const [showSchedule, setShowSchedule] = useState(false);

  const save = async (updates, successText) => {
    setBusy(true);
    try {
      const data = await userBooksApi.updateProgress(userBook._id, updates);
      onChange(data.userBook);
      if (successText) toast.success(successText);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke lagre");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveProgress = async (e) => {
    e.preventDefault();
    if (progressInput === "") return;
    const ok = await save(mode === "percent" ? { percent: Number(progressInput) } : { currentPage: Number(progressInput) }, "Fremdrift lagret 📖");
    if (ok) setProgressInput("");
  };

  const savePages = async (e) => {
    e?.preventDefault();
    const ok = await save({ pageCount: pagesInput === "" ? null : Number(pagesInput) }, "Sidetall lagret");
    if (ok) {
      setEditingPages(false);
      setGoogle(null);
    }
  };

  const fetchGoogle = async () => {
    setGoogleBusy(true);
    try {
      const data = await booksApi.getGoogleBooksInfo(book._id);
      if (data.info?.pageCount) setGoogle(data.info);
      else toast.error("Google Books har ikke sidetall for denne boken");
    } catch (err) {
      toast.error(err.response?.data?.message || "Klarte ikke hente fra Google Books");
    } finally {
      setGoogleBusy(false);
    }
  };

  const savePlan = async (e) => {
    e.preventDefault();
    const ok = await save({ plan: { targetDate: targetInput } }, "Leseplan lagret 🎯");
    if (ok) setPlanOpen(false);
  };

  const pct = percentOf(currentPage, total);
  const status = total && plan ? planStatus({ total, currentPage, plan }) : null;
  const preview = total && planOpen ? previewPlan({ total, currentPage, targetDate: new Date(`${targetInput}T12:00:00`) }) : null;
  const schedule = total && plan && showSchedule ? planSchedule({ total, currentPage, targetDate: plan.targetDate }) : [];

  return (
    <section className="card rounded-2xl p-5 mb-6 animate-fadeIn" aria-labelledby={`progress-heading-${userBook._id}`}>
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        {heading || (
          <h2 id={`progress-heading-${userBook._id}`} className="text-lg font-bold">
            📖 Fremdrift
          </h2>
        )}
        {userBook.progressUpdatedAt && (
          <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            Oppdatert {fmtDate(userBook.progressUpdatedAt)}
          </span>
        )}
      </div>

      {/* Edition page count */}
      {editingPages ? (
        <form onSubmit={savePages} className="mb-4 rounded-xl p-3" style={{ background: "var(--color-sunken)" }}>
          <Label htmlFor="edition-pages">Antall sider i din utgave</Label>
          <div className="flex gap-2 flex-wrap">
            <input
              id="edition-pages"
              type="number"
              min="1"
              inputMode="numeric"
              className="input-field py-2 w-32"
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              placeholder={book.pageCount ? String(book.pageCount) : "f.eks. 384"}
            />
            <button type="submit" disabled={busy || pagesInput === ""} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
              Lagre
            </button>
            {total && (
              <button type="button" onClick={() => setEditingPages(false)} className="text-sm font-bold px-2" style={{ color: "var(--color-text-muted)" }}>
                Avbryt
              </button>
            )}
            <button
              type="button"
              onClick={fetchGoogle}
              disabled={googleBusy}
              className="text-sm font-bold px-2 disabled:opacity-50"
              style={{ color: "var(--color-primary)" }}
            >
              {googleBusy ? "Henter…" : "🔎 Hent fra Google Books"}
            </button>
          </div>
          {google && (
            <p className="text-sm mt-2">
              Google Books: <b>{pagesWord(google.pageCount)}</b>
              {google.publishedYear ? ` (utgave fra ${google.publishedYear})` : ""}.{" "}
              <button type="button" className="font-bold underline underline-offset-2" style={{ color: "var(--color-primary)" }} onClick={() => setPagesInput(String(google.pageCount))}>
                Bruk dette
              </button>
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--color-text-faint)" }}>
            Gjelder bare deg – bokens sidetall i biblioteket endres ikke.
          </p>
        </form>
      ) : (
        <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
          Din utgave: <b style={{ color: "var(--color-text)" }}>{pagesWord(total)}</b>
          {userBook.pageCount && book.pageCount && userBook.pageCount !== book.pageCount ? ` (biblioteket sier ${book.pageCount})` : ""}{" "}
          <button type="button" onClick={() => { setPagesInput(String(total)); setEditingPages(true); }} className="font-bold" style={{ color: "var(--color-primary)" }}>
            Endre
          </button>
        </p>
      )}

      {total && (
        <>
          {/* Progress bar */}
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span>
              Side <b className="tabular-nums">{currentPage}</b> av <span className="tabular-nums">{total}</span>
            </span>
            <b className="tabular-nums" style={{ color: "var(--color-primary)" }}>
              {pct} %
            </b>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden mb-4"
            style={{ background: "var(--color-sunken)" }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Lest av boken"
          >
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--color-primary-solid)" }} />
          </div>

          {/* Update progress */}
          <form onSubmit={saveProgress} className="flex items-end gap-2 flex-wrap mb-5">
            <div>
              <Label htmlFor="progress-input">{mode === "pages" ? "Jeg er på side" : "Jeg har lest (%)"}</Label>
              <input
                id="progress-input"
                type="number"
                min="0"
                max={mode === "pages" ? total : 100}
                inputMode="numeric"
                className="input-field py-2 w-28"
                value={progressInput}
                onChange={(e) => setProgressInput(e.target.value)}
                placeholder={mode === "pages" ? String(currentPage) : String(pct)}
              />
            </div>
            <div className="flex rounded-full p-0.5 text-xs font-bold" style={{ background: "var(--color-sunken)" }} role="group" aria-label="Oppgi som">
              {[
                ["pages", "Sider"],
                ["percent", "%"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={mode === key}
                  onClick={() => { setMode(key); setProgressInput(""); }}
                  className="px-3 py-1.5 rounded-full"
                  style={mode === key ? { background: "var(--color-primary-solid)", color: "white" } : { color: "var(--color-text-muted)" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={busy || progressInput === ""} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
              Oppdater
            </button>
          </form>

          {/* Reading plan */}
          <div className="rounded-xl p-4" style={{ background: "var(--color-sunken)" }}>
            {status && !planOpen ? (
              <>
                <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
                  <h3 className="font-bold">🎯 Ferdig innen {fmtDate(plan.targetDate)}</h3>
                  <span className="text-xs font-bold" style={{ color: "var(--color-text-faint)" }}>
                    {status.overdue ? "Fristen er ute" : `${status.daysLeft} ${status.daysLeft === 1 ? "dag" : "dager"} igjen`}
                  </span>
                </div>
                {status.done ? (
                  <p className="text-sm font-bold" style={{ color: "var(--color-sage)" }}>
                    🎉 Du er ferdig med boken! Husk å markere den som lest.
                  </p>
                ) : (
                  <div className="grid gap-1 text-sm">
                    <p>
                      I dag: les til <b>side {status.todayGoalPage}</b> ({pagesWord(status.pagesPerDay)}
                      {status.overdue ? "" : " om dagen fremover"}).
                    </p>
                    {status.aheadBy !== 0 && !status.overdue && (
                      <p style={{ color: status.aheadBy > 0 ? "var(--color-sage)" : "var(--color-terracotta)" }} className="font-semibold">
                        {status.aheadBy > 0
                          ? `Du ligger ${pagesWord(status.aheadBy)} foran planen 💪`
                          : `Du ligger ${pagesWord(-status.aheadBy)} bak planen – det jevnes ut over dagene som er igjen.`}
                      </p>
                    )}
                    {status.overdue && (
                      <p className="font-semibold" style={{ color: "var(--color-terracotta)" }}>
                        Fristen har gått ut. Velg en ny dato for å regne ut planen på nytt.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-4 flex-wrap mt-3 text-xs font-bold">
                  {!status.done && !status.overdue && (
                    <button type="button" onClick={() => setShowSchedule((v) => !v)} style={{ color: "var(--color-primary)" }} aria-expanded={showSchedule}>
                      {showSchedule ? "Skjul dag for dag" : "Vis dag for dag"}
                    </button>
                  )}
                  <button type="button" onClick={() => { setTargetInput(toDateInput(plan.targetDate)); setPlanOpen(true); }} style={{ color: "var(--color-primary)" }}>
                    Endre dato
                  </button>
                  <button type="button" onClick={() => save({ plan: null }, "Leseplanen er fjernet")} disabled={busy} style={{ color: "var(--color-text-muted)" }}>
                    Fjern planen
                  </button>
                </div>
                {schedule.length > 0 && (
                  <ol className="mt-3 grid gap-1 text-sm max-h-64 overflow-y-auto pr-1">
                    {schedule.map((row, i) => (
                      <li key={row.date.toISOString()} className="flex justify-between gap-3 rounded-lg px-3 py-1.5" style={{ background: i === 0 ? "var(--color-wine-tint)" : "var(--color-card)" }}>
                        <span className="capitalize">{i === 0 ? "I dag" : fmtDay(row.date)}</span>
                        <span className="tabular-nums">
                          til side <b>{row.toPage}</b> <span style={{ color: "var(--color-text-faint)" }}>(+{row.pages})</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : planOpen ? (
              <form onSubmit={savePlan}>
                <h3 className="font-bold mb-2">🎯 Når vil du være ferdig?</h3>
                <div className="flex items-end gap-2 flex-wrap">
                  <div>
                    <Label htmlFor="plan-target">Ferdig innen</Label>
                    <input
                      id="plan-target"
                      type="date"
                      className="input-field py-2"
                      min={toDateInput(new Date())}
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" disabled={busy || !preview} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
                    Lagre plan
                  </button>
                  <button type="button" onClick={() => setPlanOpen(false)} className="text-sm font-bold px-2" style={{ color: "var(--color-text-muted)" }}>
                    Avbryt
                  </button>
                </div>
                {preview && (
                  <p className="text-sm mt-3">
                    {preview.remaining === 0
                      ? "Du er allerede ferdig med boken!"
                      : <>Det blir <b>{pagesWord(preview.pagesPerDay)} om dagen</b> i {preview.days} {preview.days === 1 ? "dag" : "dager"} ({pagesWord(preview.remaining)} igjen).</>}
                  </p>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Vil du bli ferdig til en bestemt dato? Lag en leseplan, så regner vi ut hvor mye du må lese hver dag.
                </p>
                <button type="button" onClick={() => setPlanOpen(true)} className="btn-secondary text-sm px-4 py-2">
                  🎯 Lag leseplan
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ReadingProgressCard;
