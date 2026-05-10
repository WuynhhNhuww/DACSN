const express = require("express");
const router = express.Router();
const {
  submitAdRequest, getMyAds, getAllBanners, reviewAd, confirmPayment, endBanner, getActiveBanners, payWithWallet
} = require("../controllers/bannerController");
const { protect, admin, isSellerOrAdmin } = require("../middleware/authMiddleware");

// Public — banner đang active cho trang chủ
router.get("/active", getActiveBanners);

// Seller
router.post("/", protect, isSellerOrAdmin, submitAdRequest);
router.get("/my", protect, isSellerOrAdmin, getMyAds);
router.put("/:id/pay-wallet", protect, isSellerOrAdmin, payWithWallet);

// Admin
router.get("/", protect, admin, getAllBanners);
router.put("/:id/review", protect, admin, reviewAd);
router.put("/:id/confirm-payment", protect, admin, confirmPayment);

// Cả Seller và Admin đều có thể kết thúc (Seller hủy yêu cầu, Admin gỡ banner)
router.put("/:id/end", protect, isSellerOrAdmin, endBanner);

module.exports = router;
