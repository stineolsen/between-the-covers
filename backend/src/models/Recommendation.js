const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    message: {
      type: String,
      maxlength: 500,
      trim: true
    },
    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

// Index for fast lookup of recommendations for a user
recommendationSchema.index({ recipients: 1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
