import { useState } from "react";
import wrappedApi from "../../../api/wrappedApi";
import { useToast } from "../../../contexts/useToast";
import WrappedMiniCard from "../WrappedMiniCard";
import { Headline, Kicker, Rise, THEMES } from "./slideParts";

const theme = THEMES.wine;

// Same shape the backend freezes in WrappedShare.snapshot (shareSnapshot in
// wrappedController.js) - only used to preview the card here; the real one
// is computed server-side on share. Keep the two in step.
const favoriteBooks = (books) => {
  const rated = books.filter((b) => b.rating != null).sort((a, b) => b.rating - a.rating);
  const unrated = books.filter((b) => b.rating == null);
  return [...rated, ...unrated]
    .slice(0, 3)
    .map((b) => ({ bookId: b._id, title: b.title, coverImage: b.coverImage, rating: b.rating ?? null }));
};

export const previewSnapshot = (p) => ({
  count: p.count,
  pages: p.pages,
  avgRating: p.avgRating,
  topGenre: p.topGenres?.[0]?.name || null,
  personalities: (p.personalities || []).map(({ key, label, emoji }) => ({ key, label, emoji })),
  favorites: favoriteBooks(p.books),
  bestPercentile: p.bestPercentile?.topPercent
    ? { topPercent: p.bestPercentile.topPercent, label: p.bestPercentile.label }
    : null,
  readingGoal: p.readingGoal ? { goal: p.readingGoal, count: p.count } : null,
  bookclub:
    p.bookclub?.total > 0
      ? {
          read: p.bookclub.read,
          total: p.bookclub.total,
          meetingsAttended: p.meetings?.attended || 0,
          meetingsTotal: p.meetings?.total || 0,
        }
      : null,
});

// Last slide: opt in to showing a mini version of your Bokwrapped on your
// profile and in the homepage row, so the others in the club can see it.
const ShareWithClubSlide = ({ year, personal, initiallyShared, preview = false, onSharedChange, restart, close }) => {
  const toast = useToast();
  const [shared, setShared] = useState(initiallyShared);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (shared) {
        await wrappedApi.unshareResults(year);
        setShared(false);
        onSharedChange?.(false);
        toast.success("Fjernet fra profilen og forsiden");
      } else {
        await wrappedApi.shareResults(year);
        setShared(true);
        onSharedChange?.(true);
        toast.success("Delt med bokklubben! 🎉");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Noe gikk galt - prøv igjen");
    } finally {
      setBusy(false);
    }
  };

  // Scrolls instead of clipping on short phone screens - the card is the
  // tallest thing in the story
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      <div className="my-auto py-2">
      <Kicker theme={theme}>Del med bokklubben</Kicker>
      <Headline>Vis frem leseåret ditt</Headline>
      <Rise delay={0.3} as="p" className="mt-2 text-sm">
        <span style={{ color: theme.muted }}>
          Dette kortet vises på profilen din og på forsiden, så de andre i klubben kan se det.
        </span>
      </Rise>
      {preview && (
        <Rise delay={0.4} as="p" className="mt-2 text-xs font-semibold rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.12)" }}>
          👀 Forhåndsvisning: før Bokwrapped slippes er det bare admin som ser delte kort.
        </Rise>
      )}

      <Rise delay={0.5} className="mt-4">
        <WrappedMiniCard
          share={{ user: personal.user, year, snapshot: previewSnapshot(personal), released: !preview }}
          showUser
          linkUser={false}
          className="!shadow-xl ring-1 ring-white/20"
        />
      </Rise>

      <Rise delay={0.8} className="flex flex-col gap-2 mt-5">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={shared}
          className="px-6 py-3 rounded-full font-bold disabled:opacity-60"
          style={
            shared
              ? { border: `2px solid ${theme.fg}`, color: theme.fg }
              : { background: theme.accent, color: "#2a1a10" }
          }
        >
          {busy ? "Et øyeblikk…" : shared ? "✓ Delt · trykk for å fjerne" : "📣 Del med bokklubben"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={restart}
            className="px-4 py-2.5 rounded-full font-bold text-sm"
            style={{ background: theme.fg, color: theme.solid }}
          >
            ↺ Se igjen
          </button>
          <button
            type="button"
            onClick={close}
            className="px-4 py-2.5 rounded-full font-bold text-sm border-2"
            style={{ borderColor: theme.fg, color: theme.fg }}
          >
            Til forsiden
          </button>
        </div>
      </Rise>
      </div>
    </div>
  );
};

export default ShareWithClubSlide;
