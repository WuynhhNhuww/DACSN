const Promotion = require("../models/promotionModel");
const PromotionItem = require("../models/promotionItemModel");

const validateTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid startTime/endTime";
  if (start >= end) return "startTime must be before endTime";
  return null;
};

// [GET] /api/promotions/active — PUBLIC: lấy danh sách Flash Sale đang chạy + sản phẩm đăng ký
exports.getActiveFlashSales = async (req, res) => {
  try {
    const now = new Date();

    const activePromos = await Promotion.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ priority: -1 });

    if (activePromos.length === 0) return res.json([]);

    const promoIds = activePromos.map(p => p._id);

    const items = await PromotionItem.find({
      promotion: { $in: promoIds },
      isActive: true,
    })
      .populate({
        path: "product",
        match: { status: "approved", isDeleted: false },
        populate: { path: "seller", select: "name sellerInfo" },
      })
      .populate("promotion");

    // Gắn sản phẩm vào từng promotion, tính giá sale
    const result = activePromos.map(promo => {
      const promoItems = items
        .filter(item => item.promotion?._id?.toString() === promo._id.toString() && item.product)
        .map(item => {
          const p = item.product;
          let salePrice = p.price;
          if (promo.type === "percentage") {
            salePrice = Math.max(0, p.price - (p.price * promo.value) / 100);
          } else if (promo.type === "fixed") {
            salePrice = Math.max(0, p.price - promo.value);
          }
          return {
            _id: p._id,
            name: p.name,
            images: p.images,
            price: p.price,
            salePrice: Math.round(salePrice),
            sold: p.sold,
            ratingAvg: p.ratingAvg,
            seller: p.seller,
            maxQuantity: item.maxQuantity,
            soldQuantity: item.soldQuantity,
            promotionItemId: item._id,
          };
        });

      return {
        _id: promo._id,
        name: promo.name,
        type: promo.type,
        value: promo.value,
        startTime: promo.startTime,
        endTime: promo.endTime,
        products: promoItems,
      };
    }).filter(promo => promo.products.length > 0);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [POST] /api/promotions — seller tạo chương trình Flash Sale
exports.createPromotion = async (req, res) => {
  try {
    const { name, type, value, startTime, endTime, isActive, priority } = req.body;
    if (!name || !value || !startTime || !endTime)
      return res.status(400).json({ message: "Missing required fields" });

    const timeErr = validateTimeRange(startTime, endTime);
    if (timeErr) return res.status(400).json({ message: timeErr });

    const promo = await Promotion.create({
      seller: req.user._id,
      name,
      type: type || "percentage",
      value,
      startTime,
      endTime,
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0,
    });

    return res.status(201).json(promo);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// [GET] /api/promotions/my — seller xem danh sách của mình
exports.getMyPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find({ seller: req.user._id }).sort({ createdAt: -1 });
    return res.json(promos);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// [PUT] /api/promotions/:id
exports.updatePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Promotion not found" });
    if (promo.seller.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });

    const { name, type, value, startTime, endTime, isActive, priority } = req.body;
    if (startTime && endTime) {
      const timeErr = validateTimeRange(startTime, endTime);
      if (timeErr) return res.status(400).json({ message: timeErr });
    }

    if (name !== undefined) promo.name = name;
    if (type !== undefined) promo.type = type;
    if (value !== undefined) promo.value = value;
    if (startTime !== undefined) promo.startTime = startTime;
    if (endTime !== undefined) promo.endTime = endTime;
    if (isActive !== undefined) promo.isActive = isActive;
    if (priority !== undefined) promo.priority = priority;

    return res.json(await promo.save());
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// [DELETE] /api/promotions/:id
exports.deletePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Promotion not found" });
    if (promo.seller.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });
    await promo.deleteOne();
    return res.json({ message: "Promotion deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};