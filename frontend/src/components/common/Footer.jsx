import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="hidden lg:block mt-auto"
      style={{ background: "var(--color-nav-bg)" }}
    >
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* About Section */}
            <div>
              <h3
                className="font-semibold text-lg mb-3 flex items-center gap-2"
                style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", color: "var(--color-nav-text)" }}
              >
                Between The Covers
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-nav-text-muted)" }}>
                En bokklubb for en gjeng som deler en glede og kjærlighet for
                bøker. Vi diskuterer bøker vi elser, hater og alt mellom. Det
                finnes en bok for alle, og vi elsker å diskutere de.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: "var(--color-secondary)" }}>
                Lenker
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/books" className="transition-colors" style={{ color: "var(--color-nav-text-muted)" }}>
                    Utforsk bøker
                  </Link>
                </li>
                <li>
                  <Link to="/meetings" className="transition-colors" style={{ color: "var(--color-nav-text-muted)" }}>
                    Møter
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="transition-colors" style={{ color: "var(--color-nav-text-muted)" }}>
                    Butikken
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="transition-colors" style={{ color: "var(--color-nav-text-muted)" }}>
                    Din lesehistorikk
                  </Link>
                </li>
                <li>
                  <Link to="/howto" className="transition-colors" style={{ color: "var(--color-nav-text-muted)" }}>
                    How to lydbokbibiloteket
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/users/stineolsen/projects/1/views/1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors"
                    style={{ color: "var(--color-nav-text-muted)" }}
                  >
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: "var(--color-secondary)" }}>
                Fellesskap
              </h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-nav-text-muted)" }}>
                Bli med i bokklubben for å dele dine tanker, utforske nye bøker
                og hold deg oppdatert på hva som skjer i bokklubben.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            className="pt-6 border-t text-center"
            style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-nav-text-muted)" }}>
              © {currentYear} Between The Covers. Laget med ❤️ for bokklubben.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
