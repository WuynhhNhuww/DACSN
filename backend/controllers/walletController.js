const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");
const moment = require("moment");
const qs = require("qs");
const { vnpaySortObject, buildSignData, createVnpaySignature, createMomoSignature } = require("../utils/payUtils");

// @desc    Lấy thông tin ví và lịch sử giao dịch
const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: "Không tìm thấy ví cho tài khoản này" });
    }

    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      wallet,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Tạo URL thanh toán VNPay
 * @route   POST /api/wallets/vnpay-create
 */
const createVnpayPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10000) {
      return res.status(400).json({ message: "Số tiền tối thiểu là 10.000 VNĐ" });
    }

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    // ✅ FIX: TxnRef phải chứa userId
    const orderId = `${req.user._id}_${Date.now()}`;

    // ✅ FIX: IP cứng để tránh lỗi sandbox
    const ipAddr = "127.0.0.1";

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Nap tien vi Shopee Mini " + amount; // Bỏ dấu tiếng Việt để an toàn
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = process.env.VNP_RETURN_URL_WALLET; // URL Server
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    // ✅ SIGNING
    const sorted = vnpaySortObject(vnp_Params);
    const signData = buildSignData(sorted);
    const secureHash = createVnpaySignature(secretKey, signData);

    sorted["vnp_SecureHash"] = secureHash;
    vnpUrl += "?" + buildSignData(sorted); // Dùng chính chuỗi đã encode+sort cho URL

    res.status(200).json({ paymentUrl: vnpUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Xác nhận thanh toán VNPay (IPN/Return)
 * @route   GET /api/wallets/vnpay-verify
 */
const verifyVnpayPayment = async (req, res) => {
  try {
    const vnp_Params = { ...req.query }; // ✅ clone
    const secretKey = process.env.VNP_HASH_SECRET;
    const { verifyVnpaySignature } = require("../utils/payUtils");
    const isVerified = verifyVnpaySignature(secretKey, vnp_Params);

    const frontendUrl = "http://localhost:3000/buyer/wallet/vnpay-return";
    const queryStr = qs.stringify(req.query);

    if (isVerified) {
      if (vnp_Params["vnp_ResponseCode"] === "00") {
        const amount = Number(vnp_Params["vnp_Amount"]) / 100;
        const txnRef = vnp_Params["vnp_TxnRef"];
        const userId = txnRef.split("_")[0];

        const wallet = await Wallet.findOne({ user: userId });
        if (wallet) {
          wallet.balance += amount;
          await wallet.save();

          await Transaction.create({
            wallet: wallet._id,
            amount,
            type: "DEPOSIT",
            status: "COMPLETED",
            description: "Nạp tiền qua VNPay",
          });

          return res.redirect(`${frontendUrl}?${queryStr}`);
        }
      }
      return res.redirect(`${frontendUrl}?${queryStr}&message=Giao dịch thất bại`);
    } else {
      return res.redirect(`${frontendUrl}?${queryStr}&message=Sai chữ ký bảo mật`);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ... giữ lại nạp tiền mô phỏng cũ để dự phòng
const depositToWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Không tìm thấy ví" });

    wallet.balance += Number(amount);
    await wallet.save();

    await Transaction.create({
      wallet: wallet._id,
      amount: Number(amount),
      type: "DEPOSIT",
      status: "COMPLETED",
      description: description || "Nạp tiền mô phỏng",
    });

    res.status(200).json({ message: "Nạp tiền thành công", wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const withdrawFromWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Không tìm thấy ví" });

    if (wallet.balance < amount) return res.status(400).json({ message: "Số dư không đủ" });

    wallet.balance -= Number(amount);
    await wallet.save();

    await Transaction.create({
      wallet: wallet._id,
      amount: Number(amount),
      type: "WITHDRAW",
      status: "COMPLETED",
      description: description || "Rút tiền về ngân hàng",
    });

    res.status(200).json({ message: "Rút tiền thành công", wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWallet,
  depositToWallet,
  withdrawFromWallet,
  createVnpayPayment,
  verifyVnpayPayment
};
