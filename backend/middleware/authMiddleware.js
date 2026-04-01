const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/productModel");

// 🔐 Protect route (phải đăng nhập)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // ✅ chặn tài khoản bị khóa vĩnh viễn / đã xóa
      if (user.isDeleted) {
        return res.status(403).json({ message: "Account is deleted" });
      }
      if (user.isBlocked) {
        return res.status(403).json({ message: "Account is blocked" });
      }

      req.user = user;
      return next();
    } catch (error) {
      // ✅ phân biệt token expired
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

// 👑 Cho phép seller và admin
const isSellerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role === "seller" || req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Not authorized" });
};

// 🛒 Chỉ cho phép buyer (ngăn seller và admin mua hàng)
const isBuyerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role === "seller" || req.user.role === "admin") {
    return res.status(403).json({ message: "Tài khoản Seller/Admin không thể mua hàng." });
  }

  return next();
};


// ✅ Chặn buyer nếu đang bị khóa mua
const blockBuyerIfLimited = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const until = req.user.buyBlockedUntil;
  if (until && new Date(until) > new Date()) {
    return res.status(403).json({ message: "Buying is temporarily blocked" });
  }

  return next();
};

// ✅ Chặn seller nếu đang bị khóa nhận đơn
const blockSellerIfLimited = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const until = req.user.receiveOrderBlockedUntil;
  if (until && new Date(until) > new Date()) {
    return res.status(403).json({ message: "Receiving orders is temporarily blocked" });
  }

  return next();
};

// 🛒 Kiểm tra đúng chủ sản phẩm hoặc admin
const isProductOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (
      req.user.role === "admin" ||
      product.seller.toString() === req.user._id.toString()
    ) {
      req.product = product;
      return next();
    }

    return res.status(403).json({ message: "Not authorized" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// 🛡️ Bắt buộc Admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

module.exports = {
  protect,
  admin,
  isSellerOrAdmin,
  isProductOwnerOrAdmin,
  blockBuyerIfLimited,
  blockSellerIfLimited,
  isBuyerOnly,
};