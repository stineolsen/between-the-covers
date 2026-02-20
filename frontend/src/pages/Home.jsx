import { useAuth } from "../contexts/AuthContext";
import NextMeeting from "../components/meetings/NextMeeting";
import { Link } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Velkommen til between the covers!
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            {user
              ? `Heisann ${user.displayName || user.username}! 👋`
              : "Utforsk, diskuter og nyt en god bok i godt selskap!"}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div
            className="card-gradient text-center px-4 py-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(251, 113, 133, 0.5))",
            }}
          >
            <Link to="/books">
              <div className="text-4xl mb-4 animate-pulseSlow">📖</div>
              <h3 className="text-xl font-bold text-white mb-3">Bøker</h3>
              <p className="hidden sm:text-white/90 font-medium">
                Bibilotek og anmeldelser.
              </p>
            </Link>
          </div>

          <div
            className="card-gradient text-center px-4 py-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(251, 113, 133, 0.5))",
            }}
          >
            {" "}
            <div className="text-4xl mb-4 animate-pulseSlow">🗓️</div>
            <Link to="/meetings">
              <h3 className="text-xl font-bold text-white mb-3">Møter</h3>
              <p className="hidden sm:text-white/90 font-medium">
                Hva skjer framover.
              </p>
            </Link>
          </div>

          <div
            className="card-gradient text-center px-4 py-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(251, 113, 133, 0.5))",
            }}
          >
            {" "}
            <Link to="/shop">
              <div className="text-4xl mb-4 animate-pulseSlow">🛒</div>
              <h3 className="text-xl font-bold text-white mb-3">Butikk</h3>
              <p className="hidden sm:text-white/90 font-medium">
                Ta en titt innom butikken.
              </p>
            </Link>
          </div>
        </div>

        {/* Next Meeting */}
        <div className="max-w-4xl mx-auto">
          <NextMeeting />
        </div>
      </div>
    </div>
  );
};

export default Home;
