const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

const createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ message: "Vui lòng cung cấp đánh giá và bình luận" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        // Check if user has bought this product and order is completed
        const hasBought = await Order.findOne({
            user: req.user._id,
            status: "completed",
            "orderItems.product": productId
        });

        if (!hasBought) {
            return res.status(400).json({ message: "Bạn phải mua sản phẩm này và hoàn thành đơn hàng để đánh giá" });
        }

        // Check if already reviewed
        const alreadyReviewed = await Review.findOne({
            product: productId,
            user: req.user._id
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này" });
        }

        const review = await Review.create({
            product: productId,
            user: req.user._id,
            rating: Number(rating),
            comment
        });

        // Update product rating
        const reviews = await Review.find({ product: productId });
        product.ratingCount = reviews.length;
        product.ratingAvg = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await product.save();

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate("user", "name")
            .sort("-createdAt");

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getProductReviews
};
