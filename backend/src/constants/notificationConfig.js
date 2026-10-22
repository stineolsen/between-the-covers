// Every trigger site that calls notificationCenter.createNotification must
// use one of these. Mirrored in frontend NotificationBell.jsx only for
// icon/label lookup - the backend is the source of truth for what's valid.
const NOTIFICATION_TYPES = [
  "list-shared",
  "list-comment",
  "recommendation",
  "feed-reaction",
  "feed-comment",
  "review-like",
  "review-comment",
  "request-fulfilled",
];

// Maps a notification type to the User boolean field that gates its email
// - null means "never emailed" (none currently, but keeps the mapping
// total so a future type can't be forgotten).
const EMAIL_GATE_FIELD = {
  "list-shared": "notifyOnListShared",
  "list-comment": "notifyOnListComment",
  recommendation: "notifyOnRecommendation",
  "feed-reaction": "notifyOnFeedReaction",
  "feed-comment": "notifyOnFeedComment",
  "review-like": "notifyOnReviewLike",
  "review-comment": "notifyOnReviewComment",
  "request-fulfilled": "notifyOnRequestFulfilled",
};

module.exports = { NOTIFICATION_TYPES, EMAIL_GATE_FIELD };
