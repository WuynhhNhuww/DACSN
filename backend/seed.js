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

        // 1. Phá sạch data cũ để tránh trùng lặp
        await Product.deleteMany();
        await User.deleteMany();

        // 2. Tạo User là admin và seller
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        const createdUsers = await User.create([
            {
                name: "Admin",
                email: "admin@wnp.vn",
                password: hashedPassword,
                role: "admin",
            },
            {
                name: "Shop WNP Chính Hãng",
                email: "seller@wnp.vn",
                password: hashedPassword,
                role: "seller",
                sellerInfo: {
                    shopName: "WNP Official Store",
                    shopDescription: "Cửa hàng thời trang chính hãng tại WNP",
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

        const sellerId = createdUsers[1]._id;

        // 3. Tạo list Products giả bám theo Front-end
        const sampleProducts = [
            {
                name: "Áo Thun Cotton Form Rộng Cao Cấp WNP",
                price: 199000,
                description: "Chất liệu cotton 100%, form rộng unisex, phù hợp đi học, đi chơi. Hàng chuẩn WNP.",
                category: "Thời trang",
                sellerProvince: "Hà Nội",
                images: [
                    "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsth6z9ooxuq0a",
                    "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsth6z9oqce6af"
                ],
                stock: 150,
                sold: 1205,
                ratingAvg: 4.8,
                ratingCount: 320,
                status: "active",
                discount: {
                    type: "percentage",
                    value: 20, // Final: 159,200
                    isActive: true
                },
                seller: sellerId
            },
            {
                name: "Tai nghe Bluetooth Không Dây Mini TWS",
                price: 450000,
                description: "Tai nghe bluetooth âm thanh vòm 9D cực sống động. Pin trâu 5 giờ.",
                category: "Điện tử",
                sellerProvince: "TP. Hồ Chí Minh",
                images: [
                    "https://down-vn.img.susercontent.com/file/vn-11134201-23030-x312qszu60nva1"
                ],
                stock: 50,
                sold: 210,
                ratingAvg: 4.5,
                ratingCount: 45,
                status: "active",
                discount: {
                    type: "fixed",
                    value: 50000, // Final: 400,000
                    isActive: true
                },
                seller: sellerId
            },
            {
                name: "Balo Thời Trang Ulzzang Hàn Quốc Đi Học",
                price: 250000,
                description: "Balo nữ chất liệu vải canvas xịn xò, có chỗ để laptop 15.6 inch chống nước.",
                category: "Thời trang",
                sellerProvince: "Đà Nẵng",
                images: [
                    "https://down-vn.img.susercontent.com/file/dc50993efcb5c225ffac5e1656c9a066"
                ],
                stock: 200,
                sold: 50,
                status: "active",
                discount: {
                    isActive: false
                },
                seller: sellerId
            },
            {
                name: "Sách - Đắc Nhân Tâm (Khổ Lớn)",
                price: 88000,
                description: "Bản kỷ niệm 20 năm xuất bản. Đắc nhân tâm - nghệ thuật thu phục lòng người.",
                category: "Sách",
                sellerProvince: "Hà Nội",
                images: [
                    "https://down-vn.img.susercontent.com/file/11546736dd65bc4390be4fffd586c91a"
                ],
                stock: 300,
                sold: 8432,
                ratingAvg: 5.0,
                ratingCount: 1200,
                status: "active",
                seller: sellerId
            },
            {
                name: "Nồi Chiên Không Dầu Sunhouse 3L",
                price: 990000,
                description: "Nồi chiên không dầu tiết kiệm thời gian, dễ dàng làm sạch.",
                category: "Gia dụng",
                sellerProvince: "Hải Phòng",
                images: [
                    "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lu83nx7ovp5w3e"
                ],
                stock: 12,
                sold: 55,
                ratingAvg: 4.7,
                ratingCount: 30,
                status: "active",
                discount: {
                    type: "percentage",
                    value: 15, // Final: 841,500
                    isActive: true
                },
                seller: sellerId
            },
            {
                name: "Điện Thoại Pova 5 Pro Hiệu Năng Cao",
                price: 4990000,
                description: "Chơi game bao mượt. RAM 8GB / 256GB / Pin 5000mAh.",
                category: "Điện tử",
                sellerProvince: "Hà Nội",
                images: [
                    "https://down-vn.img.susercontent.com/file/vn-11134201-7qukw-ligskt6a0oxb3a"
                ],
                stock: 30,
                sold: 15,
                status: "active",
                seller: sellerId
            },
            {
                name: "Son Môi Kem Bùn WNP Matte Lipstick",
                price: 150000,
                description: "Son môi thiết kế đặc biệt, chất son mịn lì, lâu trôi.",
                category: "Mỹ phẩm",
                sellerProvince: "TP. Hồ Chí Minh",
                images: [
                    "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnl2y1o80w4h21"
                ],
                stock: 500,
                sold: 3200,
                ratingAvg: 4.9,
                ratingCount: 845,
                status: "active",
                discount: {
                    type: "percentage",
                    value: 50, // Final: 75,000
                    isActive: true
                },
                seller: sellerId
            },
        ];

        await Product.create(sampleProducts);

        console.log("Data Imported Tới Mongoose Thành Công! 🎉");
        process.exit();
    } catch (error) {
        console.error("Lỗi Import Data:", error);
        process.exit(1);
    }
};

importData();
