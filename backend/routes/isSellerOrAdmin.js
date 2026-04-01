const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect, isSellerOrAdmin } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(getProducts)
  .post(protect, isSellerOrAdmin, createProduct);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, isSellerOrAdmin, updateProduct)
  .delete(protect, isSellerOrAdmin, deleteProduct);

module.exports = router;