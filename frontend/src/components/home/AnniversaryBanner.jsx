import { useSeasonalTheme } from "../../contexts/SeasonalThemeContext";

// December 9th only (see SeasonalThemeContext's isAnniversary) - not a
// link anywhere, just a one-day celebration. Uses the same *-solid/
// gradient tokens as WrappedBanner/AdventCalendarBanner, which on this
// date are already the Jul palette (the context forces data-season="jul"
// on the 9th regardless of what's actually configured), so this needs no
// season-specific styling of its own.
const AnniversaryBanner = () => {
  const { isAnniversary, anniversaryYear } = useSeasonalTheme();

  if (!isAnniversary) return null;

  return (
    <div
      className="rounded-2xl p-4 mb-6 animate-fadeIn"
      style={{
        background: "linear-gradient(120deg, var(--color-primary-solid), var(--color-secondary-solid) 150%)",
        color: "#fff6ec",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-0.5">
        Bokklubbens bursdag
      </p>
      <h3 className="font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
        Between the Covers fyller {anniversaryYear} år i dag!
      </h3>
    </div>
  );
};

export default AnniversaryBanner;
