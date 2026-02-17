import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 transform transition-transform hover:scale-105">
            <img
              src="/logo.png"
              alt="Between The Covers"
              className="h-12 w-12 drop-shadow-lg"
            />
            <span className="text-xl font-bold text-white drop-shadow-lg hidden sm:block">Between The Covers</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Home
                </Link>
                <Link
                  to="/books"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Books
                </Link>
                <Link
                  to="/meetings"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Meetings
                </Link>
                <Link
                  to="/history"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Reading History
                </Link>
                <Link
                  to="/shop"
                  className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                >
                  Shop
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-yellow-300 hover:text-yellow-200 font-bold transition-all transform hover:scale-110"
                  >
                    ⭐ Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="text-white hover:text-white/80 font-medium transition-all transform hover:scale-110"
                  >
                    👤 {user?.displayName || user?.username}
                  </Link>
                  <button onClick={handleLogout} className="btn-accent text-sm py-2 px-4">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-white/80 font-medium transition-all">
                  Login
                </Link>
                <Link to="/register" className="btn-accent text-sm py-2 px-4">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
