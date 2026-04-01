const mongoose = require("mongoose");

// Voucher model — dùng cho cả mã toàn sàn (admin tạo) và mã shop (seller tạo)
const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },

    // percentage = giảm theo %, fixed = giảm số tiền cố định
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    value: { type: Number, required: true, min: 0 },

    // Giá trị đơn hàng tối thiểu để áp mã
    minOrderValue: { type: Number, default: 0, min: 0 },

    // Giới hạn tổng số lượt sử dụng (null = không giới hạn)
    maxUses: { type: Number, default: null },

    // Số lượt đã dùng
    usedCount: { type: Number, default: 0, min: 0 },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Người tạo mã
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // platform = toàn sàn (admin tạo), shop = riêng gian hàng (seller tạo)
    scope: {
      type: String,
      enum: ["platform", "shop"],
      default: "platform",
      index: true,
    },

    // Nếu scope = "shop", bindSellerId là seller sở hữu mã
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

voucherSchema.index({ scope: 1, isActive: 1, endDate: 1 });

module.exports = mongoose.model("Voucher", voucherSchema);
