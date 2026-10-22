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

// Paired with self.skipWaiting()/self.clients.claim() in sw.js: once a new
// service worker takes over, reload once so the page actually runs the new
// JS it just started being served, instead of silently keeping the old
// bundle running in memory until the user manually refreshes.
if ("serviceWorker" in navigator) {
  let reloadedForNewSW = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadedForNewSW) return;
    reloadedForNewSW = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
