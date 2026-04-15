const express = require("express");
const router = express.Router();
const {
  getWallet,
  depositToWallet,
  withdrawFromWallet,
  createVnpayPayment,
  verifyVnpayPayment
} = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getWallet);
router.route("/deposit").post(protect, depositToWallet);
router.route("/withdraw").post(protect, withdrawFromWallet);

// VNPay
router.route("/vnpay-create").post(protect, createVnpayPayment);
router.route("/vnpay-verify").get(verifyVnpayPayment);

module.exports = router;
