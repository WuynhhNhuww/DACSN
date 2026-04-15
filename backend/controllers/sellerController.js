const Order = require("../models/orderModel");
const Product = require("../models/productModel");

exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // 1️⃣ Tổng số sản phẩm
    const totalProducts = await Product.countDocuments({
      seller: sellerId,
    });

    // 2️⃣ Tổng tồn kho
    const stockData = await Product.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$stock" },
        },
      },
    ]);

    const totalStockRemaining =
      stockData.length > 0 ? stockData[0].totalStock : 0;

    // 3️⃣ Tổng doanh thu & số đơn
    const revenueData = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.seller": sellerId,
          status: { $in: ["delivered", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            // ✅ SỬA đúng field unitPrice
            $sum: {
              $multiply: [
                "$orderItems.unitPrice",
                "$orderItems.qty",
              ],
            },
          },
          totalOrders: { $addToSet: "$_id" },
        },
      },
    ]);

    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const totalOrders = await Order.countDocuments({ "orderItems.seller": sellerId });
    const cancelledOrders = await Order.countDocuments({ "orderItems.seller": sellerId, status: "cancelled" });
    const failedOrders = await Order.countDocuments({ "orderItems.seller": sellerId, status: "delivery_failed" });
    
    // Tỉ lệ hoàn/trả/hủy
    const returnRate = totalOrders > 0 ? (((cancelledOrders + failedOrders) / totalOrders) * 100).toFixed(1) : 0;

    // 4️⃣ Top sản phẩm bán chạy
    const topProducts = await Product.find({ seller: sellerId })
      .sort({ sold: -1 })
      .limit(5);

    // 5️⃣ Sản phẩm bán chậm
    const slowProducts = await Product.find({ seller: sellerId })
      .sort({ sold: 1 })
      .limit(5);

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
      { $unwind: "$orderItems" },
      { $match: { "orderItems.seller": sellerId } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, orderId: "$_id" },
          orderItemsRev: { $sum: { $multiply: ["$orderItems.unitPrice", "$orderItems.qty"] } }
        }
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          revenue: { $sum: "$orderItemsRev" },
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
      totalRevenue,
      totalOrders,
      totalProducts,
      totalStockRemaining,
      topProducts,
      slowProducts,
      monthlyRevenue: formattedMonthlyRev,
      revenueGrowth: growthNum.toFixed(1),
      returnRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};