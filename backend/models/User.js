const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    detail: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

// Đếm vi phạm theo tháng: "YYYY-MM"
const monthlyCounterSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true },
    buyerBoomCount: { type: Number, default: 0 },
    sellerCancelOrNoConfirmCount: { type: Number, default: 0 },
  },
  { _id: false }
);

// Lịch sử vi phạm seller
const violationHistorySchema = new mongoose.Schema(
  {
    reason: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
      index: true,
    },

    // ===== PROFILE EXTRA =====
    phone: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dob: { type: Date, default: null },

    // ===== SELLER INFO =====
    sellerInfo: {
      shopName: { type: String, default: "" },
      shopDescription: { type: String, default: "" },
      logo: { type: String, default: "" },
      coverImage: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },

      // Trạng thái gian hàng theo spec:
      // pending     → chờ admin duyệt
      // active      → đang hoạt động
      // violation   → đang vi phạm (vẫn bán được)
      // locked      → bị khóa vĩnh viễn
      // inactive    → tạm ngừng kinh doanh
      sellerStatus: {
        type: String,
        enum: ["pending", "active", "violation", "locked", "inactive"],
        default: "pending",
        index: true,
      },

      isApproved: { type: Boolean, default: false },
      approvedAt: { type: Date, default: null },
      rejectedReason: { type: String, default: "" },

      // Điểm uy tín (bắt đầu 5, bị trừ khi khiếu nại thắng)
      reputationScore: { type: Number, default: 5, min: 0 },

      // Tổng vi phạm (toàn thời gian) — khóa khi đủ 5
      violationCount: { type: Number, default: 0 },
      violationHistory: { type: [violationHistorySchema], default: [] },
    },

    // ===== BUYER BLOCKS =====
    // Block vĩnh viễn (hành vi nghiêm trọng)
    isBlocked: { type: Boolean, default: false },

    // Block mua hàng theo thời hạn (boom hàng ≥ 3 lần/tháng)
    buyBlockedUntil: { type: Date, default: null },

    // Lịch sử hủy đơn (buyer)
    cancelHistory: [{ date: Date }],

    // Đếm vi phạm theo tháng
    monthlyCounters: { type: [monthlyCounterSchema], default: [] },

    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },

    // Voucher đã lưu
    savedVouchers: [{ type: String }],

    // Wishlist
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Địa chỉ giao hàng
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);