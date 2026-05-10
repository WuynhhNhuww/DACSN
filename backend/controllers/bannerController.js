const Banner = require("../models/bannerModel");
const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/User");

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
      position: position || "home_slider", // Default to slider
      requestedDays: requestedDays || 7,
      status: "pending",
    });

    // Real-time: Báo cho Admin có yêu cầu quảng cáo mới
    const io = req.app.get("io");
    if (io) {
        io.emit("new_ad_submitted", { bannerId: banner._id });
        io.emit("admin_badge_update");
    }

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

    const { action, fee, requestedDays, rejectedReason, adminNote } = req.body;

    if (action === "approve") {
      if (!fee || fee < 10000)
        return res.status(400).json({ message: "Phí quảng cáo tối thiểu là 10,000 VNĐ/ngày" });

      if (requestedDays) banner.requestedDays = requestedDays;
      banner.status = "awaiting_payment";
      banner.fee = Number(fee) * (banner.requestedDays || 1);
      banner.adminNote = adminNote || "";
    } else if (action === "reject") {
      banner.status = "rejected";
      banner.rejectedReason = rejectedReason || "Nội dung không phù hợp chính sách";
    } else {
      return res.status(400).json({ message: "action phải là 'approve' hoặc 'reject'" });
    }

    const updated = await banner.save();

    // Real-time
    const io = req.app.get("io");
    if (io) {
      io.emit("admin_badge_update");
      if (global.userSockets) {
        const sellerSocketId = global.userSockets.get(banner.seller.toString());
        if (sellerSocketId) {
          io.to(sellerSocketId).emit("ad_status_updated", { bannerId: banner._id, status: banner.status });
          io.to(sellerSocketId).emit("seller_badge_update");
        }
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/banners/:id/confirm-payment — Admin xác nhận (thủ công)
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

    const io = req.app.get("io");
    if (io && global.userSockets) {
      const sellerSocketId = global.userSockets.get(banner.seller.toString());
      if (sellerSocketId) {
        io.to(sellerSocketId).emit("ad_status_updated", { bannerId: banner._id, status: "active" });
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/banners/:id/end — Admin/Seller kết thúc banner
exports.endBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });

    if (req.user.role !== "admin" && banner.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền thao tác" });
    }

    banner.status = "ended";
    const updated = await banner.save();

    const io = req.app.get("io");
    if (io) {
        io.emit("new_ad_submitted", { bannerId: banner._id });
        io.emit("admin_badge_update");
        if (global.userSockets) {
          const sellerSocketId = global.userSockets.get(banner.seller.toString());
          if (sellerSocketId) {
            io.to(sellerSocketId).emit("ad_status_updated", { bannerId: banner._id, status: "ended" });
            io.to(sellerSocketId).emit("seller_badge_update");
          }
        }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/banners/:id/pay-wallet — Seller thanh toán bằng ví
exports.payWithWallet = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });
    if (banner.status !== "awaiting_payment")
      return res.status(400).json({ message: "Banner không ở trạng thái chờ thanh toán" });
    if (banner.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Bạn không có quyền thanh toán cho banner này" });

    const sellerWallet = await Wallet.findOne({ user: req.user._id });
    if (!sellerWallet || sellerWallet.balance < banner.fee) {
      return res.status(400).json({ message: "Số dư ví không đủ. Vui lòng nạp thêm tiền." });
    }

    sellerWallet.balance -= banner.fee;
    await sellerWallet.save();

    await Transaction.create({
      wallet: sellerWallet._id,
      amount: banner.fee,
      type: "PAYMENT",
      status: "COMPLETED",
      description: `Thanh toán quảng cáo: ${banner.title}`,
    });

    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
        let adminWallet = await Wallet.findOne({ user: adminUser._id });
        if (!adminWallet) {
            adminWallet = await Wallet.create({ user: adminUser._id, balance: 0 });
        }
        adminWallet.balance += banner.fee;
        await adminWallet.save();

        await Transaction.create({
            wallet: adminWallet._id,
            amount: banner.fee,
            type: "DEPOSIT",
            status: "COMPLETED",
            description: `Nhận tiền quảng cáo từ Seller: ${req.user.name}`,
        });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (banner.requestedDays || 7));

    banner.status = "active";
    banner.paidAt = startDate;
    banner.startDate = startDate;
    banner.endDate = endDate;
    await banner.save();

    const io = req.app.get("io");
    if (io) {
        io.emit("new_ad_submitted", { bannerId: banner._id });
        io.emit("admin_badge_update");
        if (global.userSockets) {
            const sellerSocketId = global.userSockets.get(banner.seller.toString());
            if (sellerSocketId) {
                io.to(sellerSocketId).emit("ad_status_updated", { bannerId: banner._id, status: "active" });
                io.to(sellerSocketId).emit("seller_badge_update");
            }
        }
    }

    res.json({ message: "Thanh toán thành công và đã kích hoạt quảng cáo", banner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/banners/active — Public: lấy banner đang hiển thị cho trang chủ
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    // Lấy tất cả banner có trạng thái active và chưa hết hạn
    const banners = await Banner.find({
      status: "active",
      endDate: { $gte: now },
    })
      .populate("seller", "name sellerInfo")
      .sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
