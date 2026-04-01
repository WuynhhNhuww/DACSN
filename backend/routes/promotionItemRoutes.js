const express = require("express");
const router = express.Router();
const { protect, isSellerOrAdmin } = require("../middleware/authMiddleware");
const {
  addProductToPromotion,
  removePromotionItem,
} = require("../controllers/promotionItemController");

router.post("/", protect, isSellerOrAdmin, addProductToPromotion);
router.delete("/:id", protect, isSellerOrAdmin, removePromotionItem);

module.exports = router;