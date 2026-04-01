# DACSN E-commerce

## Tóm tắt dự án
DACSN là một nền tảng thương mại điện tử cho phép người dùng mua sắm các sản phẩm điện tử, sản phẩm chăm sóc da, và nhiều mặt hàng khác. Dự án này được xây dựng với giao diện người dùng bằng React.js, một backend hiệu suất cao với Node.js, và lưu trữ dữ liệu thông qua MongoDB.  

## Tính năng đã triển khai
- **Đăng nhập**: Người dùng có thể dễ dàng đăng nhập vào tài khoản của mình.  
- **Mua sắm**: Giao diện mua sắm thân thiện với người sử dụng, cho phép duyệt sản phẩm, thêm vào giỏ hàng và kiểm tra để thanh toán.  
- **Quản lý người bán**: Người bán có thể quản lý và theo dõi đơn hàng của mình, cũng như cập nhật danh sách sản phẩm.  
- **Bảng quản trị**: Quản trị viên có thể dễ dàng quản lý người dùng, đơn hàng, và các hoạt động khác trên nền tảng.  

## Công nghệ sử dụng
- **Frontend**: React.js  
- **Backend**: Node.js  
- **Cơ sở dữ liệu**: MongoDB  

## Cấu trúc thư mục

## Backend

- config
- controllers
- middleware
- models
- node_modules
- routes
- .env
- package.json
- package-lock.json
- seed.js
- seedDummy.js
- server.js

## Frontend

- public
- src  
  - api  
  - assets  
  - components  
  - context  
  - layouts  
  - pages  
  - styles  


## Hướng dẫn cài đặt
1. **Clone repository**: `git clone https://github.com/WuynhhNhuww/DACSN.git`
2. **Cài đặt dependencies** cho frontend và backend:
   - Vào thư mục `client`: `cd client` và chạy `npm install`
   - Vào thư mục `server`: `cd server` và chạy `npm install`
3. **Chạy ứng dụng**:
   - Khởi động backend: `cd server` và chạy `node index.js`
   - Khởi động frontend: `cd client` và chạy `npm start`

## Tài liệu API
- **Đăng nhập**: `POST /api/auth/login`
- **Lấy danh sách sản phẩm**: `GET /api/products`
- **Thêm sản phẩm**: `POST /api/products`

## Tính năng trong tương lai
- **Tích hợp cổng thanh toán**: Dự kiến sẽ tích hợp VNPay và MoMo để thuận tiện hơn cho người dùng khi thanh toán.  
