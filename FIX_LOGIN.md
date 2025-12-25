# 🔧 Khắc Phục Lỗi Đăng Nhập

## ❌ Vấn Đề

Bạn không thể đăng nhập vì:

1. **Backend chưa chạy** (port 8000 không mở)
2. **MongoDB bị tắt** - Nếu `USE_MONGODB=false`, APIs sẽ không hoạt động vì code vẫn dùng Mongoose

## ✅ Giải Pháp

### Bước 1: Bật Lại MongoDB

Vì hệ thống vẫn dùng Mongoose models, **BẮT BUỘC phải có MongoDB** để APIs hoạt động.

1. Mở file `backend/.env`
2. Xóa hoặc comment dòng `USE_MONGODB=false`, hoặc đặt:
   ```env
   USE_MONGODB=true
   ```

### Bước 2: Đảm Bảo MongoDB Đang Chạy

**Windows:**
```bash
# Kiểm tra MongoDB service
sc query MongoDB

# Nếu chưa chạy, start nó:
net start MongoDB
```

**Hoặc mở Services (services.msc) → Tìm "MongoDB" → Start**

### Bước 3: Start Backend

```bash
cd backend
npm run dev
```

Chờ đến khi thấy:
```
✅ MongoDB Connected: ...
🚀 Server running in development mode
📍 Port: 8000
```

### Bước 4: Tạo Tài Khoản

Trong terminal KHÁC (giữ backend đang chạy):

```bash
cd backend
npm run create-users
```

Sẽ tạo các tài khoản:
- `admin@hrm.com` / `admin123`
- `hr@hrm.com` / `hr1234`
- `employee@hrm.com` / `employee123`

### Bước 5: Đăng Nhập

1. Mở `http://localhost:4000/login`
2. Nhập:
   - Email: `admin@hrm.com`
   - Password: `admin123`
3. Click "Đăng nhập"

## ⚠️ Lưu Ý Quan Trọng

**TẠI SAO CẦN MONGODB?**

- Code hiện tại dùng **Mongoose** cho tất cả models (User, Employee, Department, v.v.)
- Khi `USE_MONGODB=false`, server chạy được nhưng **tất cả APIs sẽ lỗi** vì Mongoose không thể hoạt động
- Để APIs hoạt động, **BẮT BUỘC phải có MongoDB**

**Nếu bạn thực sự muốn bỏ MongoDB hoàn toàn:**

Cần refactor toàn bộ code để thay Mongoose bằng:
- JSON file storage
- In-memory storage  
- SQLite
- Hoặc database khác

Đây là thay đổi lớn, cần thời gian để implement.

## ✅ Checklist Nhanh

Trước khi đăng nhập, đảm bảo:

- [ ] MongoDB đang chạy (`net start MongoDB` hoặc Services)
- [ ] File `.env` có `USE_MONGODB=true` (hoặc không có dòng này)
- [ ] Backend đang chạy (port 8000)
- [ ] Đã tạo tài khoản (`npm run create-users`)
- [ ] Frontend đang chạy (port 4000)

## 🆘 Vẫn Không Được?

Kiểm tra logs trong terminal backend để xem lỗi cụ thể:
- MongoDB connection error?
- Port đã được sử dụng?
- Lỗi khác?

