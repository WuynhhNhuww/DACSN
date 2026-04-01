const express = require("express");
const router = express.Router();
const { protect, isSellerOrAdmin } = require("../middleware/authMiddleware");
const { getSellerAnalytics } = require("../controllers/sellerController");

router.get("/analytics", protect, isSellerOrAdmin, getSellerAnalytics);

module.exports = router;