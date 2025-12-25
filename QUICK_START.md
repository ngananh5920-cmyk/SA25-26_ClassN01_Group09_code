# ⚡ Quick Start - Khởi động nhanh

## 🚀 Bước 1: Start Backend

```bash
cd backend
npm run dev
```

Chờ đến khi thấy:
```
✅ MongoDB Connected: ...
🚀 Server running in development mode
📍 Port: 8000
🌐 API: http://localhost:8000/api
```

## 👥 Bước 2: Tạo tài khoản (CHỈ CẦN CHẠY 1 LẦN)

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

## 🌐 Bước 3: Start Frontend

Trong terminal KHÁC:

```bash
cd frontend
npm run dev
```

## 🔐 Bước 4: Đăng nhập

1. Mở browser: `http://localhost:4000/login`
2. Nhập:
   - Email: `admin@hrm.com`
   - Password: `admin123`
3. Click "Đăng nhập"

## ⚠️ Lưu ý quan trọng

1. **Backend PHẢI chạy trước** frontend
2. **MongoDB PHẢI chạy** trước khi start backend
3. **Chỉ cần tạo user 1 lần** (trừ khi xóa database)

