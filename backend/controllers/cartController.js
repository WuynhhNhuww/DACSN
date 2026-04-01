const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// Tính giá sau khi áp dụng discount của sản phẩm
const calcFinalPrice = (product) => {
  const d = product.discount;
  if (!d || !d.isActive) return product.price;
  const now = new Date();
  if (d.startTime && now < new Date(d.startTime)) return product.price;
  if (d.endTime && now > new Date(d.endTime)) return product.price;
  if (d.type === "percentage") return Math.max(0, product.price * (1 - d.value / 100));
  if (d.type === "fixed") return Math.max(0, product.price - d.value);
  return product.price;
};

// @desc Add product to cart
// @route POST /api/cart
// @access Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be >= 1" });
    }

    const product = await Product.findById(productId);

    if (!product || product.isDeleted || product.status !== "approved") {
      return res.status(404).json({ message: "Product not available" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    // Lấy snapshot với giá đã giảm
    const image =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : "";
    const finalPrice = calcFinalPrice(product);

    if (itemIndex > -1) {
      // nếu đã có thì tăng số lượng
      cart.items[itemIndex].quantity += Number(quantity);
      // cập nhật lại snapshot với giá mới nhất
      cart.items[itemIndex].name = product.name;
      cart.items[itemIndex].image = image;
      cart.items[itemIndex].unitPrice = finalPrice;
    } else {
      cart.items.push({
        product: productId,
        seller: product.seller,
        quantity: Number(quantity),
        name: product.name,
        image,
        unitPrice: finalPrice,
      });
    }

    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get current user's cart
// @route GET /api/cart
// @access Private
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product")
      .populate("items.seller", "name sellerInfo");

    if (!cart) {
      return res.json({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Remove item from cart
// @route DELETE /api/cart/:productId
// @access Private
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId.toString()
    );

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addToCart, getCart, removeFromCart };