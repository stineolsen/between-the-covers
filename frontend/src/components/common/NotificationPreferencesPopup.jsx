import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { usersApi } from "../../api/usersApi";
import { subscribeToPush, isPushSupported } from "../../utils/pushNotifications";

// Shown exactly once per user, the first time they load the app after this
// feature shipped - derived directly from user.notificationPreferencesPromptedAt
// rather than its own state, so answering (or skipping) the popup hides it
// the instant setUser() reflects the saved choice, with no extra effect.
// Two plain yes/no questions rather than five per-type toggles: email sets
// all five new notifyOn* flags at once (fine-grained editing can still
// happen later from a settings page), and push is answered by actually
// running the browser subscription flow, not a stored boolean.
const NotificationPreferencesPopup = () => {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!user || user.notificationPreferencesPromptedAt) return null;

  const finish = async (emailEnabled, { tryPush } = {}) => {
    setSaving(true);
    try {
      if (tryPush && (await isPushSupported())) {
        try {
          await subscribeToPush();
        } catch {
          // Permission denied or unsupported - fine, just means no push.
        }
      }
      const data = await usersApi.setNotificationPreferences(emailEnabled);
      setUser(data.user);
    } catch {
      // Don't trap the user behind a broken popup if the request failed to
      // save - close it anyway (locally only; it may reappear on their next
      // full page load since the server never got the "prompted" stamp,
      // but they can still set preferences from Profil in the meantime).
      setUser((prev) => (prev ? { ...prev, notificationPreferencesPromptedAt: new Date().toISOString() } : prev));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="card rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          Vil du ha varsler?
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          Du har alltid varslene i klokken øverst. Vil du i tillegg ha dem på e-post eller push?
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <button onClick={() => finish(true, { tryPush: true })} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            Ja, e-post og push
          </button>
          <button onClick={() => finish(true)} disabled={saving} className="btn-secondary text-sm disabled:opacity-50">
            Bare e-post
          </button>
          <button onClick={() => finish(false, { tryPush: true })} disabled={saving} className="btn-secondary text-sm disabled:opacity-50">
            Bare push
          </button>
        </div>

        <button onClick={() => finish(false)} disabled={saving} className="text-xs font-semibold w-full text-center" style={{ color: "var(--color-text-faint)" }}>
          Nei takk, bare varselklokken
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesPopup;
