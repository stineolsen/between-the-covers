import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import UserAvatar from "./UserAvatar";

const icons = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H9v-6.5h6V20h2.5a1 1 0 0 0 1-1v-9" />
  ),
  book: (
    <>
      <path d="M3 5.2c2.2-1 5-1 7 0v14c-2-1-4.8-1-7 0v-14Z" />
      <path d="M21 5.2c-2.2-1-5-1-7 0v14c2-1 4.8-1 7 0v-14Z" />
    </>
  ),
  list: (
    <>
      <line x1="8.5" y1="6" x2="21" y2="6" />
      <line x1="8.5" y1="12" x2="21" y2="12" />
      <line x1="8.5" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.2" />
      <line x1="12" y1="19.8" x2="12" y2="22" />
      <line x1="4.2" y1="4.2" x2="5.7" y2="5.7" />
      <line x1="18.3" y1="18.3" x2="19.8" y2="19.8" />
      <line x1="2" y1="12" x2="4.2" y2="12" />
      <line x1="19.8" y1="12" x2="22" y2="12" />
      <line x1="4.2" y1="19.8" x2="5.7" y2="18.3" />
      <line x1="18.3" y1="5.7" x2="19.8" y2="4.2" />
    </>
  ),
  moon: <path d="M21 13.2A9 9 0 1 1 10.8 3 7 7 0 0 0 21 13.2Z" />,
};

const Icon = ({ name, className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {icons[name]}
  </svg>
);

const PRIMARY_LINKS = [
  { to: "/", label: "Forside", icon: "home" },
  { to: "/books", label: "Bøker", icon: "book" },
  { to: "/lists", label: "Lister", icon: "list" },
  { to: "/history", label: "Historikk", icon: "history" },
];

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const isCurrent = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <>
      <nav
        className="sticky top-0 z-50 shadow-md"
        style={{ background: "var(--color-nav-bg)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <span
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <img
                  src="/logo_cropped.png"
                  alt=""
                  className="h-12 w-12 object-contain"
                />
              </span>
              <span
                className="text-xs sm:text-lg font-semibold"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontStyle: "italic",
                  color: "var(--color-nav-text)",
                }}
              >
                Between The Covers
              </span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Desktop primary nav */}
                <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
                  {PRIMARY_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="font-medium text-sm pb-1 border-b-2 transition-colors"
                      style={{
                        color: isCurrent(link.to)
                          ? "var(--color-nav-text)"
                          : "var(--color-nav-text-muted)",
                        borderColor: isCurrent(link.to)
                          ? "var(--color-secondary)"
                          : "transparent",
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      color: "var(--color-nav-text)",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                    title="Bytt lys/mørk modus"
                    aria-label="Bytt lys/mørk modus"
                  >
                    <Icon name={theme === "dark" ? "sun" : "moon"} className="w-4 h-4" />
                  </button>

                  {/* Secondary-pages menu (Møter/Butikk/Admin/Logg ut) */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
                      style={{
                        color: "var(--color-nav-text)",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                      aria-label="Mer"
                      aria-expanded={menuOpen}
                    >
                      {menuOpen ? "×" : "☰"}
                    </button>

                    {menuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(false)}
                        />
                        <div
                          className="absolute right-0 mt-2 w-52 rounded-xl p-1.5 z-20"
                          style={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 10px 28px -12px rgba(0,0,0,0.35)",
                          }}
                        >
                          <Link
                            to="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Forside
                          </Link>
                          <Link
                            to="/books"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Bøker
                          </Link>
                          <Link
                            to="/lists"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Lister
                          </Link>
                          <Link
                            to="/history"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Historikk
                          </Link>
                          <Link
                            to="/meetings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Møter
                          </Link>
                          <Link
                            to="/shop"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Butikk
                          </Link>
                          <Link
                            to="/members"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text)" }}
                          >
                            Medlemmer
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                              style={{ color: "var(--color-secondary)" }}
                            >
                              ⭐ Admin
                            </Link>
                          )}
                          <div
                            className="my-1 border-t"
                            style={{ borderColor: "var(--color-border)" }}
                          />
                          <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            🚪 Logg ut
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <Link to="/profile" title={user?.displayName || user?.username}>
                    <UserAvatar
                      user={user}
                      className="w-9 h-9 rounded-full text-sm"
                    />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="font-medium text-sm"
                  style={{ color: "var(--color-nav-text)" }}
                >
                  Logg inn
                </Link>
                <Link to="/register" className="btn-accent text-sm py-2 px-4">
                  Registrer
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom tab bar — primary pages, mobile only */}
      {isAuthenticated && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center pt-1.5 pb-2"
          style={{
            background: "var(--color-card)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center gap-0.5 px-2"
              style={{
                color: isCurrent(link.to)
                  ? "var(--color-primary)"
                  : "var(--color-text-faint)",
              }}
            >
              <Icon name={link.icon} className="w-5 h-5" />
              <span className="text-[0.65rem] font-semibold">{link.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navbar;
