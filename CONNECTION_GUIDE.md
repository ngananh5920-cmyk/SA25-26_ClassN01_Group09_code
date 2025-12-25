# Hướng dẫn Kết nối Frontend và Backend

## ✅ Trạng thái Kết nối

### Backend
- ✅ Đã cấu hình MongoDB connection
- ✅ File .env đã được tạo (chạy `npm run setup` trong backend)
- ✅ API chạy tại: `http://localhost:8000`

### Frontend
- ✅ Đã cấu hình proxy trong `vite.config.ts`
- ✅ Đã cài đặt dependencies
- ✅ API client sử dụng baseURL: `/api`
- ✅ Tự động forward requests tới backend

## 🔗 Cách Kết nối Hoạt động

### 1. Proxy Configuration (vite.config.ts)
```typescript
server: {
  port: 4000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### 2. API Client (src/utils/api.ts)
```typescript
const api = axios.create({
  baseURL: '/api',  // Sẽ được proxy forward tới backend
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3. Flow kết nối:
```
Frontend Request: /api/employees
     ↓
Vite Proxy: localhost:4000/api/employees
     ↓
Forward to: localhost:8000/api/employees
     ↓
Backend handles request
```

## 🚀 Cách Chạy

### Bước 1: Start Backend
```bash
cd backend
npm run setup  # Nếu chưa có .env
npm run dev
```
Backend sẽ chạy tại: `http://localhost:8000`

### Bước 2: Start Frontend
```bash
cd frontend
npm install    # Đã chạy rồi, có thể bỏ qua
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:4000`

### Bước 3: Kiểm tra
1. Mở browser: `http://localhost:4000`
2. Kiểm tra backend health: `http://localhost:4000/api/health`
3. Kết quả mong đợi:
```json
{
  "status": "OK",
  "message": "HRM API is running"
}
```

## 🔍 Kiểm tra Kết nối

### Test 1: Backend Health Check
```bash
curl http://localhost:8000/api/health
```

### Test 2: Frontend Proxy
Mở browser console và chạy:
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
```

### Test 3: Full Flow
1. Mở `http://localhost:4000/login`
2. Đăng nhập (cần có user trong database)
3. Nếu đăng nhập thành công → Kết nối OK ✅

## ⚠️ Lưu ý Quan trọng

1. **Backend phải chạy trước** frontend
2. **MongoDB phải đang chạy** (port 27017)
3. **Port 8000** không được sử dụng bởi ứng dụng khác
4. **Port 4000** không được sử dụng bởi ứng dụng khác

## 🐛 Troubleshooting

### Lỗi: "Failed to fetch" hoặc "Network Error"
- ✅ Kiểm tra backend có đang chạy không: `curl http://localhost:8000/api/health`
- ✅ Kiểm tra CORS trong backend đã enable chưa
- ✅ Kiểm tra proxy config trong vite.config.ts

### Lỗi: "Cannot connect to MongoDB"
- ✅ Đảm bảo MongoDB service đang chạy
- ✅ Kiểm tra MONGODB_URI trong backend/.env

### Lỗi: "401 Unauthorized"
- ✅ Token có thể đã hết hạn, đăng nhập lại
- ✅ Kiểm tra JWT_SECRET trong backend/.env

### Lỗi: "Port already in use"
- ✅ Thay đổi port trong .env (backend) hoặc vite.config.ts (frontend)
- ✅ Hoặc tắt ứng dụng đang dùng port đó

## 📝 Tạo User đầu tiên

Để đăng nhập, bạn cần có user trong database. Có thể tạo bằng:

### Cách 1: API Register (nếu cho phép)
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### Cách 2: MongoDB Shell
```javascript
use hrm_db
db.users.insertOne({
  email: "admin@example.com",
  password: "$2a$10$hashedpassword...", // Cần hash password
  role: "admin"
})
```

### Cách 3: Tạo script helper (khuyến nghị)
Tạo file `backend/scripts/createAdmin.js` để tự động tạo admin user.

