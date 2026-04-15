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
    const failedOrders = await Order.countDocuments({ status: "delivery_failed" });
    
    // Tỉ lệ hoàn/trả/hủy
    const returnRate = totalOrders > 0 ? (((cancelledOrders + failedOrders) / totalOrders) * 100).toFixed(1) : 0;

    // ===== REVENUE =====
    // Doanh thu tính cho các đơn hàng đã Giao hoặc Hoàn thành
    const revenueData = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "completed"] } } },
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

    // ===== MONTHLY REVENUE (LAST 6 MONTHS) =====
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            name: `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`,
            revenue: 0,
            orders: 0
        });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ["delivered", "completed"] } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          ordersCount: { $sum: 1 }
        }
      }
    ]);

    // Fill the months array with real data
    const formattedMonthlyRev = months.map(m => {
        const match = monthlyData.find(d => d._id.year === m.year && d._id.month === m.month);
        return {
            name: m.name,
            revenue: match ? match.revenue : 0,
            orders: match ? match.ordersCount : 0
        };
    });

    // Generate Growth % vs Last Month
    let growthNum = 0;
    if (formattedMonthlyRev.length >= 2) {
       const last = formattedMonthlyRev[formattedMonthlyRev.length - 1].revenue;
       const prev = formattedMonthlyRev[formattedMonthlyRev.length - 2].revenue;
       if (prev > 0) growthNum = ((last - prev) / prev) * 100;
       else if (last > 0) growthNum = 100;
    }

    res.json({
      sellers: { total: totalSellers, active: activeSellers, pending: pendingSellers, locked: lockedSellers },
      buyers: { total: totalBuyers, blocked: blockedBuyers },
      products: { total: totalProducts, pending: pendingProducts, approved: approvedProducts, rejected: rejectedProducts },
      orders: { total: totalOrders, completed: completedOrders, cancelled: cancelledOrders, failed: failedOrders, returnRate },
      totalRevenue,
      complaints: { total: totalComplaints, open: openComplaints, resolved: resolvedComplaints },
      banners: { active: activeBanners, pending: pendingBanners },
      vouchers: { active: activeVouchers },
      topProducts,
      topSellers,
      monthlyRevenue: formattedMonthlyRev,
      revenueGrowth: growthNum.toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
