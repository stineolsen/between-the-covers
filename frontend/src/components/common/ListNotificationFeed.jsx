import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import listNotificationApi from "../../api/listNotificationApi";

const AVATAR_COLORS = [
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #db2777, #f472b6)",
  "linear-gradient(135deg, #0891b2, #22d3ee)",
  "linear-gradient(135deg, #059669, #34d399)",
  "linear-gradient(135deg, #d97706, #fbbf24)",
];
const avatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const ListNotificationFeed = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listNotificationApi
      .getMine()
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error("Klarte ikke laste listevarsler:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async (id) => {
    try {
      await listNotificationApi.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // silent
    }
  };

  if (loading || notifications.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mt-6 animate-fadeIn">
      <h2 className="text-xl font-bold gradient-text mb-4">📋 Listevarsler</h2>
      <div className="space-y-3">
        {notifications.map((n) => {
          const fromName = n.from?.displayName || n.from?.username || "Ukjent";
          const list = n.list;

          return (
            <div
              key={n._id}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(251,113,133,0.14))" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: avatarColor(fromName) }}
              >
                {fromName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <Link to={`/lists/${list?._id}`} className="font-bold text-gray-800 hover:text-purple-700 transition-colors block truncate">
                  {list?.title || "Ukjent liste"}
                </Link>
                <p className="text-sm text-gray-600">
                  {n.type === "shared" ? (
                    <>
                      <span className="font-semibold">{fromName}</span> delte denne listen med deg
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{fromName}</span> kommenterte på listen
                    </>
                  )}
                </p>
                {n.type === "shared" && n.message && (
                  <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">"{n.message}"</p>
                )}
                {n.type === "comment" && n.comment?.content && (
                  <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">"{n.comment.content}"</p>
                )}
              </div>

              <button
                onClick={() => handleDismiss(n._id)}
                className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-xl font-bold leading-none self-start"
                title="Avvis"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListNotificationFeed;
