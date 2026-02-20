const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "NOK",
  },
});

const orderSchema = new mongoose.Schema(
  {
    // Customer information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },

    // Order items
    items: [orderItemSchema],

    // Total amount
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Delivery information
    deliveryAddress: {
      type: String,
      trim: true,
    },

    // Order notes
    notes: {
      type: String,
      trim: true,
    },

    // Order status
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    // Admin notes (internal)
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Populate product and user details when querying
orderSchema.pre(/^find/, function () {
  this.populate({
    path: "user",
    select: "username displayName email",
  }).populate({
    path: "items.product",
    select: "name images category",
  });
});

// Index for querying by status and user
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
