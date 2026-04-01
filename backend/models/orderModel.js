const mongoose = require("mongoose");

// 🔥 Item trong đơn hàng
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

// 🔥 Địa chỉ giao hàng
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderItems: {
      type: [orderItemSchema],
      default: [],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // 💰 Breakdown tiền
    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // 📦 Trạng thái đơn
    status: {
      type: String,
      enum: [
        "pending_payment",
        "pending_confirmation",
        "paid",
        "confirmed",
        "shipping",
        "delivered",
        "completed",
        "cancelled",
        "delivery_failed",
      ],
      default: "pending_payment",
      index: true,
    },

    // 💳 Thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    // ❌ Hủy đơn
    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    // 🚚 Giao hàng
    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    deliveryFailedReason: {
      type: String,
      default: "",
    },

    // ✅ Buyer xác nhận nhận hàng
    confirmReceived: {
      type: Boolean,
      default: false,
    },

    confirmedReceivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);