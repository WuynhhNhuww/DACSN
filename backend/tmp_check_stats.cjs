const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/orderModel');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopee-mini';

mongoose.connect(mongoUri)
  .then(async () => {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
