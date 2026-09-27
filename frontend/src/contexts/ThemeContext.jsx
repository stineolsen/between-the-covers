import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const STORAGE_KEY = "btc-theme";
const systemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const ThemeProvider = ({ children }) => {
  const [explicitTheme, setExplicitTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  );
  const [theme, setTheme] = useState(
    () => explicitTheme || (systemPrefersDark() ? "dark" : "light"),
  );

  // Apply to the document: an explicit choice stamps data-theme so it wins
  // over the OS setting; otherwise leave it unset and let the CSS media
  // query follow the OS setting directly.
  useEffect(() => {
    if (explicitTheme) {
      document.documentElement.dataset.theme = explicitTheme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [explicitTheme]);

  // While no explicit choice has been made, keep the reported theme in sync
  // with OS changes (so the toggle icon reflects the actual rendered theme).
  useEffect(() => {
    if (explicitTheme) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme(mq.matches ? "dark" : "light");
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [explicitTheme]);

  const chooseTheme = (next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setExplicitTheme(next);
    setTheme(next);
  };

  const toggleTheme = () => chooseTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme: chooseTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
