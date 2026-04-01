const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    value: { type: Number, required: true, min: 0 },

    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },

    isActive: { type: Boolean, default: true, index: true },

    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ index giúp lọc promotion đang chạy nhanh hơn
promotionSchema.index({ seller: 1, isActive: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);