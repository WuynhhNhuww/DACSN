const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  confirmReceipt,
  getSellerOrders,
  verifyOrderVnpayPayment,
  createVnpayPaymentForExistingOrder,
  verifyOrderMomoPayment,
  createMomoPaymentForExistingOrder
} = require("../controllers/orderController");

const { protect, isSellerOrAdmin, isBuyerOnly } = require("../middleware/authMiddleware");

router.post("/", protect, isBuyerOnly, createOrder);
router.get("/my", protect, isBuyerOnly, getMyOrders);
router.get("/seller-orders", protect, isSellerOrAdmin, getSellerOrders);
router.get("/:id", protect, getOrderById);

// chỉ seller/admin được cập nhật trạng thái
router.put("/:id/status", protect, isSellerOrAdmin, updateOrderStatus);

// người mua tự hủy đơn
router.patch("/:id/cancel", protect, isBuyerOnly, cancelOrder);
// người mua bấm đã nhận hàng
router.put("/:id/confirm-receipt", protect, isBuyerOnly, confirmReceipt);

// VNPay cho Order
router.get("/vnpay/callback", verifyOrderVnpayPayment);
router.post("/:id/vnpay-create", protect, isBuyerOnly, createVnpayPaymentForExistingOrder);

// MoMo cho Order
router.get("/momo/momo-verify", verifyOrderMomoPayment);
router.post("/:id/momo-create", protect, isBuyerOnly, createMomoPaymentForExistingOrder);

module.exports = router;