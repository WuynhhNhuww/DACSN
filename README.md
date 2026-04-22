# DACSN Shopee Mini - Dự án Thương mại Điện tử

Dự án Shopee Mini (DACSN) là một nền tảng thương mại điện tử toàn diện được xây dựng trên stack **MERN** (MongoDB, Express.js, React.js, Node.js). Nền tảng này cung cấp trải nghiệm mua sắm và bán hàng trực tuyến với tích hợp thanh toán hiện đại.

## 🚀 Tính năng chính

### 🛒 Dành cho Người mua (Buyer)
- **Tìm kiếm & Duyệt sản phẩm**: Khám phá kho sản phẩm phong phú theo danh mục.
- **Giỏ hàng & Thanh toán**: Quản lý giỏ hàng linh hoạt và quy trình đặt hàng tối ưu.
- **Ví ShopeePay**: Nạp tiền an toàn qua cổng **VNPay** để thanh toán đơn hàng nhanh chóng.
- **Quản lý đơn hàng**: Theo dõi chi tiết trạng thái đơn hàng (Chờ xác nhận, Đang giao, Đã giao, Đã hủy).
- **Yêu thích & Đánh giá**: Lưu sản phẩm yêu thích và gửi phản hồi, đánh giá kèm hình ảnh sau khi nhận hàng.

### 🏪 Dành cho Người bán (Seller)
- **Quản lý Sản phẩm**: Đăng bán, chỉnh sửa thông tin và quản lý tồn kho sản phẩm.
- **Quản lý Đơn hàng**: Tiếp nhận đơn hàng mới và cập nhật trạng thái vận chuyển.
- **Trang gian hàng (Shop Profile)**: Tùy chỉnh giao diện shop, xem danh sách sản phẩm riêng của shop.
- **Ví doanh thu & Rút tiền**: Theo dõi số dư từ việc bán hàng và thực hiện rút tiền về ngân hàng qua **VNPay Integration**.

### 🛡️ Dành cho Quản trị viên (Admin)
- **Bảng điều khiển (Dashboard)**: Thống kê doanh thu, số lượng người dùng, đơn hàng và sản phẩm theo thời gian.
- **Quản lý người dùng**: Duyệt danh sách, khóa/mở khóa tài khoản người dùng và người bán.
- **Quản lý Banner**: Cập nhật các banner quảng cáo và khuyến mãi trên trang chủ.
- **Xử lý Khiếu nại**: Tiếp nhận và giải quyết các khiếu nại từ người mua đối với đơn hàng.

## 🛠️ Công nghệ sử dụng

- **Frontend**: React.js (Vite), React Router Dom, Axios, Recharts, React Icons.
- **Backend**: Node.js, Express.js.
- **Cơ sở dữ liệu**: MongoDB (Mongoose ODM).
- **Thanh toán**: Tích hợp cổng thanh toán VNPay (Version 2.1.0).
- **Xác thực**: JSON Web Token (JWT) & Bcryptjs để bảo mật mật khẩu.
- **Xử lý File**: Multer để tải lên hình ảnh sản phẩm và avatar.

## 📂 Cấu trúc thư mục

```text
shopee-mini/
├── backend/            # Mã nguồn Server (Node.js/Express)
│   ├── config/         # Cấu hình Database & VNPay
│   ├── controllers/    # Xử lý logic nghiệp vụ cho từng module
│   ├── models/         # Định nghĩa cấu trúc dữ liệu (Schema)
│   ├── routes/         # Khai báo các API Endpoints
│   ├── utils/          # Các hàm bổ trợ (Tạo signature VNPay, gửi thông báo...)
│   └── server.js       # Entry point của server
├── frontend/           # Mã nguồn Client (React)
│   ├── src/
│   │   ├── api/        # Cấu hình Axios và các hàm gọi API
│   │   ├── components/ # Các thành phần UI tái sử dụng
│   │   ├── pages/      # Giao diện chính cho Buyer, Seller, Admin
│   │   └── App.jsx     # Cấu hình Routing chính
│   └── vite.config.js
└── README.md
```

## ⚙️ Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Cấu hình Backend
1. Di chuyển vào thư mục backend: `cd backend`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Tạo file `.env` và cấu hình các thông số sau:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   # VNPay Config
   VNP_TMNCODE=your_tmn_code
   VNP_HASHSECRET=your_hash_secret
   VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
   VNP_RETURNURL=http://localhost:5000/api/wallets/vnpay_return
   ```
4. Khởi động server phát triển: `npm run dev`

### 2. Cấu hình Frontend
1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Chạy ứng dụng: `npm run dev`
4. Truy cập website tại: `http://localhost:5173`

---
⚡ *Dự án được phát triển nhằm mục đích học tập và xây dựng hệ thống thương mại điện tử thực tế.*
