import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div
        className="py-12 px-4"
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* About Section */}
            <div>
              <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                📚 Between The Covers
              </h3>
              <p className="text-white/90 leading-relaxed">
                A vibrant community of book lovers sharing reviews, discussing literature, and connecting over our passion for reading.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/books" className="text-white/90 hover:text-white transition-colors font-medium">
                    📖 Browse Books
                  </Link>
                </li>
                <li>
                  <Link to="/meetings" className="text-white/90 hover:text-white transition-colors font-medium">
                    🗓️ Meetings
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="text-white/90 hover:text-white transition-colors font-medium">
                    🛍️ Shop
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="text-white/90 hover:text-white transition-colors font-medium">
                    📊 Reading History
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-white font-bold text-xl mb-4">Community</h3>
              <p className="text-white/90 mb-3 leading-relaxed">
                Join our book club to share your thoughts, discover new reads, and connect with fellow bibliophiles!
              </p>
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer transition-transform hover:scale-110"
                  style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                >
                  📧
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer transition-transform hover:scale-110"
                  style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                >
                  📱
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer transition-transform hover:scale-110"
                  style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                >
                  🌐
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            className="pt-6 border-t text-center"
            style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <p className="text-white/90 font-medium">
              © {currentYear} Between The Covers. Made with ❤️ for book lovers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
