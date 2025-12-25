# ✅ Kết Nối MongoDB - Hướng Dẫn

## 🎯 MongoDB Đã Được Bật Lại

Hệ thống đã được cấu hình để **yêu cầu MongoDB** (mặc định).

## 🚀 Các Bước Để Chạy Hệ Thống

### Bước 1: Đảm Bảo MongoDB Đang Chạy

**Windows:**
```bash
# Kiểm tra MongoDB service
sc query MongoDB

# Nếu chưa chạy, start nó:
net start MongoDB
```

**Hoặc:**
1. Mở Services (nhấn `Win + R`, gõ `services.msc`)
2. Tìm service "MongoDB"
3. Click chuột phải → Start

**macOS/Linux:**
```bash
# Với Homebrew (macOS)
brew services start mongodb-community

# Hoặc chạy trực tiếp
mongod --dbpath /path/to/data
```

### Bước 2: Kiểm Tra File .env

Mở file `backend/.env` và đảm bảo có:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/hrm_db
JWT_SECRET=hrm_secret_key_2024_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Quan trọng:** Nếu có dòng `USE_MONGODB=false`, hãy **XÓA** nó đi.

### Bước 3: Tạo File .env (Nếu Chưa Có)

```bash
cd backend
npm run setup
```

### Bước 4: Start Backend

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
🌐 API: http://localhost:8000/api
```

### Bước 5: Tạo Tài Khoản

Trong terminal KHÁC (giữ backend đang chạy):

```bash
cd backend
npm run create-users
```

Sẽ tạo các tài khoản:
- `admin@hrm.com` / `admin123`
- `hr@hrm.com` / `hr1234`
- `employee@hrm.com` / `employee123`
- `test@hrm.com` / `test123`

### Bước 6: Đăng Nhập

1. Mở `http://localhost:4000/login`
2. Nhập:
   - Email: `admin@hrm.com`
   - Password: `admin123`
3. Click "Đăng nhập"

## 🔍 Kiểm Tra Kết Nối

### Test MongoDB Connection:
```bash
# Kiểm tra MongoDB đang chạy
mongosh --eval "db.version()"
```

### Test Backend API:
```bash
curl http://localhost:8000/api/health
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "message": "HRM API is running"
}
```

## ⚠️ Lỗi Thường Gặp

### "MongoDB connection error"
- ✅ Đảm bảo MongoDB service đang chạy
- ✅ Kiểm tra MONGODB_URI trong .env
- ✅ Kiểm tra port 27017 không bị block

### "Port already in use"
- ✅ Thay đổi PORT trong .env
- ✅ Hoặc tắt ứng dụng đang dùng port 8000

### "Cannot find MongoDB service"
- ✅ Cài đặt MongoDB
- ✅ Hoặc chạy MongoDB thủ công: `mongod`

## ✅ Checklist Nhanh

Trước khi đăng nhập:

- [ ] MongoDB đang chạy (`net start MongoDB` hoặc Services)
- [ ] File `.env` tồn tại và đúng cấu hình
- [ ] Không có `USE_MONGODB=false` trong .env
- [ ] Backend đang chạy và kết nối MongoDB thành công
- [ ] Đã tạo tài khoản (`npm run create-users`)
- [ ] Frontend đang chạy (port 4000)

## 📝 Tóm Tắt

- ✅ MongoDB là **BẮT BUỘC** cho hệ thống
- ✅ Server sẽ không start nếu không kết nối được MongoDB
- ✅ Tất cả APIs cần MongoDB để hoạt động

