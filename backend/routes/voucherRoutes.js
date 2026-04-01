const express = require("express");
const router = express.Router();
const {
  getVouchers, createVoucher, updateVoucher, deleteVoucher, applyVoucher,
} = require("../controllers/voucherController");
const { protect, admin, isSellerOrAdmin } = require("../middleware/authMiddleware");

// Buyer apply voucher (unprotected so guest can check, but won't increment usage)
router.post("/apply", protect, applyVoucher);

// Admin & Seller — CRUD
router.route("/")
  .get(protect, getVouchers)
  .post(protect, isSellerOrAdmin, createVoucher);

router.route("/:id")
  .put(protect, isSellerOrAdmin, updateVoucher)
  .delete(protect, isSellerOrAdmin, deleteVoucher);

module.exports = router;
