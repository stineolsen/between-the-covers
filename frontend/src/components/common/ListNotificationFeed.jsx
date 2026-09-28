import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import listNotificationApi from "../../api/listNotificationApi";
import UserAvatar from "./UserAvatar";

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
    <div className="max-w-4xl mx-auto mt-4 sm:mt-6 animate-fadeIn">
      <h2 className="text-lg sm:text-xl font-bold gradient-text mb-3 sm:mb-4">📋 Listevarsler</h2>
      <div className="space-y-2 sm:space-y-3">
        {notifications.map((n) => {
          const fromName = n.from?.displayName || n.from?.username || "Ukjent";
          const list = n.list;

          return (
            <div
              key={n._id}
              className="flex items-center gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4"
              style={{ background: "var(--gradient-secondary)" }}
            >
              <UserAvatar user={n.from} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <Link to={`/lists/${list?._id}`} className="font-bold text-gray-800 hover:text-[var(--color-primary)] transition-colors block truncate">
                  {list?.title || "Ukjent liste"}
                </Link>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
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
                  <p className="text-xs italic mt-1 line-clamp-2" style={{ color: "var(--color-text-faint)" }}>"{n.message}"</p>
                )}
                {n.type === "comment" && n.comment?.content && (
                  <p className="text-xs italic mt-1 line-clamp-2" style={{ color: "var(--color-text-faint)" }}>"{n.comment.content}"</p>
                )}
              </div>

              <button
                onClick={() => handleDismiss(n._id)}
                className="flex-shrink-0 transition-colors text-xl font-bold leading-none self-start hover:opacity-70"
                style={{ color: "var(--color-text-faint)" }}
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
