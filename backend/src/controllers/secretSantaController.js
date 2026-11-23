const SecretSanta = require("../models/SecretSanta");
const User = require("../models/User");
const { drawPairs } = require("../utils/secretSantaDraw");

// Same rule as the members page: "test" is a testing account, never a member
const isTestAccount = (user) => user.username?.toLowerCase() === "test";
const USER_FIELDS = "_id displayName username avatar";

const currentYear = () => new Date().getFullYear();

async function getParticipants() {
  const users = await User.find({ status: "approved" }).select(USER_FIELDS).sort({ displayName: 1 });
  return users.filter((u) => !isTestAccount(u));
}

// What the admin panel may see: who takes part and the draw's state - never
// the pairs, since the admin takes part too.
async function adminState(year) {
  const [draw, members] = await Promise.all([
    SecretSanta.findOne({ year }).populate("pairs.giver", USER_FIELDS),
    getParticipants(),
  ]);
  return {
    year,
    members,
    draw: draw
      ? {
          open: draw.open,
          drawnAt: draw.drawnAt,
          openedAt: draw.openedAt,
          participants: draw.pairs.map((p) => p.giver).filter(Boolean),
        }
      : null,
  };
}

// @desc    Admin: this year's Secret Santa state (no pairs)
// @route   GET /api/secret-santa/admin
// @access  Private/Admin
exports.getAdmin = async (req, res) => {
  try {
    res.status(200).json({ success: true, ...(await adminState(currentYear())) });
  } catch (error) {
    console.error("Secret Santa admin error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente Secret Santa" });
  }
};

// @desc    Admin: draw (or redraw, while still closed) this year's pairs
// @route   POST /api/secret-santa/admin/draw
// @access  Private/Admin
exports.draw = async (req, res) => {
  try {
    const year = currentYear();
    const existing = await SecretSanta.findOne({ year });
    if (existing?.open) {
      return res.status(409).json({
        success: false,
        message: "Trekningen er allerede åpnet for medlemmene - lukk den før du trekker på nytt",
      });
    }

    const members = await getParticipants();
    if (members.length < 2) {
      return res.status(400).json({ success: false, message: "Trenger minst to medlemmer for å trekke" });
    }

    const pairs = drawPairs(members.map((m) => m._id));
    await SecretSanta.findOneAndUpdate(
      { year },
      { $set: { pairs, open: false, drawnAt: new Date(), openedAt: null } },
      { upsert: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({ success: true, ...(await adminState(year)) });
  } catch (error) {
    console.error("Secret Santa draw error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke trekke" });
  }
};

// @desc    Admin: open/close the draw for members
// @route   PUT /api/secret-santa/admin/open
// @access  Private/Admin
exports.setOpen = async (req, res) => {
  try {
    const year = currentYear();
    const draw = await SecretSanta.findOne({ year });
    if (!draw) return res.status(400).json({ success: false, message: "Du må trekke før du kan åpne" });

    draw.open = !!req.body.open;
    draw.openedAt = draw.open ? draw.openedAt || new Date() : null;
    await draw.save();

    res.status(200).json({ success: true, ...(await adminState(year)) });
  } catch (error) {
    console.error("Secret Santa open error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke endre status" });
  }
};

// @desc    Admin: throw this year's draw away
// @route   DELETE /api/secret-santa/admin
// @access  Private/Admin
exports.reset = async (req, res) => {
  try {
    const year = currentYear();
    await SecretSanta.deleteOne({ year });
    res.status(200).json({ success: true, ...(await adminState(year)) });
  } catch (error) {
    console.error("Secret Santa reset error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke slette trekningen" });
  }
};

// @desc    The member's own match - only once admin has opened the draw
// @route   GET /api/secret-santa/me
// @access  Private
exports.getMine = async (req, res) => {
  try {
    const year = currentYear();
    const draw = await SecretSanta.findOne({ year, open: true }).populate("pairs.receiver", USER_FIELDS);
    const mine = draw?.pairs.find((p) => String(p.giver) === String(req.user._id));
    if (!draw || !mine?.receiver) {
      // Closed, not drawn, or this member wasn't part of the draw
      return res.status(200).json({ success: true, open: false, year });
    }
    res.status(200).json({ success: true, open: true, year, receiver: mine.receiver });
  } catch (error) {
    console.error("Secret Santa me error:", error);
    res.status(500).json({ success: false, message: "Klarte ikke hente Secret Santa" });
  }
};
