const express = require("express");
const router = express.Router();
const {
  getWallet,
  depositToWallet,
  withdrawFromWallet,
  createVnpayPayment,
  createVnpayWithdraw,
  verifyVnpayPayment
} = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getWallet);
router.route("/deposit").post(protect, depositToWallet);
router.route("/withdraw").post(protect, withdrawFromWallet);

// VNPay — Nạp & Rút đều qua VNPay
router.route("/vnpay-create").post(protect, createVnpayPayment);
router.route("/vnpay-withdraw").post(protect, createVnpayWithdraw);
router.route("/vnpay-verify").get(verifyVnpayPayment);

module.exports = router;
