const mongoose = require("mongoose");

const promotionItemSchema = new mongoose.Schema(
  {
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    maxQuantity: { type: Number, default: null, min: 0 },
    soldQuantity: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

promotionItemSchema.index({ promotion: 1, product: 1 }, { unique: true });

// ✅ index giúp tìm sale theo product nhanh
promotionItemSchema.index({ product: 1, isActive: 1 });

module.exports = mongoose.model("PromotionItem", promotionItemSchema);