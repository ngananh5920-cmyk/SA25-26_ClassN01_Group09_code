# 🔧 Khắc Phục Lỗi 500 Khi Đăng Nhập

## ❌ Lỗi 500 Internal Server Error

Khi gặp lỗi này, hãy làm theo các bước sau:

## ✅ Checklist Nhanh

### 1. Kiểm Tra MongoDB Đang Chạy

**Windows:**
```bash
# Kiểm tra service
sc query MongoDB

# Nếu chưa chạy, start nó
net start MongoDB
```

**Hoặc:** Mở Services (`Win + R` → `services.msc`) → Tìm "MongoDB" → Start

### 2. Kiểm Tra Backend Terminal

Xem terminal nơi bạn chạy `npm run dev`, bạn PHẢI thấy:

```
🔄 Đang kết nối tới MongoDB...
✅ MongoDB Connected: localhost:27017
📊 Database: hrm_db
🚀 Server running in development mode
📍 Port: 8000
```

**Nếu KHÔNG thấy "✅ MongoDB Connected":**
- MongoDB chưa chạy → Start MongoDB
- Hoặc có lỗi kết nối → Xem error message trong terminal

### 3. Kiểm Tra Backend Có Đang Chạy

```bash
# Test health check
curl http://localhost:8000/api/health
```

Phải nhận được:
```json
{"status":"OK","message":"HRM API is running"}
```

**Nếu không có response:**
- Backend chưa chạy → Start backend: `cd backend && npm run dev`

### 4. Tạo User Trong Database

**Nếu chưa tạo user:**

```bash
cd backend
npm run create-users
```

Sẽ tạo các user:
- `admin@hrm.com` / `admin123`
- `hr@hrm.com` / `hr1234`
- `employee@hrm.com` / `employee123`

### 5. Kiểm Tra User Trong Database

```bash
mongosh hrm_db --eval "db.users.find().pretty()"
```

Phải thấy ít nhất user `admin@hrm.com`.

### 6. Test API Trực Tiếp

Mở terminal và chạy:

```bash
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@hrm.com\",\"password\":\"admin123\"}"
```

Xem response để biết lỗi cụ thể.

## 🔍 Xem Lỗi Chi Tiết

### Trong Backend Terminal

Khi bạn đăng nhập, backend terminal sẽ hiển thị:
- `🔍 Attempting to find user with email: admin@hrm.com`
- Nếu có lỗi, sẽ thấy: `❌ Login error: [chi tiết lỗi]`

**Copy error message đó và xem nó nói gì.**

### Trong Browser Network Tab

1. Mở Developer Tools (F12)
2. Tab "Network"
3. Click vào request `/api/auth/login`
4. Tab "Response" → Xem response body từ server

Sẽ có thông tin lỗi chi tiết.

## 🚨 Các Lỗi Thường Gặp

### "Database connection error"
- ✅ MongoDB chưa chạy → Start MongoDB
- ✅ Kiểm tra MONGODB_URI trong .env

### "Invalid credentials"
- ✅ User không tồn tại → Chạy `npm run create-users`
- ✅ Password sai → Dùng `admin123`

### "MongoServerError"
- ✅ MongoDB connection issue
- ✅ Database chưa được tạo
- ✅ Permission issue

## 📝 Các Bước Chính Xác

1. **Start MongoDB:**
   ```bash
   net start MongoDB
   ```

2. **Start Backend (terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   Chờ thấy "✅ MongoDB Connected"

3. **Tạo User (terminal 2):**
   ```bash
   cd backend
   npm run create-users
   ```

4. **Đăng Nhập:**
   - URL: `http://localhost:4000/login`
   - Email: `admin@hrm.com`
   - Password: `admin123`

## 🆘 Nếu Vẫn Lỗi

1. **Copy error message từ backend terminal**
2. **Copy response body từ browser Network tab**
3. **Cho tôi biết error message cụ thể** để tôi có thể fix chính xác

