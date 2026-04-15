const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    proofImage: {
      type: String,
      default: "",
    },
    proofVideo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "SELLER_ACCEPTED", "SELLER_REJECTED", "ADMIN_RESOLVED", "CANCELLED"],
      default: "PENDING",
    },
    adminDecision: {
      type: String,
      default: "",
      enum: ["", "REFUND_TO_BUYER", "PAY_TO_SELLER"],
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
