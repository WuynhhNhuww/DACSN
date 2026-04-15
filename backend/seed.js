const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Product = require("./models/productModel");

dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopee-mini";
        await mongoose.connect(uri);
        console.log("MongoDB connected for Seeder");
    } catch (error) {
        console.error("DB Connection Error: ", error);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        // 1. Xóa dữ liệu cũ
        await Product.deleteMany();
        await User.deleteMany();
        console.log("Đã xóa dữ liệu cũ...");

        // 2. Tạo Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        const createdUsers = await User.create([
            {
                name: "Admin WNP",
                email: "admin@wnp.vn",
                password: hashedPassword,
                role: "admin",
            },
            {
                name: "Shop WNP Official",
                email: "seller@wnp.vn",
                password: hashedPassword,
                role: "seller",
                sellerInfo: {
                    shopName: "WNP Official Store",
                    shopDescription: "Cửa hàng thời trang & công nghệ chính hãng WNP",
                    isApproved: true,
                    approvedAt: new Date()
                }
            },
            {
                name: "Shop TechZone",
                email: "techzone@wnp.vn",
                password: hashedPassword,
                role: "seller",
                sellerInfo: {
                    shopName: "TechZone VN",
                    shopDescription: "Linh kiện, thiết bị điện tử chính hãng",
                    isApproved: true,
                    approvedAt: new Date()
                }
            },
            {
                name: "Shop Fashion Hub",
                email: "fashion@wnp.vn",
                password: hashedPassword,
                role: "seller",
                sellerInfo: {
                    shopName: "Fashion Hub",
                    shopDescription: "Thời trang nam nữ trendy",
                    isApproved: true,
                    approvedAt: new Date()
                }
            },
            {
                name: "Khách hàng mua sắm",
                email: "buyer@wnp.vn",
                password: hashedPassword,
                role: "buyer",
            }
        ]);

        const sellers = [createdUsers[1]._id, createdUsers[2]._id, createdUsers[3]._id];
        
        console.log("Đang lấy product data từ DummyJSON...");
        const response = await fetch("https://dummyjson.com/products?limit=150");
        const data = await response.json();

        // 3. Tạo hơn 100 sản phẩm với DummyJSON data để đảm bảo hình ảnh load được!
        const sampleProducts = data.products.map(dp => ({
            name: dp.title,
            price: Math.round(dp.price * 25000), // Quy đổi giá USD sang VND
            stock: dp.stock || 100,
            sold: Math.floor(Math.random() * 1000),
            ratingAvg: dp.rating || 4.5,
            ratingCount: Math.floor(Math.random() * 200) + 10,
            category: dp.category.charAt(0).toUpperCase() + dp.category.slice(1),
            sellerProvince: ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh", "Cần Thơ", "Hải Phòng"][Math.floor(Math.random() * 5)],
            status: "approved",
            images: dp.images && dp.images.length > 0 ? dp.images : [dp.thumbnail],
            description: dp.description,
            seller: sellers[Math.floor(Math.random() * sellers.length)]
        }));

        await Product.create(sampleProducts);

        console.log(`\n✅ Đã tạo ${sampleProducts.length} sản phẩm thành công với ảnh từ DummyJSON!`);
        console.log("📧 Tài khoản mẫu:");
        console.log("   Admin:   admin@wnp.vn / 123456");
        console.log("   Seller1: seller@wnp.vn / 123456");
        console.log("   Seller2: techzone@wnp.vn / 123456");
        console.log("   Seller3: fashion@wnp.vn / 123456");
        console.log("   Buyer:   buyer@wnp.vn / 123456");
        process.exit();
    } catch (error) {
        console.error("Lỗi Import Data:", error);
        process.exit(1);
    }
};

importData();
