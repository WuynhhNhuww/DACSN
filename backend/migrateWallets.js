require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./models/User");
const Wallet = require("./models/walletModel");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrateWallets = async () => {
  await connectDB();
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users. Checking wallets...`);

    let createdCount = 0;
    for (const user of users) {
      const existingWallet = await Wallet.findOne({ user: user._id });
      if (!existingWallet) {
        await Wallet.create({ user: user._id, balance: 0, frozenBalance: 0 });
        createdCount++;
      }
    }

    console.log(`Migration Complete. Created ${createdCount} new wallets.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
};

migrateWallets();
