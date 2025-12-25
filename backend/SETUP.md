# Hướng dẫn Thiết lập Backend

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Tạo file .env

Chạy script tự động:
```bash
npm run setup
```

Hoặc tự tạo file `.env` với nội dung:
```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/hrm_db
JWT_SECRET=hrm_secret_key_2024_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

## Bước 3: Đảm bảo MongoDB đang chạy

### Kiểm tra MongoDB:
```bash
# Kiểm tra xem MongoDB service có đang chạy không
mongosh --eval "db.version()"
```

### Nếu MongoDB chưa chạy:

**Windows:**
- Mở Services (services.msc)
- Tìm "MongoDB" và Start service
- Hoặc chạy: `net start MongoDB`

**macOS/Linux:**
```bash
# Với Homebrew (macOS)
brew services start mongodb-community

# Hoặc chạy trực tiếp
mongod --dbpath /path/to/data
```

## Bước 4: Chạy Backend

```bash
npm run dev
```

Backend sẽ:
- ✅ Tự động kết nối MongoDB
- ✅ Hiển thị thông báo kết nối thành công
- ✅ Chạy trên http://localhost:8000

## Troubleshooting

### Lỗi: "MongoDB connection error"
- ✅ Đảm bảo MongoDB đang chạy
- ✅ Kiểm tra MONGODB_URI trong file .env
- ✅ Kiểm tra port 27017 có bị block không

### Lỗi: "Port already in use"
- ✅ Thay đổi PORT trong file .env
- ✅ Hoặc tắt ứng dụng đang dùng port 8000

### Test kết nối nhanh:
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

