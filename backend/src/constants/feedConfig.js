// The activity feed is computed on read (activityController.getActivity)
// from four different source collections rather than stored as its own
// documents, so reactions/comments key off (type, source document id)
// instead of a feed-item id - see FeedReaction.js / FeedComment.js.
const FEED_ACTIVITY_TYPES = ["review", "status", "meeting", "advent"];

// Fixed palette, not free-form - validated server-side in
// feedController.toggleReaction so the set shown in the UI is the only
// set that can ever be stored. Mirrored in frontend/.../ActivityFeed.jsx
// (REACTION_EMOJI there) for the picker - keep both lists in sync.
const REACTION_EMOJI = ["❤️", "👏", "😂", "📚", "😍", "🤬", "🤯", "🤮", "🙌", "👀", "💯"];

module.exports = { FEED_ACTIVITY_TYPES, REACTION_EMOJI };
