const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Fire-and-forget, matching the email notify* functions' convention: never
// throws back to the caller, logs and moves on. A subscription that comes
// back 404/410 (expired/revoked, which happens routinely with push) gets
// deleted so it stops being retried forever.
async function sendPushToUser(userId, { title, body, url }) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.error("Web push not configured - skipping push notification");
    return;
  }

  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    const payload = JSON.stringify({ title, body, url });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error("Failed to send push to", sub.endpoint, error.message);
        }
      }
    }
  } catch (error) {
    console.error("sendPushToUser failed:", error);
  }
}

module.exports = { sendPushToUser };
