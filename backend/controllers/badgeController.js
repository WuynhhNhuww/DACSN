const User = require("../models/User");
const Product = require("../models/productModel");
const Complaint = require("../models/complaintModel");
const Banner = require("../models/bannerModel");
const Review = require("../models/reviewModel");

// GET /api/badges/admin
exports.getAdminBadges = async (req, res) => {
  try {
    const pendingSellersCount = await User.countDocuments({
      role: "seller",
      "sellerInfo.sellerStatus": "pending"
    });

    const pendingProductsCount = await Product.countDocuments({
      status: "pending_review",
      isDeleted: false
    });

    const pendingBannersCount = await Banner.countDocuments({
      status: "pending"
    });

    const escalatedComplaintsCount = await Complaint.countDocuments({
      status: "escalated"
    });

    res.json({
      sellers: pendingSellersCount,
      products: pendingProductsCount,
      banners: pendingBannersCount,
      complaints: escalatedComplaintsCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/badges/seller
exports.getSellerBadges = async (req, res) => {
  try {
    const rejectedProductsCount = await Product.countDocuments({
      seller: req.user._id,
      status: "rejected",
      isDeleted: false
    });

    const pendingBannersCount = await Banner.countDocuments({
      seller: req.user._id,
      status: { $in: ["awaiting_payment", "rejected"] }
    });

    const openComplaintsCount = await Complaint.countDocuments({
      seller: req.user._id,
      status: "open"
    });

    const unrepliedReviewsCount = await Review.countDocuments({
      seller: req.user._id,
      sellerReply: { $in: ["", null] }
    });

    res.json({
      products: rejectedProductsCount,
      banners: pendingBannersCount,
      complaints: openComplaintsCount,
      reviews: unrepliedReviewsCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/badges/buyer
exports.getBuyerBadges = async (req, res) => {
  try {
    const Order = require("../models/orderModel");
    const Cart = require("../models/cartModel");

    const pendingOrdersCount = await Order.countDocuments({
      buyer: req.user._id,
      status: { $in: ["pending_payment", "pending_confirmation", "confirmed", "shipping", "delivered"] }
    });

    const cart = await Cart.findOne({ user: req.user._id });
    const cartCount = cart ? cart.items.reduce((sum, it) => sum + (it.quantity || it.qty || 0), 0) : 0;

    const wishlistCount = req.user.wishlist ? req.user.wishlist.length : 0;

    res.json({
      orders: pendingOrdersCount,
      cart: cartCount,
      wishlist: wishlistCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
