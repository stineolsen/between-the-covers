import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// This is a classic <BrowserRouter> SPA with no native per-route scroll
// handling, so without this every navigation keeps the previous page's
// scroll offset - e.g. landing near the bottom of a short page after
// leaving a long, scrolled-down one. Reset to top on fresh navigations
// (PUSH/REPLACE); skip POP (back/forward) so a page that restores its own
// remembered scroll position (like Books.jsx) isn't fought over.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
