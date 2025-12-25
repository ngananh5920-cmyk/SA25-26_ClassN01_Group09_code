# 🔍 Debug Lỗi 500 Khi Đăng Nhập

## ❌ Lỗi 500 Internal Server Error

Khi gặp lỗi này, hãy kiểm tra:

### 1. Kiểm Tra Backend Logs

Xem terminal nơi bạn chạy `npm run dev`, sẽ có thông tin lỗi chi tiết.

### 2. Nguyên Nhân Thường Gặp

#### A. MongoDB Chưa Kết Nối

**Triệu chứng:**
- Backend start nhưng MongoDB không kết nối
- Logs hiển thị: "MongoDB connection error"

**Giải pháp:**
```bash
# Start MongoDB
net start MongoDB

# Hoặc kiểm tra
sc query MongoDB
```

#### B. Chưa Tạo User

**Triệu chứng:**
- MongoDB đã kết nối
- Nhưng không có user trong database

**Giải pháp:**
```bash
cd backend
npm run create-users
```

#### C. Lỗi Schema/Mongoose

**Triệu chứng:**
- Error trong logs về schema validation
- Hoặc lỗi về password select

**Giải pháp:**
- Kiểm tra file `backend/src/models/User.ts`
- Đảm bảo schema đúng

### 3. Kiểm Tra Chi Tiết

#### Kiểm tra MongoDB Connection:
```bash
# Test MongoDB
mongosh --eval "db.version()"

# Hoặc test connection từ Node
node -e "require('mongoose').connect('mongodb://localhost:27017/hrm_db').then(() => console.log('Connected')).catch(e => console.error(e))"
```

#### Kiểm tra User trong Database:
```bash
mongosh hrm_db --eval "db.users.find().pretty()"
```

### 4. Xem Logs Backend

Trong terminal chạy backend, bạn sẽ thấy error message chi tiết như:
```
Login error: [error message here]
```

### 5. Test API Trực Tiếp

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@hrm.com\",\"password\":\"admin123\"}"
```

Xem response để biết lỗi cụ thể.

### 6. Checklist

- [ ] MongoDB đang chạy
- [ ] Backend đang chạy và đã kết nối MongoDB (thấy "✅ MongoDB Connected")
- [ ] Đã chạy `npm run create-users`
- [ ] Có user trong database (kiểm tra bằng mongosh)
- [ ] File .env đúng cấu hình

### 7. Nếu Vẫn Lỗi

Xem error message trong:
1. **Backend terminal** - sẽ có stack trace chi tiết
2. **Browser console** - sẽ có response từ server
3. **Network tab** - xem response body từ API

Sau đó search error message trên Google hoặc hỏi với error message cụ thể.


