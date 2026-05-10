# 🚀 WPN STORE - HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ TOÀN DIỆN (FULL-STACK MERN)

Chào mừng bạn đến với **WPN Store** (trước đây là Shopee Mini) - một nền tảng thương mại điện tử chuyên nghiệp được xây dựng trên bộ công nghệ **MERN Stack** (MongoDB, Express, React, Node.js). Hệ thống được thiết kế để cung cấp trải nghiệm mua sắm mượt mà, tích hợp thanh toán trực tuyến, thông báo thời gian thực và trí tuệ nhân tạo AI.

---

## 🌟 Tổng Quan Các Tính Năng Đã Hoàn Thành

### 1. 🔐 Hệ Thống Xác Thực & Bảo Mật
- **Đăng ký/Đăng nhập**: Hỗ trợ đăng ký tài khoản mới và đăng nhập an toàn.
- **Xác thực Email**: Hệ thống gửi mã xác nhận qua Email để đảm bảo tài khoản chính chủ.
- **Google OAuth 2.0**: Cho phép người dùng đăng nhập nhanh chóng bằng tài khoản Google.
- **Phân quyền người dùng (RBAC)**: Phân chia rõ ràng 3 vai trò: **Buyer** (Người mua), **Seller** (Người bán), và **Admin** (Quản trị viên).
- **Bảo mật**: Mã hóa mật khẩu bằng `Bcryptjs` và quản lý phiên đăng nhập bằng `JWT` (JSON Web Token).

### 2. 🛒 Trải Nghiệm Người Mua (Buyer)
- **Trang chủ & Banner**: Hiển thị các chiến dịch khuyến mãi thông qua hệ thống banner động.
- **Tìm kiếm & Lọc sản phẩm**: Tìm kiếm thông minh theo tên, danh mục và các tiêu chí lọc.
- **Giỏ hàng**: Thêm/xóa sản phẩm, cập nhật số lượng và tính toán tổng tiền tự động.
- **Đặt hàng**: Quy trình thanh toán đa bước, áp dụng mã giảm giá (Voucher).
- **Đánh giá sản phẩm**: Người mua có thể gửi đánh giá kèm hình ảnh sau khi nhận hàng.
- **Trợ lý AI (WPN Assistant)**: Chatbot tích hợp **Google Gemini AI** hỗ trợ giải đáp thắc mắc 24/7.

### 3. 🏪 Kênh Người Bán (Seller Center)
- **Quản lý Sản phẩm**: Đăng bán sản phẩm mới với nhiều hình ảnh (lưu trữ trên Cloudinary).
- **Quản lý Đơn hàng**: Theo dõi đơn hàng mới, cập nhật trạng thái vận chuyển.
- **Quảng cáo & Khuyến mãi**: Công cụ tạo Voucher, quản lý chương trình khuyến mãi và chạy quảng cáo cho sản phẩm.
- **Ví Doanh thu**: Hệ thống ví riêng để theo dõi tiền bán hàng và yêu cầu rút tiền về ngân hàng.
- **Thống kê**: Biểu đồ doanh thu và hiệu suất bán hàng thời gian thực.

### 4. 🛡️ Quản Trị Hệ Thống (Admin Panel)
- **Dashboard**: Thống kê tổng quan toàn sàn: doanh thu, người dùng mới, đơn hàng thành công.
- **Quản lý Người dùng**: Duyệt danh sách, kích hoạt hoặc khóa tài khoản vi phạm.
- **Quản lý Banner & Quảng cáo**: Cập nhật giao diện trang chủ theo các mùa khuyến mãi.
- **Xử lý Khiếu nại**: Tiếp nhận và phân xử các tranh chấp giữa người mua và người bán.

### 5. 💳 Hệ Thống Thanh Toán & Ví WNPPAY
- **Ví điện tử WNPPAY**: Nạp tiền từ ngân hàng vào ví thông qua cổng **VNPay**.
- **Thanh toán Đơn hàng**: Sử dụng số dư ví để thanh toán nhanh chóng.
- **Rút tiền**: Hỗ trợ người bán rút tiền từ ví doanh thu về tài khoản ngân hàng cá nhân qua luồng VNPay.

### 6. ⚡ Tính Năng Thời Gian Thực (Real-time)
- **Socket.io Integration**:
    - Thông báo (Notifications) tức thì khi có đơn hàng mới hoặc thay đổi trạng thái.
    - Cập nhật số dư ví ngay lập tức sau khi giao dịch.
    - Hệ thống Chat trực tiếp giữa Người mua và Người bán.
    - Badge thông báo (số icon đỏ) cập nhật theo thời gian thực trên Header.

---

## 📂 Cấu Trúc Toàn Bộ Dự Án (Project Structure)

### 🖥️ Frontend (React + Vite)
```text
frontend/
├── src/
│   ├── api/                # Cấu hình Axios & API Services
│   ├── components/         # UI Components (Header, Footer, Sidebar, ProductCard...)
│   ├── context/            # Quản lý State: AuthContext, SocketContext
│   ├── pages/
│   │   ├── admin/          # Quản lý: Dashboard, Users, Banners, Complaints...
│   │   ├── public/         # Công khai: Home, Login, Register, ProductDetail...
│   │   ├── seller/         # Kênh người bán: Products, Orders, Ads, Reviews...
│   │   └── shared/         # Dùng chung: Wallet, Profile...
│   ├── styles/             # CSS files (shopee.css, admin-seller.css...)
│   ├── utils/              # Helper functions & Socket.io client
│   ├── App.jsx             # Cấu hình Routes chính
│   └── main.jsx            # Entry point
└── vite.config.js
```

### ⚙️ Backend (Node.js + Express)
```text
backend/
├── config/                 # Cấu hình DB, VNPay, Cloudinary, Mailer
├── controllers/            # Logic xử lý chính (17+ controllers)
│   ├── aiController.js     # Xử lý Google Gemini AI
│   ├── authController.js   # Đăng nhập, Đăng ký, Google Auth
│   ├── orderController.js  # Luồng xử lý đơn hàng phức tạp
│   ├── walletController.js # Nạp/Rút tiền & VNPay IPN
│   └── ...                 # (Sellers, Products, Chats, Notifications...)
├── middleware/             # Check Auth, Check Role, Error Handling
├── models/                 # Định nghĩa Schema MongoDB (User, Product, Order...)
├── routes/                 # API Routes (Gộp các controller vào endpoint)
├── utils/                  # VNPay sign, Gemini Helper, Notification logic
├── server.js               # Khởi tạo Server & Socket.io
└── .env                    # Biến môi trường (Secret Keys)
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Lĩnh vực | Công nghệ |
| :--- | :--- |
| **Frontend** | React.js, React Router 7, Recharts, React Icons, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Real-time** | Socket.io |
| **AI** | Google Gemini AI SDK |
| **Thanh toán** | VNPay Gateway Integration |
| **Hình ảnh** | Cloudinary API |
| **Email** | Nodemailer |

---

## 🚀 Hướng Dẫn Chạy Dự Án

### Bước 1: Cấu hình Backend
1. `cd backend`
2. `npm install`
3. Tạo file `.env` với các nội dung (Tham khảo mẫu trong file hướng dẫn trước).
4. `npm run dev` (Chạy tại port 5000)

### Bước 2: Cấu hình Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Chạy tại port 5173)

---
⚡ *Dự án được xây dựng với kiến trúc hiện đại, dễ dàng bảo trì và mở rộng.*
