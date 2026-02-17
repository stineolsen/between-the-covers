import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full container-gradient animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold gradient-text mb-3">✨ Velkommen tilbake!</h2>
          <p className="mt-2 text-gray-600 text-lg font-medium">Logg inn på bokklubb-kontoen din</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              📧 E-postadresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="deg@eksempel.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
              🔒 Passord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Logger inn...' : '🚀 Logg inn'}
          </button>
        </form>

        <div className="mt-8 text-center p-4 rounded-2xl" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
          <p className="text-gray-700 font-medium">
            Har du ikke en konto?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#f5576c' }}>
              Registrer deg her ✨
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
