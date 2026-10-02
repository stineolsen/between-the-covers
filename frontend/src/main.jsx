import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// We restore scroll position ourselves (see Books.jsx/ScrollToTop.jsx) -
// disable the browser's own automatic scroll restoration so it can't fight
// our timing (e.g. restoring, then getting clamped to 0 while a page is
// still showing its brief loading state and is too short to scroll).
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
