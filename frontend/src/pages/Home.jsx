import { useAuth } from '../contexts/AuthContext';
import NextMeeting from '../components/meetings/NextMeeting';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-7xl font-bold text-white mb-6 drop-shadow-2xl">
            ✨ Velkommen til Between The Covers! 📚
          </h1>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow-lg">
            {user ? `Heisann ${user.displayName || user.username}! 👋` : 'Utforsk, diskuter og nyt en god bok i godt selskap!'}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card-gradient text-center">
            <div className="text-6xl mb-4 animate-bounce">📖</div>
            <h3 className="text-2xl font-bold text-white mb-3">Bokanmeldelser</h3>
            <p className="text-white/90 font-medium">
              Del dine tanker og les hva andre syntes om bøkene som leses for tiden.
            </p>
          </div>

          <div className="card-gradient text-center">
            <div className="text-6xl mb-4 animate-bounce">🗓️</div>
            <h3 className="text-2xl font-bold text-white mb-3">Møter</h3>
            <p className="text-white/90 font-medium">
              Bli med på våre gjevnlige møter for en god dose bokprat, yapping og gossip.
            </p>
          </div>

          <div className="card-gradient text-center">
            <div className="text-6xl mb-4 animate-bounce">🛒</div>
            <h3 className="text-2xl font-bold text-white mb-3">Bibilotek og butikk</h3>
            <p className="text-white/90 font-medium">
              Ta en titt på vår boksamling og butikk.
            </p>
          </div>
        </div>

        {/* Next Meeting */}
        <div className="max-w-6xl mx-auto">
          <NextMeeting />
        </div>
      </div>
    </div>
  );
};

export default Home;
