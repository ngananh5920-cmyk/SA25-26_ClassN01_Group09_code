# ⚡ Quick Start - Kết Nối MongoDB

## ✅ Đã Cập Nhật

MongoDB đã được **BẬT LẠI** - Hệ thống yêu cầu MongoDB để hoạt động.

## 🚀 Các Bước Nhanh

### 1. Start MongoDB Service

**Windows:**
```bash
net start MongoDB
```

Hoặc mở Services (`Win + R` → `services.msc`) → Tìm "MongoDB" → Start

### 2. Kiểm Tra File .env

Nếu file `backend/.env` có dòng `USE_MONGODB=false`, hãy **XÓA** nó.

Hoặc tạo lại file .env:
```bash
cd backend
npm run setup
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

Bạn sẽ thấy:
```
🔄 Đang kết nối tới MongoDB...
✅ MongoDB Connected: localhost:27017
📊 Database: hrm_db
🚀 Server running in development mode
📍 Port: 8000
```

### 4. Tạo Tài Khoản (Chỉ 1 lần)

Terminal khác:
```bash
cd backend
npm run create-users
```

### 5. Đăng Nhập

- URL: `http://localhost:4000/login`
- Email: `admin@hrm.com`
- Password: `admin123`

## ✅ Done!

Nếu gặp lỗi, xem file `MONGODB_SETUP.md` để biết chi tiết.


