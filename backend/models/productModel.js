const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, index: true },

    description: { type: String, required: true },

    category: { type: String, required: true, index: true },

    sellerProvince: { type: String, default: "", index: true },

    images: { type: [String], default: [] },

    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },

    // ===== VARIANTS =====
    // Ví dụ: [{ name: "Màu đỏ", price: 100000, stock: 10, image: "..." }]
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        stock: { type: Number, required: true, min: 0 },
        image: { type: String, default: "" },
      },
    ],

    sold: { type: Number, default: 0, min: 0 },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    // ===== APPROVAL STATUS =====
    // pending_review → chờ admin duyệt (mặc định khi seller đăng mới)
    // approved       → đã duyệt, hiển thị công khai
    // rejected       → bị từ chối (có lý do)
    // removed        → bị admin gỡ do vi phạm
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected", "removed"],
      default: "pending_review",
      index: true,
    },

    rejectedReason: { type: String, default: "" },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);