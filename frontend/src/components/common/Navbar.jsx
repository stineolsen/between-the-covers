import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav
      className="sticky top-0 z-50 shadow-md"
      style={{ background: "var(--color-primary)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 transform transition-transform hover:scale-105"
            onClick={closeMobileMenu}
          >
            <img
              src="/logo_croppped.png"
              alt="Between The Covers"
              className="h-12 w-12 drop-shadow-lg"
            />
            <span className="text-xl font-bold text-white drop-shadow-lg hidden sm:block">
              Between The Covers
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Hjem
                </Link>
                <Link
                  to="/books"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Bøker
                </Link>
                <Link
                  to="/lists"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Lister
                </Link>
                <Link
                  to="/meetings"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Møter
                </Link>
                <Link
                  to="/history"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Din lesehistorikk
                </Link>
                <Link
                  to="/shop"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Butikk
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-yellow-300 hover:text-yellow-200 font-bold transition-all transform hover:scale-110"
                  >
                    ⭐ Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  👤 {user?.displayName || user?.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-accent text-sm py-2 px-4"
                >
                  Logg ut
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-white/80 font-medium transition-all"
                >
                  Logg inn
                </Link>
                <Link to="/register" className="btn-accent text-sm py-2 px-4">
                  Registrer
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white text-3xl font-bold focus:outline-none"
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 animate-fadeIn">
            {isAuthenticated ? (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  🏠 Hjem
                </Link>
                <Link
                  to="/books"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  📚 Bøker
                </Link>
                <Link
                  to="/lists"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  📋 Lister
                </Link>
                <Link
                  to="/meetings"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  🗓️ Møter
                </Link>
                <Link
                  to="/history"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  📊 Historikk
                </Link>
                <Link
                  to="/shop"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  🛍️ Butikk
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className="text-yellow-300 hover:text-yellow-200 font-bold py-2 px-4 rounded-xl transition-all"
                    style={{ background: "rgba(255, 255, 255, 0.1)" }}
                  >
                    ⭐ Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  👤 {user?.displayName || user?.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all text-left"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  🚪 Logg ut
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  Logg inn
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-white/80 font-medium py-2 px-4 rounded-xl transition-all"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                >
                  Registrer
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
