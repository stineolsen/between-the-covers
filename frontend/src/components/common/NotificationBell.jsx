import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import notificationCenterApi from "../../api/notificationCenterApi";
import UserAvatar from "./UserAvatar";

const relativeTime = (date) => {
  const diffMs = Date.now() - new Date(date);
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "akkurat nå";
  if (mins < 60) return `${mins} min siden`;
  if (hours < 24) return `${hours} time${hours > 1 ? "r" : ""} siden`;
  if (days < 7) return `${days} dag${days > 1 ? "er" : ""} siden`;
  return new Date(date).toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
};

const POLL_INTERVAL_MS = 60000;

// Bell icon + unread badge, mounted in Navbar. Polls the cheap
// unread-count endpoint rather than the full list, and only fetches the
// actual notifications when the dropdown opens.
const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState(null); // null = not fetched yet
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchCount = () => {
      notificationCenterApi
        .getUnreadCount()
        .then((data) => setUnreadCount(data.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && notifications === null) {
      notificationCenterApi
        .getMine()
        .then((data) => setNotifications(data.notifications || []))
        .catch(() => setNotifications([]));
    }
  };

  const handleClickNotification = (n) => {
    setOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationCenterApi.markAsRead(n._id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = () => {
    setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
    setUnreadCount(0);
    notificationCenterApi.markAllAsRead().catch(() => {});
  };

  const handleDismiss = (e, n) => {
    e.stopPropagation();
    setNotifications((prev) => (prev ? prev.filter((x) => x._id !== n._id) : prev));
    if (!n.read) setUnreadCount((c) => Math.max(0, c - 1));
    notificationCenterApi.remove(n._id).catch(() => {});
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: "var(--color-nav-text)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.25)" }}
        title="Varsler"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[0.65rem] font-bold"
            style={{ background: "var(--color-terracotta-solid)", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed left-3 right-3 top-[76px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-w-none sm:max-w-[90vw] rounded-2xl overflow-hidden z-20"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Varsler</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                Merk alle som lest
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications === null ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--color-text-faint)" }}>Laster ...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--color-text-faint)" }}>Ingen varsler ennå</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleClickNotification(n)}
                  onKeyDown={(e) => e.key === "Enter" && handleClickNotification(n)}
                  className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
                  style={{
                    background: n.read ? "transparent" : "var(--color-wine-tint)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {n.from ? (
                    <UserAvatar user={n.from} className="w-8 h-8 rounded-full font-bold text-xs flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-sunken)" }}>
                      📚
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: "var(--color-text)" }}>{n.message}</p>
                    <p className="text-[0.68rem] mt-0.5" style={{ color: "var(--color-text-faint)" }}>{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "var(--color-primary)" }} />
                  )}
                  <button
                    onClick={(e) => handleDismiss(e, n)}
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center -mt-0.5 -mr-1 hover:opacity-70"
                    style={{ color: "var(--color-text-faint)" }}
                    title="Fjern varsel"
                    aria-label="Fjern varsel"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="5" y1="5" x2="19" y2="19" />
                      <line x1="19" y1="5" x2="5" y2="19" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
