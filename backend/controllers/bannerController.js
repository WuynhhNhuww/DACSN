const Banner = require("../models/bannerModel");

// ======================== SELLER — Ad Requests ========================

// POST /api/banners — Seller gửi yêu cầu quảng cáo
exports.submitAdRequest = async (req, res) => {
  try {
    const { imageUrl, title, description, targetType, targetId, position, requestedDays } = req.body;
    if (!title) return res.status(400).json({ message: "Tiêu đề quảng cáo là bắt buộc" });

    const banner = await Banner.create({
      seller: req.user._id,
      imageUrl: imageUrl || "",
      title,
      description: description || "",
      targetType: targetType || "shop",
      targetId: targetId || null,
      position: position || "homepage_top",
      requestedDays: requestedDays || 7,
      status: "pending",
    });

    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/banners/my — Seller xem yêu cầu quảng cáo của mình
exports.getMyAds = async (req, res) => {
  try {
    const ads = await Banner.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== ADMIN — Manage Banners ========================

// GET /api/banners — Admin xem tất cả (lọc theo status)
exports.getAllBanners = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const banners = await Banner.find(filter)
      .populate("seller", "name email sellerInfo")
      .sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/banners/:id/review — Admin duyệt nội dung + đặt phí (hoặc từ chối)
exports.reviewAd = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });
    if (banner.status !== "pending")
      return res.status(400).json({ message: "Chỉ có thể duyệt banner đang chờ" });

    const { action, fee, rejectedReason, adminNote } = req.body;

    if (action === "approve") {
      if (!fee || fee < 100000 || fee > 1000000)
        return res.status(400).json({ message: "Phí quảng cáo phải từ 100,000 đến 1,000,000 VNĐ" });

      banner.status = "awaiting_payment";
      banner.fee = fee;
      banner.adminNote = adminNote || "";
    } else if (action === "reject") {
      banner.status = "rejected";
      banner.rejectedReason = rejectedReason || "Nội dung không phù hợp chính sách";
    } else {
      return res.status(400).json({ message: "action phải là 'approve' hoặc 'reject'" });
    }

    const updated = await banner.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/banners/:id/confirm-payment — Admin xác nhận seller đã thanh toán → kích hoạt banner
exports.confirmPayment = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });
    if (banner.status !== "awaiting_payment")
      return res.status(400).json({ message: "Banner không ở trạng thái chờ thanh toán" });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (banner.requestedDays || 7));

    banner.status = "active";
    banner.paidAt = startDate;
    banner.startDate = startDate;
    banner.endDate = endDate;

    const updated = await banner.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/banners/:id/end — Admin kết thúc banner (hết hạn hoặc vi phạm)
exports.endBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });

    banner.status = "ended";
    const updated = await banner.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/banners/active — Public: lấy banner đang hiển thị cho trang chủ
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate("seller", "name sellerInfo")
      .sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
