const express = require("express");
const router = express.Router();
const {
  getActiveFlashSales, createPromotion, getMyPromotions, updatePromotion, deletePromotion,
} = require("../controllers/promotionController");
const { protect, isSellerOrAdmin } = require("../middleware/authMiddleware");

// Public — Flash Sale đang chạy
router.get("/active", getActiveFlashSales);

// Seller
router.post("/", protect, isSellerOrAdmin, createPromotion);
router.get("/my", protect, isSellerOrAdmin, getMyPromotions);
router.put("/:id", protect, isSellerOrAdmin, updatePromotion);
router.delete("/:id", protect, isSellerOrAdmin, deletePromotion);

module.exports = router;