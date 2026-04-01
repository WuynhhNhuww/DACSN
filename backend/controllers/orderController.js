const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { createNotification } = require("./notificationController");

const PromotionItem = require("../models/promotionItemModel");
// const Promotion = require("../models/promotionModel"); // không cần require trực tiếp vì populate

// --- helper: tính giá cuối cùng cho 1 product tại thời điểm now ---
// Rule ưu tiên: Promotion active -> Product.discount -> Product.price
const getFinalPriceForProduct = async (productDoc) => {
  const now = new Date();

  // 1) check PromotionItem active cho product
  const promoItems = await PromotionItem.find({
    product: productDoc._id,
    isActive: true,
  }).populate("promotion");

  // lọc promotion hợp lệ theo thời gian + isActive + maxQuantity
  const validPromoItems = promoItems.filter((pi) => {
    const promo = pi.promotion;
    if (!promo) return false;
    if (!promo.isActive) return false;

    if (promo.startTime && now < new Date(promo.startTime)) return false;
    if (promo.endTime && now > new Date(promo.endTime)) return false;

    if (pi.maxQuantity !== null && pi.maxQuantity !== undefined) {
      if (pi.soldQuantity >= pi.maxQuantity) return false;
    }
    return true;
  });

  // chọn promo theo priority cao nhất (nếu bằng nhau thì chọn cái giảm nhiều hơn)
  if (validPromoItems.length > 0) {
    validPromoItems.sort((a, b) => {
      const pa = a.promotion?.priority || 0;
      const pb = b.promotion?.priority || 0;
      if (pb !== pa) return pb - pa;

      // nếu priority bằng nhau: chọn final price thấp hơn
      const fa = calcPriceWithPromotion(productDoc.price, a.promotion);
      const fb = calcPriceWithPromotion(productDoc.price, b.promotion);
      return fa - fb;
    });

    const chosen = validPromoItems[0];
    const final = calcPriceWithPromotion(productDoc.price, chosen.promotion);

    return {
      finalPrice: final,
      promotionItemId: chosen._id, // để tăng soldQuantity nếu cần
    };
  }

  // 2) fallback Product.discount (đúng virtual finalPrice bạn đang có)
  // productDoc.finalPrice có virtual -> nhưng chỉ tồn tại nếu toObject/toJSON,
  // nên ta tự tính lại bằng discount để chắc chắn.
  const finalByDiscount = calcPriceWithProductDiscount(productDoc);
  return { finalPrice: finalByDiscount, promotionItemId: null };
};

const calcPriceWithPromotion = (basePrice, promotion) => {
  if (!promotion) return basePrice;
  if (promotion.type === "percentage") {
    return Math.max(0, basePrice - (basePrice * promotion.value) / 100);
  }
  if (promotion.type === "fixed") {
    return Math.max(0, basePrice - promotion.value);
  }
  return basePrice;
};

const calcPriceWithProductDiscount = (productDoc) => {
  const d = productDoc.discount;
  if (!d || !d.isActive) return productDoc.price;

  const now = new Date();
  if (d.startTime && now < new Date(d.startTime)) return productDoc.price;
  if (d.endTime && now > new Date(d.endTime)) return productDoc.price;

  if (d.type === "percentage") {
    return Math.max(0, productDoc.price - (productDoc.price * d.value) / 100);
  }
  if (d.type === "fixed") {
    return Math.max(0, productDoc.price - d.value);
  }
  return productDoc.price;
};

