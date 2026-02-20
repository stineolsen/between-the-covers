import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      setSuccess(result.message);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full container-gradient animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold gradient-text mb-3">
            ✨ Bli med i bokklubben vår
          </h2>
          <p className="mt-2 text-gray-600 text-lg font-medium">
            Opprett konto (venter på godkjenning)
          </p>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-6 p-4 rounded-2xl text-white font-bold text-center animate-slideIn"
            style={{ background: "linear-gradient(135deg, #10b981, #14b8a6)" }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              👤 Brukernavn
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              placeholder="bokormen123"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
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
            <label
              htmlFor="displayName"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              ✨ Visningsnavn (valgfritt)
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              className="input-field"
              placeholder="Ola Nordmann"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              🔒 Bekreft passord
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
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
            {loading ? "⏳ Oppretter konto..." : "🚀 Registrer"}
          </button>
        </form>

        <div
          className="mt-8 text-center p-4 rounded-2xl"
          style={{ background: "rgba(102, 126, 234, 0.1)" }}
        >
          <p className="text-gray-700 font-medium">
            Har du allerede en konto?{" "}
            <Link
              to="/login"
              className="font-bold hover:underline"
              style={{ color: "#f5576c" }}
            >
              Logg inn her ✨
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
