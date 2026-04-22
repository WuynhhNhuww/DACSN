const express = require("express");
const router = express.Router();
const {
  registerUser, loginUser, verifyEmail, googleLogin, getUserProfile, updateUserProfile, becomeSeller,
  getAllUsers, blockUser, approveSeller, rejectSeller, updateSellerStatus,
  getWishlist, toggleWishlist,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getSavedVouchers, toggleVoucher, getShopInfo, togglePremiumService
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public
router.get("/shop/:id", getShopInfo);
router.post("/register", registerUser);
router.get("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

// Protected
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);
router.put("/become-seller", protect, becomeSeller);
router.post("/premium-service", protect, togglePremiumService);

// Wishlist
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:productId", protect, toggleWishlist);

// Addresses
router.route("/addresses").get(protect, getAddresses).post(protect, addAddress);
router.route("/addresses/:addressId").put(protect, updateAddress).delete(protect, deleteAddress);
router.patch("/addresses/:addressId/default", protect, setDefaultAddress);

// Vouchers (saved)
router.route("/vouchers").get(protect, getSavedVouchers).post(protect, toggleVoucher);

// Admin only
router.get("/", protect, admin, getAllUsers);
router.put("/:id/block", protect, admin, blockUser);
router.put("/:id/approve-seller", protect, admin, approveSeller);
router.put("/:id/reject-seller", protect, admin, rejectSeller);
router.put("/:id/seller-status", protect, admin, updateSellerStatus);

module.exports = router;