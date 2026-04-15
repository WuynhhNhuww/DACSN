const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

// @desc    Tạo đánh giá mới
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;
    const buyerId = req.user._id;

    // 1. Tìm TẤT CẢ các đơn hàng ĐÃ GIAO / HOÀN THÀNH của user cho sản phẩm này
    const completedOrders = await Order.find({
      buyer: buyerId,
      "orderItems.product": productId,
      status: { $in: ["delivered", "completed"] }
    }).sort({ createdAt: -1 });

    if (completedOrders.length === 0) {
      return res.status(400).json({ message: "Bạn phải nhận được hàng (Đã giao/Hoàn thành) thì mới có thể đánh giá." });
    }

    // 2. Tìm xem user đã đánh giá sản phẩm này chưa.
    // Lấy danh sách các đơn hàng đã được đánh giá cho sản phẩm này
    const reviewedOrders = await Review.find({
      buyer: buyerId,
      product: productId
    }).select('order');

    const reviewedOrderIds = reviewedOrders.map(r => r.order.toString());

    // 3. Tìm đơn hàng hoàn thành mới nhất mà CHƯA ĐƯỢC đánh giá
    const orderToReview = completedOrders.find(o => !reviewedOrderIds.includes(o._id.toString()));

    if (!orderToReview) {
      return res.status(400).json({ message: "Tất cả các đơn hàng chứa sản phẩm này của bạn đều đã được đánh giá." });
    }

    // 4. Lấy thông tin seller từ product
    const product = await Product.findById(productId);
    if (!product) {
       return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    // 5. Tạo Đánh giá
    const review = await Review.create({
      product: productId,
      order: orderToReview._id,
      buyer: buyerId,
      seller: product.seller,
      stars: Number(rating),
      comment: comment || "",
      images: images || [],
    });

    // 6. Cập nhật lại số lượng và trung bình sao của Product
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, item) => item.stars + acc, 0) / reviews.length;

    const updatedProduct = await Product.findByIdAndUpdate(productId, {
      ratingCount: numReviews,
      ratingAvg: avgRating
    }, { new: true });

    // 7. Gửi thông báo cho Seller
    if (updatedProduct && updatedProduct.seller) {
      const Notification = require("../models/notificationModel");
      await Notification.create({
        user: updatedProduct.seller,
        type: "review_received",
        title: "Có Đánh giá Mới",
        message: `Sản phẩm "${updatedProduct.name}" vừa nhận được đánh giá ${rating} sao từ người mua.`,
        link: `/product/${updatedProduct._id}`,
      });
    }

    const populatedReview = await Review.findById(review._id).populate("buyer", "name");

    res.status(201).json({ message: "Đánh giá thành công", review: populatedReview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy đánh giá của một sản phẩm
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy tất cả các đánh giá dành cho Seller
// @route   GET /api/reviews/seller
// @access  Private/Seller
exports.getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.user._id })
      .populate("buyer", "name")
      .populate("product", "name images")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seller trả lời đánh giá
// @route   PUT /api/reviews/:id/reply
// @access  Private/Seller
exports.replyReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    if (review.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền trả lời đánh giá này" });
    }

    review.sellerReply = reply;
    review.sellerReplyAt = new Date();
    await review.save();

    res.json({ message: "Đã phản hồi đánh giá", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
