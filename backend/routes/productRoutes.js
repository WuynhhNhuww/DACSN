const express = require("express");
const router = express.Router();
const {
  createProduct, getProducts, getProductById, updateProduct, deleteProduct,
  getSellerProducts, getPendingProducts, getAllProducts,
  approveProduct, rejectProduct, removeProduct,
} = require("../controllers/productController");
const { protect, admin, isSellerOrAdmin } = require("../middleware/authMiddleware");

// Public — chỉ trả về approved products
router.get("/", getProducts);
router.get("/categories", require("../controllers/productController").getCategories);
router.get("/:id", getProductById);

// Seller — xem sản phẩm của mình (tất cả status)
router.get("/seller/my", protect, isSellerOrAdmin, getSellerProducts);

// Admin — quản lý
router.get("/admin/pending", protect, admin, getPendingProducts);
router.get("/admin/all", protect, admin, getAllProducts);
router.put("/:id/approve", protect, admin, approveProduct);
router.put("/:id/reject", protect, admin, rejectProduct);
router.put("/:id/remove", protect, admin, removeProduct);

// Seller/Admin — CRUD
router.post("/", protect, isSellerOrAdmin, createProduct);
router.put("/:id", protect, isSellerOrAdmin, updateProduct);
router.delete("/:id", protect, isSellerOrAdmin, deleteProduct);

module.exports = router;