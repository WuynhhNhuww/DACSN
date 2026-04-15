const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/orderModel');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopee-mini';

mongoose.connect(mongoUri)
  .then(async () => {
    const orders = await Order.find({}, 'status totalPrice createdAt').lean();
    console.log(JSON.stringify(orders, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
