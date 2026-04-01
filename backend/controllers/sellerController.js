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
          status: { $ne: "cancelled" },
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

    const totalOrders =
      revenueData.length > 0
        ? revenueData[0].totalOrders.length
        : 0;

    // 4️⃣ Top sản phẩm bán chạy
    const topProducts = await Product.find({ seller: sellerId })
      .sort({ sold: -1 })
      .limit(5);

    // 5️⃣ Sản phẩm bán chậm
    const slowProducts = await Product.find({ seller: sellerId })
      .sort({ sold: 1 })
      .limit(5);

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalStockRemaining,
      topProducts,
      slowProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};