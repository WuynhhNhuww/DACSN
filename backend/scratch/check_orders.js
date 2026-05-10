const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Order = require("../models/orderModel");

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const stats = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log("Order Stats:", stats);

        const delivered = await Order.find({ status: "delivered" }).limit(5);
        console.log("Delivered Orders Sample:", JSON.stringify(delivered, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("DB Script Error:", error);
        process.exit(1);
    }
};

checkOrders();
