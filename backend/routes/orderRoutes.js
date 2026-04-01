const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const { protect, isSellerOrAdmin, isBuyerOnly } = require("../middleware/authMiddleware");

router.post("/", protect, isBuyerOnly, createOrder);
router.get("/my", protect, isBuyerOnly, getMyOrders);
router.get("/:id", protect, getOrderById);

// chỉ seller/admin được cập nhật trạng thái
router.put("/:id/status", protect, isSellerOrAdmin, updateOrderStatus);

// người mua tự hủy đơn
router.patch("/:id/cancel", protect, isBuyerOnly, cancelOrder);

module.exports = router;