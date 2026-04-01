const mongoose = require("mongoose");

// Banner quảng cáo trả phí — seller gửi yêu cầu, admin duyệt + báo giá, seller thanh toán, admin kích hoạt
const bannerSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Nội dung quảng bá
    imageUrl: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Quảng bá cho sản phẩm hay gian hàng?
    targetType: {
      type: String,
      enum: ["product", "shop"],
      default: "shop",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Vị trí mong muốn
    position: { type: String, default: "homepage_top" },

    // Thời gian muốn quảng cáo (ngày)
    requestedDays: { type: Number, default: 7, min: 1 },

    // ===== TRẠNG THÁI =====
    // pending          → seller vừa gửi, chờ admin duyệt nội dung
    // rejected         → admin từ chối nội dung
    // awaiting_payment → admin đã duyệt + báo giá, chờ seller thanh toán
    // active           → đang hiển thị trên hệ thống
    // ended            → đã kết thúc (hết hạn hoặc admin gỡ)
    status: {
      type: String,
      enum: ["pending", "rejected", "awaiting_payment", "active", "ended"],
      default: "pending",
      index: true,
    },

    // Phí quảng cáo (admin nhập khi duyệt) 100000 - 1000000
    fee: { type: Number, default: 0, min: 0 },

    rejectedReason: { type: String, default: "" },
    adminNote: { type: String, default: "" },

    paidAt: { type: Date, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
