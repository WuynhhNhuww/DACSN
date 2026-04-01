const express = require("express");
const router = express.Router();
const { addToCart, getCart, removeFromCart } = require("../controllers/cartController");
const { protect, isBuyerOnly } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, isBuyerOnly, addToCart)
  .get(protect, isBuyerOnly, getCart);

router
  .route("/:productId")
  .delete(protect, isBuyerOnly, removeFromCart);

module.exports = router;