// --- CREATE ORDER ---
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, shippingFee = 0, discountAmount = 0, paymentMethod = "COD", items: selectedItemsFromReq } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "shippingAddress is required" });
    }

    // Xử lý địa chỉ linh hoạt: Nếu là string (cũ) thì gán vào detail, các trường khác để trống tránh lỗi validation
    let finalAddress = shippingAddress;
    if (typeof shippingAddress === "string") {
      finalAddress = {
        fullName: req.user.name,
        phone: "N/A",
        province: "N/A",
        district: "N/A",
        ward: "N/A",
        detail: shippingAddress
      };
    } else {
      // Đảm bảo đủ các trường bắt buộc để không lỗi Schema
      finalAddress = {
        fullName: shippingAddress.fullName || req.user.name,
        phone: shippingAddress.phone || "N/A",
        province: shippingAddress.province || "N/A",
        district: shippingAddress.district || "N/A",
        ward: shippingAddress.ward || "N/A",
        detail: shippingAddress.detail || shippingAddress.address || "N/A"
      };
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Lọc ra các item thực sự muốn đặt (dựa trên productId gửi lên)
    let itemsToProcess = [];
    if (Array.isArray(selectedItemsFromReq) && selectedItemsFromReq.length > 0) {
      const selectedIds = selectedItemsFromReq.map(x => (x.id || x.product || x).toString());
      itemsToProcess = cart.items.filter(it => selectedIds.includes(it.product?._id?.toString()));
    } else {
      // Fallback: Nếu không gửi list thì mặc định đặt hết (logic cũ)
      itemsToProcess = cart.items;
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ message: "No selected items found in cart" });
    }

    // 1) Tính giá từng item (áp promotion/discount)
    const computedItems = [];
    for (const item of itemsToProcess) {
      const p = item.product;
      if (!p || p.isDeleted || p.status !== "approved") {
        return res.status(400).json({ message: "Some products are not available" });
      }

      const { finalPrice, promotionItemId } = await getFinalPriceForProduct(p);

      // image: lấy ảnh đầu tiên từ images[]
      const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "";

      computedItems.push({
        productId: p._id,
        sellerId: p.seller,
        name: p.name,
        image,
        unitPrice: finalPrice,
        qty: item.quantity,
        lineTotal: finalPrice * item.quantity,
        promotionItemId, // để update soldQuantity nếu có
      });
    }

    const itemsPrice = computedItems.reduce((acc, it) => acc + it.lineTotal, 0);
    const totalPrice = Math.max(0, itemsPrice + Number(shippingFee) - Number(discountAmount));

    // 2) Trừ kho (atomic). Nếu fail giữa chừng -> rollback cái đã trừ.
    const deducted = [];
    for (const it of computedItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: it.productId, stock: { $gte: it.qty }, isDeleted: false },
        { $inc: { stock: -it.qty, sold: it.qty } },
        { new: true }
      );

      if (!updated) {
        // rollback các sản phẩm đã trừ
        for (const d of deducted) {
          await Product.updateOne(
            { _id: d.productId },
            { $inc: { stock: d.qty, sold: -d.qty } }
          );
        }
        return res.status(400).json({ message: "Not enough stock for some products" });
      }

      deducted.push({ productId: it.productId, qty: it.qty });
    }

    // 3) Nếu item dùng PromotionItem có maxQuantity -> tăng soldQuantity (atomic)
    // Nếu fail (hết slot) -> rollback stock và báo lỗi
    for (const it of computedItems) {
      if (!it.promotionItemId) continue;

      const promoItem = await PromotionItem.findById(it.promotionItemId);
      if (!promoItem) continue;

      // nếu có giới hạn số lượng
      if (promoItem.maxQuantity !== null && promoItem.maxQuantity !== undefined) {
        const ok = await PromotionItem.findOneAndUpdate(
          {
            _id: it.promotionItemId,
            isActive: true,
            $expr: { $lt: ["$soldQuantity", "$maxQuantity"] },
          },
          { $inc: { soldQuantity: it.qty } },
          { new: true }
        );

        if (!ok) {
          // rollback stock
          for (const d of deducted) {
            await Product.updateOne(
              { _id: d.productId },
              { $inc: { stock: d.qty, sold: -d.qty } }
            );
          }
          return res.status(400).json({ message: "Promotion sold out for some products" });
        }
      } else {
        // không giới hạn -> vẫn tăng để thống kê (optional)
        await PromotionItem.updateOne({ _id: it.promotionItemId }, { $inc: { soldQuantity: it.qty } });
      }
    }

    // 4) Tạo order đúng schema hiện tại của bạn
    const order = await Order.create({
      buyer: req.user._id,

      orderItems: computedItems.map((it) => ({
        product: it.productId,
        seller: it.sellerId,
        name: it.name,
        image: it.image,
        unitPrice: it.unitPrice,
        qty: it.qty,
        lineTotal: it.lineTotal,
      })),

      shippingAddress: finalAddress,

      itemsPrice,
      shippingFee,
      discountAmount,
      totalPrice,

      paymentMethod,
      status: paymentMethod === "COD" ? "pending_confirmation" : "pending_payment",
    });

    // 5) Chỉ xóa các item đã đặt khỏi giỏ hàng
    const processedProductIds = itemsToProcess.map(it => it.product._id.toString());
    cart.items = cart.items.filter(it => !processedProductIds.includes(it.product?._id?.toString()));
    await cart.save();

    // 6) Gửi thông báo cho người mua
    await createNotification({
      user: req.user._id,
      type: "order_placed",
      title: "Đặt hàng thành công! 🎉",
      message: `Đơn hàng #${order._id.toString().slice(-8).toUpperCase()} đã được đặt thành công. Tổng tiền: ₫${totalPrice.toLocaleString("vi-VN")}`,
      link: `/buyer/orders/${order._id}`,
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("orderItems.product")
      .populate("orderItems.seller", "name sellerInfo")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("orderItems.product")
      .populate("orderItems.seller", "name sellerInfo");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // chỉ buyer của đơn đó hoặc seller/admin mới đc xem
    const isSellerInOrder = order.orderItems.some(
      (item) => item.seller?._id?.toString() === req.user._id.toString()
    );

    if (
      order.buyer.toString() !== req.user._id.toString() &&
      !isSellerInOrder &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const allowed = [
      "pending_payment",
      "paid",
      "confirmed",
      "shipping",
      "delivered",
      "completed",
      "cancelled",
      "delivery_failed",
    ];

    const { status } = req.body;
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // seller có trong đơn?
    const isSellerInOrder = order.orderItems.some(
      (item) => item.seller.toString() === req.user._id.toString()
    );

    if (!isSellerInOrder && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = status;
    await order.save();

    // Gửi thông báo cho người mua khi trạng thái thay đổi
    const statusMessages = {
      confirmed: { title: "Đơn hàng đã xác nhận ✅", msg: "Người bán đã xác nhận đơn hàng của bạn." },
      shipping: { title: "Đơn hàng đang giao 🚚", msg: "Đơn hàng của bạn đang trên đường giao." },
      delivered: { title: "Đã giao hàng 📦", msg: "Đơn hàng đã được giao. Hãy xác nhận nếu bạn đã nhận." },
      completed: { title: "Hoàn thành đơn hàng ⭐", msg: "Đơn hàng hoàn tất! Cảm ơn bạn đã mua sắm." },
      cancelled: { title: "Đơn hàng bị hủy ❌", msg: "Đơn hàng của bạn đã bị hủy." },
    };
    if (statusMessages[status]) {
      await createNotification({
        user: order.buyer,
        type: `order_${status === "completed" ? "delivered" : status}`,
        title: statusMessages[status].title,
        message: statusMessages[status].msg,
        link: `/buyer/orders/${order._id}`,
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Chỉ buyer mới được tự hủy
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!["pending_payment", "pending_confirmation"].includes(order.status)) {
      return res.status(400).json({ message: "Chỉ có thể hủy đơn hàng đang chờ xác nhận hoặc thanh toán." });
    }

    order.status = "cancelled";
    await order.save();

    // Hoàn lại stock và trừ sold
    for (const item of order.orderItems) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.qty, sold: -item.qty } }
      );
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};