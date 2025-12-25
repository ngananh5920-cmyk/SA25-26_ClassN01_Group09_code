# 🚫 Bỏ Kết Nối MongoDB

## ✅ Đã Cập Nhật

Hệ thống đã được cấu hình để **không bắt buộc** kết nối MongoDB khi khởi động server.

## 🔧 Cách Sử Dụng

### Option 1: Vô hiệu hóa MongoDB (Khuyến nghị)

1. Mở file `backend/.env` (hoặc tạo mới bằng `npm run setup`)

2. Thêm hoặc cập nhật dòng:
   ```env
   USE_MONGODB=false
   ```

3. Start server:
   ```bash
   cd backend
   npm run dev
   ```

Server sẽ chạy mà **không cần MongoDB**.

### Option 2: Giữ MongoDB nhưng cho phép server chạy khi lỗi kết nối

Nếu `USE_MONGODB=true` (hoặc không có dòng này), server sẽ:
- Thử kết nối MongoDB
- Nếu lỗi, server vẫn chạy (nhưng APIs sẽ không hoạt động)

## ⚠️ Lưu Ý Quan Trọng

**Khi bỏ MongoDB:**
- ❌ Tất cả API endpoints sẽ **KHÔNG hoạt động** (vì code vẫn dùng Mongoose models)
- ✅ Server vẫn start thành công
- ✅ Health check endpoint vẫn hoạt động: `http://localhost:8000/api/health`
- ❌ Không thể đăng nhập, quản lý nhân viên, v.v.

## 🔄 Để Sử Dụng Lại MongoDB

1. Đảm bảo MongoDB đang chạy
2. Trong `backend/.env`, đặt:
   ```env
   USE_MONGODB=true
   ```
3. Hoặc xóa dòng `USE_MONGODB=false`
4. Restart server

## 💡 Giải Pháp Thay Thế

Nếu bạn muốn hệ thống hoạt động **hoàn toàn** không cần MongoDB, cần:

1. **Thay thế tất cả Mongoose models** bằng in-memory storage hoặc JSON file
2. **Viết lại tất cả controllers** để không dùng Mongoose queries
3. Đây là một thay đổi lớn, yêu cầu refactor toàn bộ code

Nếu bạn muốn tôi thực hiện điều này, hãy cho biết và tôi sẽ bắt đầu refactor.

## 📝 Tóm Tắt

- ✅ Server có thể chạy mà không cần MongoDB
- ❌ APIs sẽ không hoạt động (vì vẫn dùng Mongoose)
- ✅ Đặt `USE_MONGODB=false` trong `.env` để vô hiệu hóa MongoDB


