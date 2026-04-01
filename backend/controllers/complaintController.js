const Complaint = require("../models/complaintModel");
const Order = require("../models/orderModel");
const { recordSellerViolation } = require("./userController");
const User = require("../models/User");

// POST /api/complaints — Buyer gửi khiếu nại
exports.createComplaint = async (req, res) => {
  try {
    const { orderId, reason, description, evidenceImages } = req.body;

    if (!orderId || !reason)
      return res.status(400).json({ message: "Thiếu thông tin đơn hàng hoặc lý do khiếu nại" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Bạn không có quyền khiếu nại đơn này" });

    // Buyer chỉ được khiếu nại đơn đã giao hoặc completed
    if (!["delivered", "completed"].includes(order.status))
      return res.status(400).json({ message: "Chỉ có thể khiếu nại đơn hàng đã giao" });

    // Kiểm tra đã có khiếu nại chưa
    const existing = await Complaint.findOne({ order: orderId, buyer: req.user._id });
    if (existing) return res.status(400).json({ message: "Bạn đã gửi khiếu nại cho đơn hàng này" });

    // Lấy sellerId từ orderItems đầu tiên
    const sellerId = order.orderItems[0]?.seller;

    const complaint = await Complaint.create({
      order: orderId,
      buyer: req.user._id,
      seller: sellerId,
      reason,
      description: description || "",
      evidenceImages: evidenceImages || [],
      status: "open",
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/complaints — Admin xem tất cả | Seller xem của mình | Buyer xem của mình
exports.getComplaints = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "admin") {
      if (req.query.status) filter.status = req.query.status;
      if (req.query.escalated === "true") filter.escalatedToAdmin = true;
    } else if (req.user.role === "seller") {
      filter.seller = req.user._id;
    } else {
      filter.buyer = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate("order")
      .populate("buyer", "name email")
      .populate("seller", "name sellerInfo")
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/complaints/:id — Xem chi tiết
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("order")
      .populate("buyer", "name email")
      .populate("seller", "name sellerInfo");

    if (!complaint) return res.status(404).json({ message: "Khiếu nại không tồn tại" });

    const isOwner =
      complaint.buyer._id.toString() === req.user._id.toString() ||
      complaint.seller._id.toString() === req.user._id.toString() ||
      req.user.role === "admin";

    if (!isOwner) return res.status(403).json({ message: "Không có quyền xem" });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/complaints/:id/seller-respond — Seller phản hồi khiếu nại
exports.sellerRespond = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Khiếu nại không tồn tại" });

    if (complaint.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Không có quyền phản hồi khiếu nại này" });

    if (complaint.status !== "open" && complaint.status !== "seller_processing")
      return res.status(400).json({ message: "Không thể phản hồi khiếu nại ở trạng thái này" });

    const { response } = req.body;
    if (!response) return res.status(400).json({ message: "Nội dung phản hồi là bắt buộc" });

    complaint.sellerResponse = response;
    complaint.sellerRespondedAt = new Date();
    complaint.status = "seller_processing";

    const updated = await complaint.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/complaints/:id/escalate — Buyer yêu cầu escalate lên admin
exports.escalateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Khiếu nại không tồn tại" });

    if (complaint.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Chỉ buyer mới có thể yêu cầu escalate" });

    if (complaint.escalatedToAdmin)
      return res.status(400).json({ message: "Khiếu nại đã được chuyển lên admin" });

    complaint.escalatedToAdmin = true;
    complaint.escalatedAt = new Date();
    complaint.status = "escalated";

    const updated = await complaint.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/complaints/:id/resolve — Admin giải quyết khiếu nại
exports.resolveComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Khiếu nại không tồn tại" });

    if (complaint.status !== "escalated")
      return res.status(400).json({ message: "Chỉ có thể resolve khiếu nại đã escalate lên admin" });

    const { resolution, refundAmount, adminNote } = req.body;
    if (!["buyer_wins", "seller_wins"].includes(resolution))
      return res.status(400).json({ message: "resolution phải là 'buyer_wins' hoặc 'seller_wins'" });

    complaint.resolution = resolution;
    complaint.refundAmount = refundAmount || 0;
    complaint.adminNote = adminNote || "";
    complaint.status = "resolved";
    complaint.resolvedAt = new Date();

    await complaint.save();

    // Nếu buyer thắng → trừ 1 điểm uy tín seller, ghi vi phạm
    if (resolution === "buyer_wins") {
      const seller = await User.findById(complaint.seller);
      if (seller && seller.role === "seller") {
        seller.sellerInfo.reputationScore = Math.max(0, (seller.sellerInfo.reputationScore || 5) - 1);
        await seller.save();
        await recordSellerViolation(complaint.seller, `Thua khiếu nại: ${complaint.reason}`, req.user._id);
      }
    }

    res.json({ message: "Đã giải quyết khiếu nại.", complaint });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
