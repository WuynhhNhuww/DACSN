const User = require("../models/User");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Complaint = require("../models/complaintModel");
const Banner = require("../models/bannerModel");
const Voucher = require("../models/voucherModel");

// GET /api/admin/stats
exports.getSystemStats = async (req, res) => {
  try {
    // ===== USERS =====
    const totalSellers = await User.countDocuments({ role: "seller" });
    const activeSellers = await User.countDocuments({ role: "seller", "sellerInfo.sellerStatus": "active" });
    const pendingSellers = await User.countDocuments({ role: "seller", "sellerInfo.sellerStatus": "pending" });
    const lockedSellers = await User.countDocuments({ role: "seller", "sellerInfo.sellerStatus": "locked" });
    const totalBuyers = await User.countDocuments({ role: "buyer" });
    const blockedBuyers = await User.countDocuments({ role: "buyer", isBlocked: true });

    // ===== PRODUCTS =====
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const pendingProducts = await Product.countDocuments({ status: "pending_review", isDeleted: false });
    const approvedProducts = await Product.countDocuments({ status: "approved", isDeleted: false });
    const rejectedProducts = await Product.countDocuments({ status: "rejected", isDeleted: false });

    // ===== ORDERS =====
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: "completed" });
    const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

    // ===== REVENUE =====
    const revenueData = await Order.aggregate([
      { $match: { status: { $in: ["completed", "delivered", "shipping"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // ===== COMPLAINTS =====
    const totalComplaints = await Complaint.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: { $in: ["open", "escalated", "seller_processing"] } });
    const resolvedComplaints = await Complaint.countDocuments({ status: "resolved" });

    // ===== BANNERS =====
    const activeBanners = await Banner.countDocuments({ status: "active" });
    const pendingBanners = await Banner.countDocuments({ status: "pending" });

    // ===== VOUCHERS =====
    const activeVouchers = await Voucher.countDocuments({ isActive: true });

    // ===== TOP SELLERS =====
    const topSellers = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $match: { status: { $nin: ["cancelled"] } } },
      { $group: { _id: "$orderItems.seller", totalRevenue: { $sum: "$orderItems.lineTotal" }, totalOrders: { $addToSet: "$_id" } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // ===== TOP PRODUCTS =====
    const topProducts = await Product.find({ status: "approved", isDeleted: false })
      .sort({ sold: -1 })
      .limit(5)
      .select("name sold price images");

    res.json({
      sellers: { total: totalSellers, active: activeSellers, pending: pendingSellers, locked: lockedSellers },
      buyers: { total: totalBuyers, blocked: blockedBuyers },
      products: { total: totalProducts, pending: pendingProducts, approved: approvedProducts, rejected: rejectedProducts },
      orders: { total: totalOrders, completed: completedOrders, cancelled: cancelledOrders },
      totalRevenue,
      complaints: { total: totalComplaints, open: openComplaints, resolved: resolvedComplaints },
      banners: { active: activeBanners, pending: pendingBanners },
      vouchers: { active: activeVouchers },
      topProducts,
      topSellers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
