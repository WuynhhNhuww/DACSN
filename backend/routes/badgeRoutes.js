const express = require("express");
const router = express.Router();
const { getAdminBadges, getSellerBadges, getBuyerBadges } = require("../controllers/badgeController");
const { protect, admin } = require("../middleware/authMiddleware");

// Admin badges
router.get("/admin", protect, admin, getAdminBadges);

// Seller badges
router.get("/seller", protect, getSellerBadges);

// Buyer badges
router.get("/buyer", protect, getBuyerBadges);

module.exports = router;
