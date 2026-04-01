require("dotenv").config();
const mongoose = require("mongoose");

// Models
const Product = require("./models/productModel");
const User = require("./models/User");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        // Ensure there is a seller to own the products
        let seller = await User.findOne({ role: "seller" });
        if (!seller) {
            console.log("No seller found. Creating a generic dummy seller...");
            seller = await User.create({
                name: "Dummy Shop",
                email: "dummy_shop@shopee.vn",
                password: "password", // You might want to hash this in a real scenario, but dummy is fine
                role: "seller",
                sellerInfo: {
                    shopName: "DummyJSON Official Store",
                    sellerStatus: "active",
                    isApproved: true,
                }
            });
            console.log("Created dummy seller:", seller.email);
        } else {
            console.log("Using existing seller for dummy products:", seller.email);
        }

        console.log("Fetching products from DummyJSON...");
        const response = await fetch("https://dummyjson.com/products?limit=0");
        const data = await response.json();
        const dummyProducts = data.products;

        console.log(`Found ${dummyProducts.length} products to insert.`);

        // Map DummyJSON to our Product Schema
        const productsToInsert = dummyProducts.map((dp) => ({
            seller: seller._id,
            name: dp.title,
            description: dp.description,
            category: dp.category || "Khác",
            sellerProvince: "Hà Nội",
            images: dp.images && dp.images.length > 0 ? dp.images : [dp.thumbnail],
            price: Math.round(dp.price * 25000), // Convert roughly to VND
            stock: dp.stock || 100,
            sold: Math.floor(Math.random() * 1000),
            ratingAvg: dp.rating || 5,
            ratingCount: Math.floor(Math.random() * 200) + 10,
            status: "approved", // auto approved for dummy data
        }));

        console.log("Clearing existing dummy products? No, just appending.");
        // If we wanted to clear, we could delete products with a specific marker, but appending is safer.

        await Product.insertMany(productsToInsert);

        console.log("Data Imported Successfully!");
        process.exit();
    } catch (error) {
        console.error(`Error importing data: ${error.message}`);
        process.exit(1);
    }
};

importData();
