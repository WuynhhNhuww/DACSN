const express = require("express");
const router = express.Router();
const { addReview, getProductReviews, getSellerReviews, replyReview } = require("../controllers/reviewController");
const { protect, isSellerOrAdmin } = require("../middleware/authMiddleware");

// Routes cho mọi người dùng hoặc người mua
router.route("/").post(protect, addReview);
router.route("/product/:productId").get(getProductReviews);

// Routes cho Seller
router.route("/seller").get(protect, isSellerOrAdmin, getSellerReviews);
router.route("/:id/reply").put(protect, isSellerOrAdmin, replyReview);

module.exports = router;
