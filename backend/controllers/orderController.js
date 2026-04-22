const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { createNotification } = require("./notificationController");
const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");
const Voucher = require("../models/voucherModel");
const moment = require("moment");
const qs = require("qs");
const axios = require("axios");
const { vnpaySortObject, buildSignData, createVnpaySignature, createMomoSignature } = require("../utils/payUtils");

const PromotionItem = require("../models/promotionItemModel");
const User = require("../models/User");
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

// --- helper: phân bổ doanh thu (90% seller, 10% admin) khi đơn hàng completed ---
const distributeOrderRevenue = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("orderItems.seller", "name sellerInfo")
      .populate("orderItems.product", "category")
      .populate("appliedVoucher")
      .populate("appliedFreeship");

    if (!order || order.isRevenueDistributed) return;

    const adminUser = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
    if (!adminUser) return;

    let adminWallet = await Wallet.findOne({ user: adminUser._id });
    if (!adminWallet) {
      adminWallet = await Wallet.create({ user: adminUser._id, balance: 0, frozenBalance: 0 });
    }

    // 1. Phí vận chuyển: Về Ví Admin (để Admin trả cho bên vận chuyển)
    if (order.shippingFee > 0) {
      adminWallet.balance += order.shippingFee;
      await adminWallet.save();
      await Transaction.create({
        wallet: adminWallet._id,
        amount: order.shippingFee,
        type: "SYSTEM_COMMISSION",
        status: "COMPLETED",
        referenceOrder: order._id,
        description: `Thu phí vận chuyển từ đơn hàng ${order._id}`,
      });
    }

    // 2. Xử lý Voucher Toàn sàn (Admin chịu phí)
    if (order.appliedVoucher && order.appliedVoucher.scope === "platform" && order.discountAmount > 0) {
      adminWallet.balance -= order.discountAmount;
      await adminWallet.save();
      await Transaction.create({
        wallet: adminWallet._id,
        amount: -order.discountAmount,
        type: "SYSTEM_COMMISSION",
        status: "COMPLETED",
        referenceOrder: order._id,
        description: `Chi trả Voucher Toàn sàn cho đơn hàng ${order._id}`,
      });
    }

    // 3. Xử lý Freeship (Admin chịu 50%, Shop chịu 50%)
    let freeshipDeductionForEachSeller = 0;
    if (order.appliedFreeship && order.shippingFee > 0) {
      const adminFreeshipShare = order.shippingFee * 0.5;
      adminWallet.balance -= adminFreeshipShare;
      await adminWallet.save();
      await Transaction.create({
        wallet: adminWallet._id,
        amount: -adminFreeshipShare,
        type: "SYSTEM_COMMISSION",
        status: "COMPLETED",
        referenceOrder: order._id,
        description: `Chi trả 50% phí Freeship cho đơn hàng ${order._id}`,
      });
      // 50% còn lại sẽ trừ vào doanh thu của các seller trong đơn
      freeshipDeductionForEachSeller = order.shippingFee * 0.5;
    }

    // 4. Phân bổ cho từng Seller
    for (const item of order.orderItems) {
      if (!item.seller) continue;

      const category = item.product?.category || "";
      const isHomeAppliance = category.match(/gia d[uụ]ng/i);
      const baseRate = isHomeAppliance ? 0.08 : 0.10;
      const isPremium = item.seller.sellerInfo?.isPremiumServiceRegistered || false;
      const premiumRate = isPremium ? 0.02 : 0;
      const totalCommissionRate = baseRate + premiumRate;

      // Tính doanh thu trước khi trừ phí Freeship/Voucher Shop
      let itemFinalLineTotal = item.lineTotal;
      let shopVoucherDeduction = 0;

      // Nếu là Voucher của Shop -> Trừ vào doanh thu của Shop đó
      if (order.appliedVoucher && order.appliedVoucher.scope === "shop" && order.appliedVoucher.sellerId?.toString() === item.seller._id.toString()) {
        shopVoucherDeduction = order.discountAmount;
        itemFinalLineTotal -= shopVoucherDeduction;
      }

      const adminCommission = Math.floor(itemFinalLineTotal * totalCommissionRate);
      let sellerRevenue = itemFinalLineTotal - adminCommission;

      // Trừ phí Freeship (tỷ lệ theo giá trị hàng của seller đó trong đơn)
      const sellerFreeshipShare = order.itemsPrice > 0 ? Math.floor((item.lineTotal / order.itemsPrice) * freeshipDeductionForEachSeller) : 0;
      sellerRevenue -= sellerFreeshipShare;

      const sellerShopName = item.seller.sellerInfo?.shopName || item.seller.name;

      // --- Cộng tiền cho Seller ---
      let sellerWallet = await Wallet.findOne({ user: item.seller._id });
      if (!sellerWallet) {
        sellerWallet = await Wallet.create({ user: item.seller._id, balance: 0, frozenBalance: 0 });
      }
      sellerWallet.balance += sellerRevenue;
      await sellerWallet.save();

      await Transaction.create({
        wallet: sellerWallet._id,
        amount: sellerRevenue,
        type: "SELLER_REVENUE",
        status: "COMPLETED",
        referenceOrder: order._id,
        description: `Doanh thu SP: ${item.name} (Đã trừ ${totalCommissionRate * 100}% phí sàn${shopVoucherDeduction ? `, trừ ${shopVoucherDeduction} Voucher Shop` : ""}${sellerFreeshipShare ? `, trừ ${sellerFreeshipShare} (50% Freeship)` : ""})`,
      });

      // --- Cộng tiền hoa hồng cho Admin ---
      adminWallet.balance += adminCommission;
      await adminWallet.save();

      await Transaction.create({
        wallet: adminWallet._id,
        amount: adminCommission,
        type: "SYSTEM_COMMISSION",
        status: "COMPLETED",
        referenceOrder: order._id,
        description: `Hoa hồng ${totalCommissionRate * 100}% từ shop ${sellerShopName} (SP: ${item.name})`,
      });
    }

    order.isRevenueDistributed = true;
    await order.save();
  } catch (error) {
    console.error("Lỗi phân bổ doanh thu:", error);
  }
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

    // 3.5) Xử lý Tiền bằng Ví (WALLET)
    if (paymentMethod === "WALLET") {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet || wallet.balance < totalPrice) {
        // rollback stock
        for (const d of deducted) {
          await Product.updateOne(
            { _id: d.productId },
            { $inc: { stock: d.qty, sold: -d.qty } }
          );
        }
        return res.status(400).json({ message: "Số dư Ví ShopeePay không đủ để thanh toán. Vui lòng nạp thêm!" });
      }
      
      // Trừ tiền
      wallet.balance -= totalPrice;
      await wallet.save();
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
      appliedVoucher: voucherId || null,
      appliedFreeship: freeshipId || null,
      isPaid: paymentMethod === "WALLET",
      paidAt: paymentMethod === "WALLET" ? new Date() : null,
      status: paymentMethod === "COD" ? "pending_confirmation" : (paymentMethod === "WALLET" ? "paid" : "pending_payment"),
    });

    // 4.1) Cập nhật trạng thái đã dùng của Voucher (để tránh lạm dụng và đếm lượt)
    if (voucherId) {
      await Voucher.updateOne(
        { _id: voucherId },
        { $inc: { usedCount: 1 }, $addToSet: { usedByUsers: req.user._id } }
      );
    }
    if (freeshipId) {
      await Voucher.updateOne(
        { _id: freeshipId },
        { $inc: { usedCount: 1 }, $addToSet: { usedByUsers: req.user._id } }
      );
    }

    // 4.5) Xử lý VNPay (VNPAY)
    let paymentUrl = "";
    if (paymentMethod === "VNPAY") {
      const tmnCode = process.env.VNP_TMN_CODE;
      const secretKey = process.env.VNP_HASH_SECRET;
      let vnpUrl = process.env.VNP_URL;

      const date = new Date();
      const createDate = moment(date).format("YYYYMMDDHHmmss");
      const subOrderId = order._id.toString();
      let ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";
      if (ipAddr.includes("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");
      if (ipAddr === "::1") ipAddr = "127.0.0.1";

      let vnp_Params = {};
      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = tmnCode;
      vnp_Params["vnp_Locale"] = "vn";
      vnp_Params["vnp_CurrCode"] = "VND";
      vnp_Params["vnp_TxnRef"] = subOrderId;
      vnp_Params["vnp_OrderInfo"] = "Thanh toan don hang " + subOrderId.slice(-8);
      vnp_Params["vnp_OrderType"] = "other";
      vnp_Params["vnp_Amount"] = Math.floor(totalPrice * 100);
      vnp_Params["vnp_ReturnUrl"] = process.env.VNP_RETURN_URL_ORDER;
      vnp_Params["vnp_IpAddr"] = ipAddr;
      vnp_Params["vnp_CreateDate"] = createDate;

      // ✅ SIGNING
      const sorted = vnpaySortObject(vnp_Params);
      const signData = buildSignData(sorted);
      const secureHash = createVnpaySignature(secretKey, signData);

      sorted["vnp_SecureHash"] = secureHash;
      vnpUrl += "?" + buildSignData(sorted);
      paymentUrl = vnpUrl;
    }

    // 4.6) Xử lý MoMo (MOMO)
    if (paymentMethod === "MOMO") {
      const partnerCode = process.env.MOMO_PARTNER_CODE;
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const requestId = partnerCode + new Date().getTime();
      const orderId = order._id.toString();
      const orderInfo = `Thanh toán qua MoMo cho đơn hàng #${orderId.slice(-8).toUpperCase()}`;
      const redirectUrl = "http://localhost:3000/buyer/orders/momo-return";
      const ipnUrl = "http://localhost:3000/buyer/orders/momo-return"; // IPN thường dùng server endpoint riêng, tạm demo
      const amount = totalPrice.toString();
      const requestType = "captureWallet";
      const extraData = ""; // pass extra data if needed

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
      const signature = createMomoSignature(secretKey, rawSignature);

      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount: Number(amount),
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: "vi",
      };

      try {
        const momoRes = await axios.post(process.env.MOMO_ENDPOINT, requestBody);
        if (momoRes.data && momoRes.data.payUrl) {
          paymentUrl = momoRes.data.payUrl;
        }
      } catch (err) {
        console.error("MoMo Error:", err.response?.data || err.message);
        // Có thể rollback order nếu muốn, hoặc để trạng thái pending_payment
      }
    }

    if (paymentMethod === "WALLET") {
      const walletDoc = await Wallet.findOne({ user: req.user._id });
      await Transaction.create({
        wallet: walletDoc._id,
        amount: totalPrice,
        type: "ORDER_PAYMENT",
        status: "COMPLETED",
        referenceOrder: order._id,
        description: `Thanh toán cho đơn hàng #${order._id.toString().slice(-8).toUpperCase()}`,
      });
    }
    
    // 5) Chỉ xóa các item đã đặt khỏi giỏ hàng
    // Nếu là VNPAY hoặc MOMO, ta tạm HOÃN xóa giỏ hàng cho đến khi thanh toán thành công (vnpay-verify/momo-verify)
    // Giúp user dễ dàng test lại flow nếu gặp lỗi kỹ thuật hoặc ký tự
    if (paymentMethod !== "VNPAY" && paymentMethod !== "MOMO") {
      const processedProductIds = itemsToProcess.map(it => it.product._id.toString());
      cart.items = cart.items.filter(it => !processedProductIds.includes(it.product?._id?.toString()));
      await cart.save();
    }

    // 6) Gửi thông báo cho người mua
    await createNotification({
      user: req.user._id,
      type: "order_placed",
      title: "Đặt hàng thành công! 🎉",
      message: `Đơn hàng #${order._id.toString().slice(-8).toUpperCase()} đã được đặt thành công. Tổng tiền: ₫${totalPrice.toLocaleString("vi-VN")}`,
      link: `/buyer/orders/${order._id}`,
    });

    return res.status(201).json({ ...order.toObject(), paymentUrl });
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

exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ "orderItems.seller": req.user._id })
      .populate("orderItems.product")
      .populate("orderItems.seller", "name sellerInfo")
      .sort({ createdAt: -1 });

    // Lọc data: chỉ trả về các orderItems thuộc về mảng của seller này, 
    // Tuy nhiên, vì toàn bộ đơn hàng được hiển thị cùng 1 mã đơn nguyên khối nên thường giữ nguyên
    // nhưng để tối ưu, ta có thể lọc (optional). Ở đây trả list nguyên mẫu là đủ.
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

    if (status === "completed") {
      await distributeOrderRevenue(order._id);
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

exports.confirmReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized. Only buyer can confirm receipt." });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Chỉ có thể xác nhận đã nhận hàng khi trạng thái là Đã Giao." });
    }

    order.status = "completed";
    order.confirmReceived = true;
    order.confirmedReceivedAt = new Date();
    await order.save();

    await distributeOrderRevenue(order._id);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Xác nhận thanh toán VNPay cho Đơn hàng
 * @route   GET /api/orders/vnpay/vnpay-verify
 */
exports.verifyOrderVnpayPayment = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secretKey = process.env.VNP_HASH_SECRET;
    const { verifyVnpaySignature } = require("../utils/payUtils");
    const isVerified = verifyVnpaySignature(secretKey, vnp_Params);

    const frontendUrl = "http://localhost:3000/buyer/orders/vnpay-return";
    const queryStr = qs.stringify(req.query);

    if (isVerified) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const order = await Order.findById(orderId);

      if (!order) {
        return res.redirect(`${frontendUrl}?${queryStr}&message=Không tìm thấy đơn hàng`);
      }

      if (vnp_Params["vnp_ResponseCode"] === "00") {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "paid";
        await order.save();

        const cart = await Cart.findOne({ user: order.buyer });
        if (cart) {
          const itemIdsInOrder = order.orderItems.map(it => it.product.toString());
          cart.items = cart.items.filter(it => !itemIdsInOrder.includes(it.product?.toString()));
          await cart.save();
        }

        await createNotification({
          user: order.buyer,
          type: "order_paid",
          title: "Thanh toán thành công! 💳",
          message: `Đơn hàng #${order._id.toString().slice(-8).toUpperCase()} đã được thanh toán qua VNPay.`,
          link: `/buyer/orders/${order._id}`,
        });

        return res.redirect(`${frontendUrl}?${queryStr}&orderId=${order._id}`);
      }
      return res.redirect(`${frontendUrl}?${queryStr}&message=Giao dịch thất bại`);
    } else {
      return res.redirect(`${frontendUrl}?${queryStr}&message=Sai chữ ký bảo mật`);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Tạo lại URL thanh toán cho đơn hàng đang chờ
 * @route   POST /api/orders/:id/vnpay-create
 */
exports.createVnpayPaymentForExistingOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (order.status !== "pending_payment" || order.isPaid) {
      return res.status(400).json({ message: "Đơn hàng này không ở trạng thái chờ thanh toán" });
    }

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL_ORDER;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const subOrderId = order._id.toString();
    const ipAddr = "127.0.0.1";

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = subOrderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan don hang " + subOrderId.slice(-8);
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = Math.floor(order.totalPrice * 100);
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    // ✅ SIGNING
    const sorted = vnpaySortObject(vnp_Params);
    const signData = buildSignData(sorted);
    const secureHash = createVnpaySignature(secretKey, signData);

    sorted["vnp_SecureHash"] = secureHash;
    vnpUrl += "?" + buildSignData(sorted);

    res.status(200).json({ paymentUrl: vnpUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Xác thực thanh toán MoMo cho Order
 * @route   GET /api/orders/momo/momo-verify
 */
exports.verifyOrderMomoPayment = async (req, res) => {
  try {
    const { orderId, resultCode, message, signature: momoSignature } = req.query;
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    
    // Kiểm tra chữ ký ngược (Check checksum)
    // Tùy theo doc MoMo, tham số callback có các trường nhất định
    // Ví dụ cơ bản: accessKey=[value]&amount=[value]&extraData=[value]&message=[value]&orderId=[value]&orderInfo=[value]&partnerCode=[value]&requestId=[value]&requestType=[value]&resultCode=[value]&transId=[value]
    // Ở đây ta đơn giản hóa theo logic sandbox phổ biến
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (resultCode == "0") {
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = "paid";
      await order.save();

      // [MỚI] Xóa giỏ hàng khi thanh toán MoMo thành công
      const cart = await Cart.findOne({ user: order.buyer });
      if (cart) {
        const itemIdsInOrder = order.orderItems.map(it => it.product.toString());
        cart.items = cart.items.filter(it => !itemIdsInOrder.includes(it.product?.toString()));
        await cart.save();
      }

      await createNotification({
        user: order.buyer,
        type: "order_paid",
        title: "Thanh toán MoMo thành công! 📱",
        message: `Đơn hàng #${order._id.toString().slice(-8).toUpperCase()} đã được thanh toán qua MoMo.`,
        link: `/buyer/orders/${order._id}`,
      });

      return res.status(200).json({ message: "Thanh toán MoMo thành công", orderId: order._id });
    } else {
      return res.status(400).json({ message: message || "Thanh toán MoMo thất bại", resultCode });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Tạo lại URL thanh toán MoMo cho đơn hàng đang chờ
 * @route   POST /api/orders/:id/momo-create
 */
exports.createMomoPaymentForExistingOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (order.status !== "pending_payment" || order.isPaid) {
      return res.status(400).json({ message: "Đơn hàng không ở trạng thái chờ thanh toán" });
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderId = order._id.toString();
    const orderInfo = `Thanh toán qua MoMo cho đơn hàng #${orderId.slice(-8).toUpperCase()}`;
    const redirectUrl = "http://localhost:3000/buyer/orders/momo-return";
    const ipnUrl = "http://localhost:3000/buyer/orders/momo-return";
    const amount = order.totalPrice.toString();
    const requestType = "captureWallet";
    const extraData = "";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = createMomoSignature(secretKey, rawSignature);

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    const momoRes = await axios.post(process.env.MOMO_ENDPOINT, requestBody);
    if (momoRes.data && momoRes.data.payUrl) {
      res.status(200).json({ paymentUrl: momoRes.data.payUrl });
    } else {
      res.status(400).json({ message: "Không thể tạo liên kết MoMo", details: momoRes.data });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};