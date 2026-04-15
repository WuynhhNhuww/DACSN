const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    reason: { type: String, required: true },
    description: { type: String, default: "" },
    evidenceImages: { type: [String], default: [] },

    // ===== SELLER RESPONSE =====
    // Khiếu nại phải chuyển seller xử lý trước
    sellerResponse: { type: String, default: "" },
    proposedRefundAmount: { type: Number, default: 0 },
    sellerRespondedAt: { type: Date, default: null },

    // ===== BUYER DECISION =====
    buyerAccepted: { type: Boolean, default: null },

    // ===== ESCALATION =====
    // Nếu seller không xử lý hoặc không thỏa đáng → admin can thiệp
    escalatedToAdmin: { type: Boolean, default: false, index: true },
    escalatedAt: { type: Date, default: null },

    // ===== STATUS =====
    // open             → mới gửi, chờ seller xử lý
    // seller_processing → seller đang phản hồi
    // escalated        → đã đẩy lên admin
    // resolved         → đã giải quyết xong
    // rejected         → bị từ chối (không hợp lệ)
    status: {
      type: String,
      enum: ["open", "seller_processing", "escalated", "resolved", "rejected"],
      default: "open",
      index: true,
    },

    // ===== RESOLUTION =====
    // Kết quả do admin đưa ra
    resolution: {
      type: String,
      enum: ["buyer_wins", "seller_wins", null],
      default: null,
    },

    // Số tiền hoàn (nếu buyer thắng)
    refundAmount: { type: Number, default: 0 },

    adminNote: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);