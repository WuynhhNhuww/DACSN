const express = require("express");
const router = express.Router();
const {
  submitAdRequest, getMyAds, getAllBanners, reviewAd, confirmPayment, endBanner, getActiveBanners,
} = require("../controllers/bannerController");
const { protect, admin, isSellerOrAdmin } = require("../middleware/authMiddleware");

// Public — banner đang active cho trang chủ
router.get("/active", getActiveBanners);

// Seller
router.post("/", protect, isSellerOrAdmin, submitAdRequest);
router.get("/my", protect, isSellerOrAdmin, getMyAds);

// Admin
router.get("/", protect, admin, getAllBanners);
router.put("/:id/review", protect, admin, reviewAd);
router.put("/:id/confirm-payment", protect, admin, confirmPayment);
router.put("/:id/end", protect, admin, endBanner);

module.exports = router;
