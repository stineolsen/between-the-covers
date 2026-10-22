const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendPushToUser } = require("./pushService");
const { sendNotificationEmail } = require("./emailService");
const { EMAIL_GATE_FIELD } = require("../constants/notificationConfig");

// The one place every trigger site (comments, reactions, recommendations,
// list shares, request-fulfilled, ...) goes through to raise a
// notification. Always creates the in-app record; email and push are both
// best-effort and never block or fail the caller's own action - same
// fire-and-forget philosophy as emailService's notifyListShared/
// notifyListComment, just consolidated into one place instead of repeated
// per trigger.
async function createNotification({ recipient, from, type, message, link }) {
  const recipientId = recipient?._id || recipient;
  const fromId = from?._id || from;
  if (!recipientId) return null;
  // Never notify someone about their own action (e.g. reacting to your
  // own feed post).
  if (fromId && fromId.toString() === recipientId.toString()) return null;

  const notification = await Notification.create({ recipient: recipientId, from: fromId || null, type, message, link });

  // Push: unconditional on having a subscription, same as the existing
  // list-shared/list-comment behaviour - the user's "want push?" choice is
  // really expressed by whether they subscribed at all (see
  // NotificationPreferencesPopup.jsx), not a separate boolean here.
  sendPushToUser(recipientId, { title: "Between the Covers", body: message, url: link || "/" }).catch((error) =>
    console.error(`Notification push failed (${type}):`, error),
  );

  // Email: gated per-type by the matching notifyOn* flag.
  const gateField = EMAIL_GATE_FIELD[type];
  if (gateField) {
    User.findOne({ _id: recipientId, [gateField]: true, status: "approved" })
      .select("email")
      .then((user) => {
        if (!user) return;
        return sendNotificationEmail(user.email, { heading: "Between the Covers", bodyText: message, link, linkLabel: "Se mer" });
      })
      .catch((error) => console.error(`Notification email failed (${type}):`, error));
  }

  return notification;
}

module.exports = { createNotification };
