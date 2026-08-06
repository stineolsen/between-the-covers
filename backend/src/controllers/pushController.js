const PushSubscription = require("../models/PushSubscription");

// @desc    Save (or refresh) a browser's push subscription for the logged-in user
// @route   POST /api/push/subscribe
// @access  Private
exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: "Ugyldig push-abonnement" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys },
      { upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({ success: true, message: "Push-varsler aktivert" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke aktivere push-varsler" });
  }
};

// @desc    Remove a browser's push subscription (e.g. member turns notifications off)
// @route   DELETE /api/push/subscribe
// @access  Private
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: "Mangler endpoint" });
    }

    await PushSubscription.deleteOne({ endpoint, user: req.user._id });

    res.status(200).json({ success: true, message: "Push-varsler deaktivert" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke deaktivere push-varsler" });
  }
};
