import { Link } from "react-router-dom";

const WrappedDone = ({ onEdit }) => (
  <div className="text-center py-8 px-2">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
      style={{ background: "var(--color-sage)", color: "#fff" }}
    >
      ✓
    </div>
    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
      Du er klar for Bokwrapped!
    </h3>
    <p className="max-w-sm mx-auto text-sm" style={{ color: "var(--color-text-muted)" }}>
      Vi varsler deg her på forsiden så snart admin har generert oppsummeringen — like etter
      nyttår.
    </p>
    <div className="flex items-center justify-center gap-5 mt-5">
      <button
        onClick={onEdit}
        className="text-sm font-bold"
        style={{ color: "var(--color-primary)" }}
      >
        Endre svarene dine →
      </button>
      <Link to="/" className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
        Tilbake til forsiden →
      </Link>
    </div>
  </div>
);

export default WrappedDone;
