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
            ✨ Welcome to the Bookclub! 📚
          </h1>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow-lg">
            {user ? `Hello, ${user.displayName || user.username}! 👋` : 'Discover, discuss, and celebrate books together.'}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card-gradient text-center">
            <div className="text-6xl mb-4 animate-bounce">📖</div>
            <h3 className="text-2xl font-bold text-white mb-3">Book Reviews</h3>
            <p className="text-white/90 font-medium">
              Share your thoughts and read what others think about our book selections.
            </p>
          </div>

          <div className="card-gradient text-center">
            <div className="text-6xl mb-4 animate-bounce">🗓️</div>
            <h3 className="text-2xl font-bold text-white mb-3">Meetings</h3>
            <p className="text-white/90 font-medium">
              Join our regular meetups to discuss books and connect with fellow readers.
            </p>
          </div>

          <div className="card-gradient text-center">
            <div className="text-6xl mb-4 animate-bounce">🛒</div>
            <h3 className="text-2xl font-bold text-white mb-3">Shop</h3>
            <p className="text-white/90 font-medium">
              Browse our collection of books and bookclub merchandise.
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
