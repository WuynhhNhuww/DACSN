const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");
const moment = require("moment");
const qs = require("qs");
const { vnpaySortObject, buildSignData, createVnpaySignature } = require("../utils/payUtils");

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

    res.json({ wallet, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Tạo URL thanh toán VNPay (Nạp tiền) — tối thiểu 10.000 VNĐ
 * @route   POST /api/wallets/vnpay-create
 */
const createVnpayPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) < 10000) {
      return res.status(400).json({ message: "Số tiền nạp tối thiểu là 10.000 VNĐ" });
    }

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");
    // TxnRef phân loại: DEP = Deposit
    const orderId = `${req.user._id}_DEP_${Date.now()}`;

    let vnp_Params = {};
    vnp_Params["vnp_Version"]   = "2.1.0";
    vnp_Params["vnp_Command"]   = "pay";
    vnp_Params["vnp_TmnCode"]   = tmnCode;
    vnp_Params["vnp_Locale"]    = "vn";
    vnp_Params["vnp_CurrCode"]  = "VND";
    vnp_Params["vnp_TxnRef"]    = orderId;
    vnp_Params["vnp_OrderInfo"] = "Nap tien vi Shopee Mini " + Number(amount);
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"]    = Number(amount) * 100;
    vnp_Params["vnp_ReturnUrl"] = process.env.VNP_RETURN_URL_WALLET;
    vnp_Params["vnp_IpAddr"]    = "127.0.0.1";
    vnp_Params["vnp_CreateDate"]= createDate;

    const sorted    = vnpaySortObject(vnp_Params);
    const signData  = buildSignData(sorted);
    const secureHash= createVnpaySignature(secretKey, signData);

    sorted["vnp_SecureHash"] = secureHash;
    vnpUrl += "?" + buildSignData(sorted);

    res.status(200).json({ paymentUrl: vnpUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Tạo URL rút tiền qua VNPay — tối thiểu 50.000 VNĐ
 * @route   POST /api/wallets/vnpay-withdraw
 */
const createVnpayWithdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    if (!amount || numAmount < 50000) {
      return res.status(400).json({ message: "Số tiền rút tối thiểu là 50.000 VNĐ" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Không tìm thấy ví" });
    if (wallet.balance < numAmount) {
      return res.status(400).json({ message: "Số dư không đủ để thực hiện giao dịch" });
    }

    const tmnCode  = process.env.VNP_TMN_CODE;
    const secretKey= process.env.VNP_HASH_SECRET;
    let vnpUrl     = process.env.VNP_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");
    // TxnRef phân loại: WIT = Withdraw
    const orderId = `${req.user._id}_WIT_${Date.now()}`;

    let vnp_Params = {};
    vnp_Params["vnp_Version"]   = "2.1.0";
    vnp_Params["vnp_Command"]   = "pay";
    vnp_Params["vnp_TmnCode"]   = tmnCode;
    vnp_Params["vnp_Locale"]    = "vn";
    vnp_Params["vnp_CurrCode"]  = "VND";
    vnp_Params["vnp_TxnRef"]    = orderId;
    vnp_Params["vnp_OrderInfo"] = "Rut tien vi Shopee Mini " + numAmount;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"]    = numAmount * 100;
    vnp_Params["vnp_ReturnUrl"] = process.env.VNP_RETURN_URL_WALLET;
    vnp_Params["vnp_IpAddr"]    = "127.0.0.1";
    vnp_Params["vnp_CreateDate"]= createDate;

    const sorted    = vnpaySortObject(vnp_Params);
    const signData  = buildSignData(sorted);
    const secureHash= createVnpaySignature(secretKey, signData);

    sorted["vnp_SecureHash"] = secureHash;
    vnpUrl += "?" + buildSignData(sorted);

    res.status(200).json({ paymentUrl: vnpUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Xác nhận VNPay callback — xử lý cả Nạp (DEP) và Rút (WIT)
 * @route   GET /api/wallets/vnpay-verify
 */
const verifyVnpayPayment = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secretKey  = process.env.VNP_HASH_SECRET;
    const { verifyVnpaySignature } = require("../utils/payUtils");
    const isVerified  = verifyVnpaySignature(secretKey, vnp_Params);

    const frontendUrl = "http://localhost:3000/buyer/wallet/vnpay-return";
    const queryStr    = qs.stringify(req.query);

    if (!isVerified) {
      return res.redirect(`${frontendUrl}?${queryStr}&message=Sai chu ky bao mat`);
    }

    if (vnp_Params["vnp_ResponseCode"] !== "00") {
      return res.redirect(`${frontendUrl}?${queryStr}&message=Giao dich that bai`);
    }

    const amount  = Number(vnp_Params["vnp_Amount"]) / 100;
    const txnRef  = vnp_Params["vnp_TxnRef"];
    const parts   = txnRef.split("_");
    const userId  = parts[0];
    const txnType = parts[1]; // "DEP" | "WIT"

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.redirect(`${frontendUrl}?${queryStr}&message=Khong tim thay vi`);
    }

    if (txnType === "WIT") {
      // Rút tiền: trừ số dư
      if (wallet.balance < amount) {
        return res.redirect(`${frontendUrl}?${queryStr}&message=So du khong du`);
      }
      wallet.balance -= amount;
      await wallet.save();
      await Transaction.create({
        wallet: wallet._id,
        amount,
        type: "WITHDRAW",
        status: "COMPLETED",
        description: "Rút tiền về ngân hàng qua VNPay",
      });
    } else {
      // Nạp tiền: cộng số dư
      wallet.balance += amount;
      await wallet.save();
      await Transaction.create({
        wallet: wallet._id,
        amount,
        type: "DEPOSIT",
        status: "COMPLETED",
        description: "Nạp tiền qua VNPay",
      });
    }

    return res.redirect(`${frontendUrl}?${queryStr}`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Giữ lại simulation endpoints cho backward compatibility
const depositToWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (Number(amount) < 10000) {
      return res.status(400).json({ message: "Số tiền nạp tối thiểu là 10.000 VNĐ" });
    }
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Không tìm thấy ví" });

    wallet.balance += Number(amount);
    await wallet.save();

    await Transaction.create({
      wallet: wallet._id,
      amount: Number(amount),
      type: "DEPOSIT",
      status: "COMPLETED",
      description: description || "Nạp tiền",
    });

    res.status(200).json({ message: "Nạp tiền thành công", wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const withdrawFromWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (Number(amount) < 50000) {
      return res.status(400).json({ message: "Số tiền rút tối thiểu là 50.000 VNĐ" });
    }
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
  createVnpayWithdraw,
  verifyVnpayPayment,
};
