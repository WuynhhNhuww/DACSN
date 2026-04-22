const Voucher = require("../models/voucherModel");

// ======================== ADMIN — Platform Vouchers ========================

// GET /api/vouchers (admin: tất cả, seller: của shop mình, buyer: available)
exports.getVouchers = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "admin") {
      // Admin xem tất cả
      if (req.query.scope) filter.scope = req.query.scope;
    } else if (req.user.role === "seller") {
      // Seller xem voucher của shop mình
      filter = { sellerId: req.user._id, scope: "shop" };
    } else {
      // Buyer xem voucher đang hoạt động
      const now = new Date();
      filter = {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      };
      if (req.query.scope) filter.scope = req.query.scope;
      if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    }

    const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/vouchers — Admin tạo voucher toàn sàn, Seller tạo voucher shop
exports.createVoucher = async (req, res) => {
  try {
    const { code, name, type, value, minOrderValue, maxUses, startDate, endDate } = req.body;

    if (!code || !name || !value || !startDate || !endDate)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

    // Kiểm tra code trùng
    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: "Mã voucher đã tồn tại" });

    const scope = req.user.role === "admin" ? "platform" : "shop";
    const sellerId = req.user.role === "seller" ? req.user._id : null;

    const voucher = await Voucher.create({
      code: code.toUpperCase(),
      name,
      type: type || "percentage",
      value,
      minOrderValue: minOrderValue || 0,
      maxUses: maxUses || null,
      startDate,
      endDate,
      createdBy: req.user._id,
      scope,
      sellerId,
    });

    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vouchers/:id
exports.updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher không tồn tại" });

    // Chỉ người tạo hoặc admin mới sửa được
    if (voucher.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền chỉnh sửa" });

    const fields = ["name", "type", "value", "minOrderValue", "maxUses", "startDate", "endDate", "isActive"];
    fields.forEach(f => { if (req.body[f] !== undefined) voucher[f] = req.body[f]; });

    const updated = await voucher.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/vouchers/:id
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher không tồn tại" });

    if (voucher.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền xóa" });

    await voucher.deleteOne();
    res.json({ message: "Đã xóa voucher" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/vouchers/apply — Buyer áp dụng mã giảm giá
exports.applyVoucher = async (req, res) => {
  try {
    const { code, orderTotal, sellerId } = req.body;
    if (!code) return res.status(400).json({ message: "Vui lòng nhập mã giảm giá" });

    const now = new Date();
    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!voucher) return res.status(404).json({ message: "Mã không tồn tại hoặc đã hết hạn" });

    // Kiểm tra xem user này đã từng dùng mã này chưa
    if (voucher.usedByUsers && voucher.usedByUsers.includes(req.user._id)) {
      return res.status(400).json({ message: "Bạn đã sử dụng mã giảm giá này rồi" });
    }

    // Kiểm tra lượt dùng
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses)
      return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" });

    // Kiểm tra đơn tối thiểu
    if (orderTotal < voucher.minOrderValue)
      return res.status(400).json({
        message: `Đơn hàng tối thiểu ₫${voucher.minOrderValue.toLocaleString("vi-VN")} để dùng mã này`,
      });

    // Nếu voucher scope=shop, phải match sellerId
    if (voucher.scope === "shop" && sellerId && voucher.sellerId?.toString() !== sellerId.toString())
      return res.status(400).json({ message: "Mã này không áp dụng cho đơn hàng của shop này" });

    // Tính số tiền giảm
    let discountAmount = 0;
    if (voucher.type === "percentage") {
      discountAmount = Math.round((orderTotal * voucher.value) / 100);
    } else {
      discountAmount = voucher.value;
    }
    discountAmount = Math.min(discountAmount, orderTotal);

    res.json({
      valid: true,
      voucher: { _id: voucher._id, code: voucher.code, name: voucher.name, type: voucher.type, value: voucher.value },
      discountAmount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper gọi nội bộ khi tạo order thành công để tăng usedCount
exports.incrementVoucherUsage = async (code) => {
  await Voucher.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
};
