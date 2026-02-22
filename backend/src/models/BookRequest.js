const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tittel er påkrevd'],
      trim: true,
      maxlength: 200
    },
    author: {
      type: String,
      required: [true, 'Forfatter er påkrevd'],
      trim: true,
      maxlength: 200
    },
    formats: {
      type: [{ type: String, enum: ['ebook', 'audiobook'] }],
      default: []
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'added'],
      default: 'pending'
    },
    addedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

bookRequestSchema.index({ requestedBy: 1, createdAt: -1 });
bookRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BookRequest', bookRequestSchema);
