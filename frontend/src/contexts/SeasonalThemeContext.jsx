import { createContext, useContext, useEffect, useState } from "react";
import settingsApi from "../api/settingsApi";
import { osloToday } from "../utils/adventClock";

const SeasonalThemeContext = createContext();

export const useSeasonalTheme = () => {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    throw new Error("useSeasonalTheme must be used within a SeasonalThemeProvider");
  }
  return context;
};

// The club's founding date - December 9th is an automatic, date-driven
// anniversary (unlike the admin-picked seasons below), always showing the
// Jul palette that day regardless of whatever season is actually selected,
// plus a banner on Home (see AnniversaryBanner.jsx). Bump this only if the
// founding year itself was ever wrong - it shouldn't need yearly upkeep.
const FOUNDING_YEAR = 2024;
const today = osloToday();
const isAnniversary = today.month === 12 && today.day === 9;
const anniversaryYear = today.year - FOUNDING_YEAR;

// Site-wide seasonal "skin" (Halloween/Jul/Nyttår, or none) - a separate
// concern from ThemeContext's light/dark mode. Admin-controlled, visible to
// everyone immediately once set (unlike the Bokwrapped/Julekalender
// visibility toggles, which hide a whole feature until launch). Mirrors
// ThemeContext's data-attribute pattern: stamp data-season on <html> and let
// index.css's :root[data-season="..."] blocks do the retinting.
export const SeasonalThemeProvider = ({ children }) => {
  const [season, setSeasonState] = useState(null);

  useEffect(() => {
    settingsApi
      .getSeasonalTheme()
      .then((data) => setSeasonState(data.theme))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // December 9th always shows the Jul palette, overriding whatever's
    // actually configured - it's a fixed calendar date, not something that
    // should depend on an admin remembering to coordinate their seasonal
    // picks around it.
    const effective = isAnniversary ? "jul" : season;
    if (effective) {
      document.documentElement.dataset.season = effective;
    } else {
      delete document.documentElement.dataset.season;
    }
  }, [season]);

  // Local-only setter for instant admin feedback; the admin page itself is
  // responsible for calling settingsApi.setSeasonalTheme and only invoking
  // this once that's confirmed, so the applied skin never drifts from what's
  // actually saved.
  const applySeason = (next) => setSeasonState(next);

  return (
    <SeasonalThemeContext.Provider value={{ season, applySeason, isAnniversary, anniversaryYear }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
};

export default SeasonalThemeContext;
