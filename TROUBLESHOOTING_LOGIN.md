# 🔧 Khắc phục lỗi đăng nhập

## ❌ Lỗi "Đăng nhập thất bại"

Nếu bạn gặp lỗi này, hãy kiểm tra các bước sau:

### Bước 1: Kiểm tra Backend đang chạy

Backend phải chạy tại `http://localhost:8000`

```bash
# Kiểm tra backend có đang chạy
curl http://localhost:8000/api/health
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "message": "HRM API is running"
}
```

Nếu không có kết quả, start backend:
```bash
cd backend
npm run dev
```

### Bước 2: Kiểm tra MongoDB đang chạy

Backend cần MongoDB để hoạt động:

```bash
# Kiểm tra MongoDB
mongosh --eval "db.version()"
```

Nếu MongoDB chưa chạy:
- **Windows**: Mở Services (services.msc) → Tìm "MongoDB" → Start
- **macOS/Linux**: `brew services start mongodb-community` hoặc `sudo systemctl start mongod`

### Bước 3: Tạo tài khoản

Nếu chưa có tài khoản, tạo các tài khoản mẫu:

```bash
cd backend
npm run create-users
```

Script sẽ tạo 4 tài khoản:
- `admin@hrm.com` / `admin123`
- `hr@hrm.com` / `hr1234`
- `employee@hrm.com` / `employee123`
- `test@hrm.com` / `test123`

### Bước 4: Kiểm tra thông tin đăng nhập

Đảm bảo bạn nhập đúng:
- **Email**: chính xác (ví dụ: `admin@hrm.com`)
- **Password**: chính xác (ví dụ: `admin123`)
- Không có khoảng trắng thừa

### Bước 5: Kiểm tra Console (F12)

Mở Developer Tools (F12) trong browser và xem tab Console/Network:
- Xem có lỗi CORS không
- Xem request có được gửi tới đúng endpoint không
- Xem response từ server

### Bước 6: Kiểm tra file .env

Đảm bảo file `backend/.env` tồn tại và có cấu hình đúng:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/hrm_db
JWT_SECRET=hrm_secret_key_2024_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

Nếu chưa có file .env:
```bash
cd backend
npm run setup
```

## 🔍 Các lỗi thường gặp

### "Invalid credentials"
- ❌ Email hoặc password sai
- ✅ Kiểm tra lại thông tin đăng nhập
- ✅ Chạy `npm run create-users` để tạo lại tài khoản

### "Cannot connect to server"
- ❌ Backend không chạy
- ✅ Start backend: `cd backend && npm run dev`

### "MongoDB connection error"
- ❌ MongoDB không chạy
- ✅ Start MongoDB service

### "Network Error" hoặc "Failed to fetch"
- ❌ Backend không chạy hoặc CORS issue
- ✅ Kiểm tra backend đang chạy
- ✅ Kiểm tra proxy trong `vite.config.ts`

## ✅ Checklist nhanh

Trước khi đăng nhập, đảm bảo:

- [ ] MongoDB đang chạy
- [ ] Backend đang chạy (port 8000)
- [ ] Đã tạo tài khoản (`npm run create-users`)
- [ ] Frontend đang chạy (port 4000)
- [ ] File `.env` tồn tại trong backend

## 🆘 Vẫn không được?

1. Kiểm tra logs của backend trong terminal
2. Kiểm tra logs trong browser console (F12)
3. Thử đăng nhập với curl:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@hrm.com","password":"admin123"}'
   ```

