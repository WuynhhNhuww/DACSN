const Product = require("../models/productModel");

// ======================== SELLER — PRODUCT MANAGEMENT ========================

// Seller tạo sản phẩm mới → mặc định status = pending_review
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock, images, sellerProvince } = req.body;

    if (!name || price === undefined || !description || !category)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc (name, price, description, category)" });

    const product = await Product.create({
      seller: req.user._id,
      name,
      price,
      description,
      category,
      stock: stock ?? 0,
      images: Array.isArray(images) ? images : [],
      sellerProvince: sellerProvince || "",
      status: "pending_review", // luôn chờ admin duyệt
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public — chỉ trả về sản phẩm đã được admin duyệt
exports.getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    const category =
      req.query.category && req.query.category !== "Tất cả"
        ? { category: req.query.category }
        : {};

    const criteria = { ...keyword, ...category, isDeleted: false, status: "approved" };

    const count = await Product.countDocuments(criteria);
    let query = Product.find(criteria).populate("seller", "name sellerInfo");

    if (req.query.sort === "price_asc") query = query.sort({ price: 1 });
    else if (req.query.sort === "price_desc") query = query.sort({ price: -1 });
    else if (req.query.sort === "popular") query = query.sort({ sold: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query.limit(pageSize).skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller xem toàn bộ sản phẩm của mình (mọi trạng thái)
exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.user._id;

    // Chỉ seller đó hoặc admin mới xem được
    if (
      req.user._id.toString() !== sellerId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const products = await Product.find({ seller: sellerId, isDeleted: false }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin — xem sản phẩm chờ duyệt
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "pending_review", isDeleted: false })
      .populate("seller", "name email sellerInfo")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin — xem tất cả sản phẩm (có lọc)
exports.getAllProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate("seller", "name email sellerInfo")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller", "name sellerInfo");
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền chỉnh sửa" });

    // Seller chỉnh sửa → đưa về pending_review để admin duyệt lại
    if (req.user.role !== "admin") {
      product.status = "pending_review";
      product.rejectedReason = "";
    }

    product.name = req.body.name ?? product.name;
    product.price = req.body.price ?? product.price;
    product.description = req.body.description ?? product.description;
    product.category = req.body.category ?? product.category;
    product.stock = req.body.stock ?? product.stock;
    product.images = Array.isArray(req.body.images) ? req.body.images : product.images;
    product.sellerProvince = req.body.sellerProvince ?? product.sellerProvince;

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền xóa" });

    product.isDeleted = true;
    await product.save();
    res.json({ message: "Đã xóa sản phẩm" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================== ADMIN — APPROVAL WORKFLOW ========================

// Admin duyệt sản phẩm
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    product.status = "approved";
    product.rejectedReason = "";
    const updated = await product.save();
    res.json({ message: "Đã duyệt sản phẩm.", product: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin từ chối sản phẩm
exports.rejectProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    product.status = "rejected";
    product.rejectedReason = req.body.reason || "Không đáp ứng tiêu chuẩn sản phẩm";
    const updated = await product.save();
    res.json({ message: "Đã từ chối sản phẩm.", product: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin gỡ sản phẩm vi phạm (đã duyệt nhưng sau đó phát hiện vi phạm)
exports.removeProduct = async (req, res) => {
  try {
    const { recordViolation } = require("./userController");
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    product.status = "removed";
    product.rejectedReason = req.body.reason || "Vi phạm quy định sàn";
    await product.save();

    // Ghi nhận vi phạm cho seller nếu được yêu cầu
    if (req.body.recordViolation) {
      const { recordSellerViolation } = require("./userController");
      await recordSellerViolation(product.seller, req.body.reason || "Sản phẩm vi phạm quy định", req.user._id);
    }

    res.json({ message: "Đã gỡ sản phẩm vi phạm." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Public — Lấy danh sách category hiện có
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isDeleted: false, status: "approved" });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
