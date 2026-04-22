const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/walletModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/emailHelper");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ======================== AUTH ========================

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo mã xác thực ngẫu nhiên
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      isVerified: false,
      verificationToken
    });

    // Tự động tạo Ví rỗng cho User mới
    await Wallet.create({ user: user._id, balance: 0, frozenBalance: 0 });

    // Gửi email xác nhận
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&email=${email}`;
    
    const htmlContent = `
      <h1>Xác nhận tài khoản Shopee Mini</h1>
      <p>Chào ${name},</p>
      <p>Cảm ơn bạn đã đăng ký. Vui lòng nhấn vào link bên dưới để xác thực tài khoản của bạn:</p>
      <a href="${verificationUrl}" style="background: #ee4d2d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xác nhận ngay</a>
      <p>Link này sẽ hết hạn sau 24h.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Xác nhận tài khoản Shopee Mini",
        html: htmlContent,
      });
      res.status(201).json({ 
        message: "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản." 
      });
    } catch (mailError) {
      console.error("Mail error:", mailError);
      res.status(201).json({ 
        message: "Đăng ký thành công nhưng không thể gửi email xác nhận. Vui lòng liên hệ hỗ trợ." 
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    if (!user.isVerified) {
      return res.status(401).json({ 
        message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email." 
      });
    }

    // Kiểm tra Ví, nếu chưa có thì phòng ngừa tạo tự động
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      await Wallet.create({ user: user._id, balance: 0, frozenBalance: 0 });
    }

    if (user.isBlocked)
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa vĩnh viễn." });

    // Seller bị khóa vĩnh viễn
    if (user.role === "seller" && user.sellerInfo?.sellerStatus === "locked")
      return res.status(403).json({ message: "Gian hàng của bạn đã bị khóa vĩnh viễn do vi phạm." });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      dob: user.dob,
      token: generateToken(user._id),
      sellerInfo: user.sellerInfo,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Verify Email
// @route GET /api/users/verify-email?token=...&email=...
exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;
    const user = await User.findOne({ email, verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Link xác nhận không hợp lệ hoặc đã hết hạn." });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: "Tài khoản đã được xác thực thành công. Bạn có thể đăng nhập ngay." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Google Login
// @route POST /api/users/google-login
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Xác thực token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (user) {
      // Nếu user tồn tại nhưng chưa có googleId (đăng ký thường trước đó)
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Google email mặc định là verified
        await user.save();
      }
    } else {
      // Tạo user mới từ Google
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
        // password không bắt buộc vì đã có googleId (theo mapping schema mới)
      });
      
      // Tạo Ví rỗng
      await Wallet.create({ user: user._id, balance: 0, frozenBalance: 0 });
    }

    // Kiểm tra Ví, nếu chưa có thì phòng ngừa tạo tự động
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      await Wallet.create({ user: user._id, balance: 0, frozenBalance: 0 });
    }

    if (user.isBlocked)
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa." });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      sellerInfo: user.sellerInfo,
    });
  } catch (err) {
    res.status(500).json({ message: "Google Authentication failed: " + err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.gender !== undefined) user.gender = req.body.gender;
    if (req.body.dob !== undefined) user.dob = req.body.dob || null;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      gender: updated.gender,
      dob: updated.dob,
      sellerInfo: updated.sellerInfo,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== SELLER REGISTRATION ========================

// Buyer đăng ký trở thành seller → status = "pending", chờ admin duyệt
exports.becomeSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "seller")
      return res.status(400).json({ message: "Bạn đã là người bán." });
    if (user.role === "admin")
      return res.status(400).json({ message: "Admin không thể đăng ký seller." });

    user.role = "seller";
    user.sellerInfo = {
      shopName: req.body.shopName || user.name + " Store",
      shopDescription: req.body.shopDescription || "",
      phone: req.body.phone || "",
      address: req.body.address || "",
      sellerStatus: "pending",
      isApproved: false,
      reputationScore: 5,
      violationCount: 0,
    };
    const updated = await user.save();
    res.json({
      message: "Đăng ký thành công. Tài khoản seller đang chờ admin duyệt.",
      sellerInfo: updated.sellerInfo,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng ký dịch vụ Gói Freeship / Voucher Xtra (Premium Service)
exports.togglePremiumService = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "seller") {
      return res.status(404).json({ message: "Seller không tồn tại" });
    }

    const { action } = req.body; // 'register' hoặc 'cancel'
    
    if (!user.sellerInfo) user.sellerInfo = {};
    
    if (action === "register") {
      user.sellerInfo.isPremiumServiceRegistered = true;
    } else if (action === "cancel") {
      user.sellerInfo.isPremiumServiceRegistered = false;
    } else {
      return res.status(400).json({ message: "Action không hợp lệ" });
    }

    await user.save();
    res.json({
      message: action === "register" ? "Đã đăng ký Gói Dịch Vụ thành công" : "Đã hủy Gói Dịch Vụ",
      isPremiumServiceRegistered: user.sellerInfo.isPremiumServiceRegistered
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== ADMIN — SELLER MANAGEMENT ========================

// Duyệt seller
exports.approveSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "seller")
      return res.status(404).json({ message: "Seller không tồn tại" });

    user.sellerInfo.sellerStatus = "active";
    user.sellerInfo.isApproved = true;
    user.sellerInfo.approvedAt = new Date();
    user.sellerInfo.rejectedReason = "";
    const updated = await user.save();
    res.json({ message: "Đã duyệt seller thành công.", sellerInfo: updated.sellerInfo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Từ chối seller
exports.rejectSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "seller")
      return res.status(404).json({ message: "Seller không tồn tại" });

    const reason = req.body.reason || "Hồ sơ không hợp lệ";
    user.sellerInfo.sellerStatus = "pending";
    user.sellerInfo.isApproved = false;
    user.sellerInfo.rejectedReason = reason;
    const updated = await user.save();
    res.json({ message: "Đã từ chối đăng ký seller.", sellerInfo: updated.sellerInfo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật trạng thái seller (active / violation / locked / inactive)
exports.updateSellerStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "seller")
      return res.status(404).json({ message: "Seller không tồn tại" });

    const { status } = req.body;
    const allowed = ["active", "violation", "locked", "inactive"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });

    user.sellerInfo.sellerStatus = status;
    if (status === "locked") user.isBlocked = true;
    const updated = await user.save();
    res.json({ message: `Đã cập nhật trạng thái seller thành ${status}.`, sellerInfo: updated.sellerInfo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ghi nhận vi phạm seller — tự động khóa khi đủ 5 lần
exports.recordSellerViolation = async (sellerId, reason = "", adminId = null) => {
  const user = await User.findById(sellerId);
  if (!user || user.role !== "seller") return null;

  user.sellerInfo.violationCount = (user.sellerInfo.violationCount || 0) + 1;
  user.sellerInfo.violationHistory.push({ reason, date: new Date(), recordedBy: adminId });

  // Auto-lock khi đủ 5 vi phạm
  if (user.sellerInfo.violationCount >= 5) {
    user.sellerInfo.sellerStatus = "locked";
    user.isBlocked = true;
  } else {
    user.sellerInfo.sellerStatus = "violation";
  }

  await user.save();
  return user;
};

// ======================== ADMIN — GET ALL USERS ========================

exports.getAllUsers = async (req, res) => {
  try {
    const { role, sellerStatus } = req.query;
    const filter = {};
    if (role) filter.role = role;

    let users = await User.find(filter).select("-password").sort({ createdAt: -1 });

    // Lọc thêm theo sellerStatus nếu cần
    if (sellerStatus) {
      users = users.filter(u => u.sellerInfo?.sellerStatus === sellerStatus);
    }

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Không thể khóa admin" });

    user.isBlocked = !user.isBlocked;
    const updated = await user.save();
    res.json({ message: user.isBlocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", isBlocked: updated.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== WISHLIST ========================

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const productId = req.params.productId;
    const idx = user.wishlist.findIndex(id => id.toString() === productId);
    let inWishlist;
    if (idx > -1) { user.wishlist.splice(idx, 1); inWishlist = false; }
    else { user.wishlist.push(productId); inWishlist = true; }
    await user.save();
    res.json({ inWishlist, message: inWishlist ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== ADDRESSES ========================

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { fullName, phone, province, district, ward, detail, isDefault } = req.body;
    if (!fullName || !phone || !province || !district || !ward || !detail)
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin địa chỉ" });
    if (isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    user.addresses.push({ fullName, phone, province, district, ward, detail, isDefault: isDefault || user.addresses.length === 0 });
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: "Địa chỉ không tồn tại" });
    if (req.body.isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    Object.assign(addr, req.body);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault))
      user.addresses[0].isDefault = true;
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.addressId; });
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== VOUCHERS (saved) ========================

exports.getSavedVouchers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("savedVouchers");
    res.json(user.savedVouchers || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleVoucher = async (req, res) => {
  try {
    const { voucherCode } = req.body;
    if (!voucherCode) return res.status(400).json({ message: "Voucher code is required" });
    const user = await User.findById(req.user._id);
    const index = user.savedVouchers.indexOf(voucherCode);
    if (index === -1) user.savedVouchers.push(voucherCode);
    else user.savedVouchers.splice(index, 1);
    await user.save();
    res.json(user.savedVouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/shop/:id (Public)
exports.getShopInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -savedVouchers -addresses -wishlist");
    if (!user || user.role !== "seller") {
      return res.status(404).json({ message: "Cửa hàng không tồn tại" });
    }

    const Product = require("../models/productModel");
    const products = await Product.find({ seller: user._id, status: "approved", isDeleted: false });

    let totalRating = 0;
    let reviewCount = 0;
    products.forEach(p => {
      totalRating += (p.rating || 0) * (p.numReviews || 0);
      reviewCount += (p.numReviews || 0);
    });

    const shopRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

    res.json({
      _id: user._id,
      name: user.name,
      shopName: user.sellerInfo?.shopName || user.name,
      shopDescription: user.sellerInfo?.shopDescription || "",
      phone: user.sellerInfo?.phone || "",
      address: user.sellerInfo?.address || "",
      reputationScore: user.sellerInfo?.reputationScore || 5,
      joinedAt: user.createdAt,
      productCount: products.length,
      rating: shopRating,
      reviewCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};