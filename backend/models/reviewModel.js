const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },

    images: { type: [String], default: [] },

    sellerReply: { type: String, default: "" },
    sellerReplyAt: { type: Date, default: null },

    isHidden: { type: Boolean, default: false }, // admin/seller report -> ẩn
  },
  { timestamps: true }
);

// ✅ 1 đơn chỉ được review 1 lần cho 1 sản phẩm
reviewSchema.index({ order: 1, product: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);