import { createContext, useContext, useEffect, useState } from "react";
import settingsApi from "../api/settingsApi";

const SeasonalThemeContext = createContext();

export const useSeasonalTheme = () => {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    throw new Error("useSeasonalTheme must be used within a SeasonalThemeProvider");
  }
  return context;
};

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
    if (season) {
      document.documentElement.dataset.season = season;
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
    <SeasonalThemeContext.Provider value={{ season, applySeason }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
};

export default SeasonalThemeContext;
