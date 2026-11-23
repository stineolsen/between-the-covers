const mongoose = require("mongoose");

// One Secret Santa draw per year. Admin draws (pairs are fixed from then on)
// and then opens it, which is when members see their own match on the
// homepage. Nobody - admin included, since admin takes part too - can see
// anyone else's match through the app.
const secretSantaSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    pairs: [
      {
        _id: false,
        giver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    open: { type: Boolean, default: false },
    drawnAt: { type: Date, default: null },
    openedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SecretSanta", secretSantaSchema);
