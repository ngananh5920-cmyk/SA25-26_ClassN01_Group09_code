# Debug Guide - Lỗi 500 Internal Server Error

## Kiểm tra nhanh

1. **Kiểm tra backend server có đang chạy:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Kiểm tra MongoDB có đang chạy:**
   - Windows: Mở Services (services.msc) và kiểm tra MongoDB service
   - Hoặc chạy: `mongosh --eval "db.version()"`

3. **Kiểm tra file .env:**
   ```
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/hrm_db
   JWT_SECRET=hrm_secret_key_2024_change_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

## Xem logs chi tiết

Khi gặp lỗi 500, xem console của backend server để thấy:
- Error message
- Error stack trace
- Request URL và Method

## Các lỗi thường gặp

### 1. Database Connection Error
```
❌ Database connection error
```
**Giải pháp:** Đảm bảo MongoDB đang chạy

### 2. Model/Collection Error
```
Cannot read property 'populate' of undefined
```
**Giải pháp:** Kiểm tra model được import đúng chưa

### 3. Validation Error
```
ValidationError: ...
```
**Giải pháp:** Kiểm tra dữ liệu gửi lên có đúng schema không

### 4. Auth Error
```
Token is not valid
```
**Giải pháp:** Đăng nhập lại để lấy token mới

## Test endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Test database
curl http://localhost:8000/api/test-db

# Login (nhận token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrm.com","password":"admin123"}'
```

## Enable detailed logging

Để xem logs chi tiết hơn, đảm bảo `NODE_ENV=development` trong file .env

