const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/.env" });
const Banner = require("./backend/models/bannerModel");

async function checkBanners() {
  await mongoose.connect(process.env.MONGO_URI);
  const active = await Banner.find({ status: "active" });
  console.log("Active Banners Count:", active.length);
  active.forEach(b => {
    console.log(`- Title: ${b.title}, Pos: ${b.position}, Start: ${b.startDate}, End: ${b.endDate}`);
  });
  
  const now = new Date();
  const queryActive = await Banner.find({
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  console.log("Query Active Banners Count (with date):", queryActive.length);
  
  process.exit();
}

checkBanners();
