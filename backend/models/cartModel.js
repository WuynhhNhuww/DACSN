const mongoose = require("mongoose");

// 🔥 Item trong giỏ hàng
const cartItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    // ✅ Snapshot nhẹ để giảm query khi hiển thị cart
    name: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true, // 🔥 Mỗi user chỉ có 1 cart
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);
// tăng quantity hoặc thêm item nếu chưa có
cartSchema.methods.addOrUpdateItem = async function (productId, { name, image, unitPrice, qty = 1 }) {
  const idx = this.items.findIndex(it => it.product.toString() === productId.toString());
  if (idx >= 0) {
    this.items[idx].quantity += qty;
    this.items[idx].unitPrice = unitPrice; // tùy chính sách
  } else {
    this.items.push({ product: productId, quantity: qty, name, image, unitPrice });
  }
  return this.save();
};
module.exports = mongoose.model("Cart", cartSchema);