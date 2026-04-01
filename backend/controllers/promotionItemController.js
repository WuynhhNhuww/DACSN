const Promotion = require("../models/promotionModel");
const PromotionItem = require("../models/promotionItemModel");
const Product = require("../models/productModel");

// [POST] /api/promotion-items
// body: { promotionId, productId, maxQuantity }
const addProductToPromotion = async (req, res) => {
  try {
    const { promotionId, productId, maxQuantity } = req.body;
    if (!promotionId || !productId) {
      return res.status(400).json({ message: "promotionId and productId are required" });
    }

    const promo = await Promotion.findById(promotionId);
    if (!promo) return res.status(404).json({ message: "Promotion not found" });

    // chỉ chủ promo hoặc admin
    if (promo.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // đảm bảo product thuộc seller
    if (product.seller.toString() !== promo.seller.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Product does not belong to this seller" });
    }

    const item = await PromotionItem.create({
      promotion: promo._id,
      product: product._id,
      seller: promo.seller,
      maxQuantity: maxQuantity ?? null,
      soldQuantity: 0,
      isActive: true,
    });

    return res.status(201).json(item);
  } catch (err) {
    // duplicate unique index (promotion + product)
    if (err.code === 11000) {
      return res.status(409).json({ message: "Product already added to this promotion" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

// [DELETE] /api/promotion-items/:id
const removePromotionItem = async (req, res) => {
  try {
    const item = await PromotionItem.findById(req.params.id).populate("promotion");
    if (!item) return res.status(404).json({ message: "PromotionItem not found" });

    const promo = item.promotion;
    if (promo.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await item.deleteOne();
    return res.json({ message: "Removed from promotion" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addProductToPromotion,
  removePromotionItem,
};