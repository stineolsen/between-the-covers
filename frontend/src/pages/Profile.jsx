import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { usersApi } from "../api/usersApi";
import { authApi } from "../api/authApi";
import { userBooksApi } from "../api/userBooksApi";
import { booksApi } from "../api/booksApi";

const Profile = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    favoriteGenres: user?.favoriteGenres?.join(", ") || "",
  });

  const defaultAvatars = usersApi.getDefaultAvatars();

  const [ownedBooks, setOwnedBooks] = useState([]);
  const [ownedLoading, setOwnedLoading] = useState(true);

  useEffect(() => {
    userBooksApi.getUserBooks({ owned: true })
      .then(data => setOwnedBooks(data.userBooks || []))
      .catch(() => setOwnedBooks([]))
      .finally(() => setOwnedLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await usersApi.updateProfile(formData);
      setUser(data.user);
      toast.success("Profil oppdatert!");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Greide ikke oppdatere profil",
      );
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Filstørrelse må være mindre enn 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Venligst velg en bildefil");
      return;
    }

    try {
      setIsUploading(true);
      const data = await usersApi.uploadAvatar(file);
      setUser({ ...user, avatar: data.avatar });
      toast.success("Avatar lastet opp med suksess!");
      setShowAvatarModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Greide ikke laste opp avatar",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDefaultAvatar = async (avatarName) => {
    try {
      setIsUploading(true);
      const data = await usersApi.selectDefaultAvatar(avatarName);
      setUser({ ...user, avatar: data.avatar });
      toast.success("Avatar oppdatert med suksess!");
      setShowAvatarModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Greide ikke oppdatere avatar",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Er du sikker på at du vil fjerne din avatar?")) return;

    try {
      await usersApi.deleteAvatar();
      setUser({ ...user, avatar: null });
      toast.success("Avatar fjernet med suksess");
    } catch (error) {
      toast.error(error.response?.data?.message || "Greide ikke fjerne avatar");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passordene stemmer ikke overens");
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success("Passord oppdatert!");
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Greide ikke oppdatere passord");
    }
    setPasswordLoading(false);
  };

  const getDisplayAvatar = () => {
    if (user?.avatar) {
      return usersApi.getAvatarUrl(user.avatar);
    }
    return null;
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold gradient-text mb-8 text-center">
          Min profil
        </h1>

        <div className="container-gradient">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
            <div className="relative group">
              <div
                className="w-40 h-40 rounded-full overflow-hidden shadow-xl mb-4"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                }}
              >
                {getDisplayAvatar() ? (
                  <img
                    src={getDisplayAvatar()}
                    alt={user?.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl text-white font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-4 right-0 bg-white rounded-full p-3 shadow-lg transform hover:scale-110 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                }}
              >
                <span className="text-white text-xl">📷</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {user?.displayName}
            </h2>
            <p className="text-gray-600">@{user?.username}</p>
            <div className="flex gap-2 mt-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #f093fb, #f5576c)",
                }}
              >
                {user?.role}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  background:
                    user?.status === "approved"
                      ? "linear-gradient(135deg, #0ba360, #3cba92)"
                      : "linear-gradient(135deg, #6b7280, #4b5563)",
                  color: "white",
                }}
              >
                {user.status === "approved" ? "godkjent" : "venter"}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Visningsnavn
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ditt visningsnavn"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="input-field"
                  placeholder="Fortell oss litt om deg..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Favorittsjangere
                </label>
                <input
                  type="text"
                  name="favoriteGenres"
                  value={formData.favoriteGenres}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Fiction, Mystery, Romance (komma mellom hver sjanger)"
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary flex-1">
                  💾 Lagre endringer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      displayName: user?.displayName || "",
                      bio: user?.bio || "",
                      favoriteGenres: user?.favoriteGenres?.join(", ") || "",
                    });
                  }}
                  className="px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #9ca3af, #6b7280)",
                    color: "white",
                  }}
                >
                  Avbryt
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>

              {user?.bio && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bio
                  </label>
                  <p className="text-lg text-gray-900 whitespace-pre-line">
                    {user.bio}
                  </p>
                </div>
              )}

              {user?.favoriteGenres && user.favoriteGenres.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Favorite Genres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {user.favoriteGenres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full text-sm font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea, #764ba2)",
                        }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary w-full"
              >
                ✏️ Rediger profil
              </button>
            </div>
          )}
        </div>
        {/* Change Password Section */}
        <div className="container-gradient mt-6">
          <button
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }}
            className="w-full flex items-center justify-between font-bold text-gray-700"
          >
            <span>🔒 Bytt passord</span>
            <span>{showPasswordForm ? "▲" : "▼"}</span>
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nåværende passord
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nytt passord
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input-field"
                  placeholder="Minst 6 tegn"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bekreft nytt passord
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="Gjenta passordet"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? "⏳ Lagrer..." : "💾 Lagre nytt passord"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #9ca3af, #6b7280)", color: "white" }}
                >
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bookshelf */}
        <div className="container-gradient mt-6">
          <h2 className="text-xl font-bold gradient-text mb-4">
            📖 Min bokhylle ({ownedBooks.length})
          </h2>

          {ownedLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ownedBooks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              Du har ikke lagt til noen bøker i bokhyllen din enda.<br />
              Åpne en bok og trykk «Legg til bokhyllen».
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {ownedBooks.map(({ book }) => {
                if (!book) return null;
                const cover = booksApi.getCoverUrl(book.coverImage);
                return (
                  <Link
                    key={book._id}
                    to={`/books/${book._id}`}
                    title={`${book.title} — ${book.author}`}
                    className="group block"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-gray-100 group-hover:shadow-xl transition-shadow">
                      {cover ? (
                        <img src={cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2"
                          style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)" }}>
                          <span className="text-xs text-center text-gray-500 font-medium line-clamp-3 leading-tight">
                            {book.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-2xl w-full animate-fadeIn shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold gradient-text mb-6">
              Velg din avatar
            </h3>

            {/* Upload Custom Avatar */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                📤 Last opp egen avatar/bilde
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isUploading ? "⏳ Laster opp..." : "📁 Velg fil"}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Maks filstørrelse: 5MB. Støttede formater: JPG, PNG, GIF, WebP
              </p>
            </div>

            {/* Default Avatars */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                🎨 Default avatarer
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {defaultAvatars.map((avatar) => (
                  <button
                    key={avatar.name}
                    onClick={() => handleSelectDefaultAvatar(avatar.name)}
                    disabled={isUploading}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 transition-all transform hover:scale-105 disabled:opacity-50"
                  >
                    <img
                      src={usersApi.getAvatarUrl(avatar.name)}
                      alt={avatar.label}
                      className="w-20 h-20 rounded-full shadow-lg"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {avatar.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delete Avatar */}
            {user?.avatar && (
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleDeleteAvatar}
                  className="w-full py-3 rounded-full font-bold text-white transition-all transform hover:scale-105 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  }}
                >
                  🗑️ Fjern avatar
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowAvatarModal(false)}
              className="mt-4 w-full py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #9ca3af, #6b7280)",
                color: "white",
              }}
            >
              Lukk
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
