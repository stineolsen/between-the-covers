import { useEffect, useId, useMemo, useRef, useState } from "react";
import { booksApi } from "../../api/booksApi";
import { canonicalGenre, suggestGenres } from "../../utils/genres";

// Search-as-you-type genre picker: suggests the library's existing genres
// (and finds them through synonyms - "krim" -> Crime), so books end up on
// genres we already use. A genre that doesn't exist yet can still be added,
// but only through an explicit "Legg til ny sjanger" option.
//
// value: string[]   onChange(next: string[])
// existingGenres: optional string[] - fetched here when not given
const GenrePicker = ({ value = [], onChange, existingGenres }) => {
  const [fetched, setFetched] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (existingGenres) return;
    booksApi
      .getGenres()
      .then((data) => setFetched((data.genres || []).map((g) => g.name)))
      .catch(() => {});
  }, [existingGenres]);

  const existing = existingGenres || fetched;
  const typed = query.trim();
  const suggestions = useMemo(() => suggestGenres(typed, existing, value).slice(0, 8), [typed, existing, value]);

  // Offer "add new" only when the typed text isn't (a synonym of) a genre we have
  const canonical = typed ? canonicalGenre(typed, existing) : "";
  const isNew = typed && !existing.includes(canonical) && !value.includes(canonical);
  const options = [...suggestions.map((g) => ({ genre: g })), ...(isNew ? [{ genre: typed, isNew: true }] : [])];

  const add = (genre) => {
    if (genre && !value.includes(genre)) onChange([...value, genre]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };

  const remove = (genre) => onChange(value.filter((g) => g !== genre));

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // Never submit the surrounding form from here
      e.preventDefault();
      if (open && options[active]) add(options[active].genre);
      else if (typed) add(canonical);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((g) => (
            <span
              key={g}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
              style={{ background: "var(--color-wine-tint)", color: "var(--color-primary)", border: "1.5px solid var(--color-primary)" }}
            >
              {g}
              <button type="button" onClick={() => remove(g)} className="font-bold hover:opacity-70" aria-label={`Fjern ${g}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="input-field w-full"
          placeholder="Søk etter sjanger …"
          autoComplete="off"
        />

        {open && options.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl p-1"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 10px 28px -12px rgba(0,0,0,0.35)" }}
          >
            {options.map((o, i) => (
              <li
                key={(o.isNew ? "new:" : "") + o.genre}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown so the input's blur doesn't close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(o.genre);
                }}
                onMouseEnter={() => setActive(i)}
                className="px-3 py-2 rounded-lg text-sm cursor-pointer"
                style={{
                  background: i === active ? "var(--color-sunken)" : "transparent",
                  color: o.isNew ? "var(--color-text-muted)" : "var(--color-text)",
                  borderTop: o.isNew && i > 0 ? "1px solid var(--color-border)" : undefined,
                }}
              >
                {o.isNew ? (
                  <>
                    + Legg til ny sjanger «<b>{o.genre}</b>»
                  </>
                ) : (
                  o.genre
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GenrePicker;
