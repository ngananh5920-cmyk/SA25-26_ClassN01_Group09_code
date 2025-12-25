# 📋 Tài Khoản Đăng Nhập

## 🚀 Tạo Tài Khoản Mẫu

Để tạo các tài khoản mẫu, chạy lệnh sau:

```bash
cd backend
npm run create-users
```

Script này sẽ tạo 4 tài khoản mẫu trong database.

## 👥 Danh Sách Tài Khoản Mẫu

Sau khi chạy script, bạn có thể đăng nhập với các tài khoản sau:

| Email              | Password      | Role      | Quyền truy cập                           |
|--------------------|---------------|-----------|------------------------------------------|
| admin@hrm.com      | admin123      | admin     | Toàn quyền - Tất cả chức năng            |
| hr@hrm.com         | hr1234        | hr        | Quản lý nhân sự - Xem và quản lý tất cả  |
| manager@hrm.com    | manager123    | manager   | Trưởng phòng - Quản lý phòng ban         |
| employee@hrm.com   | employee123   | employee  | Nhân viên - Chỉ xem/sửa của mình         |
| test@hrm.com       | test123       | employee  | Nhân viên - Tài khoản test               |

## 🔐 Đăng Nhập

1. Khởi động backend và frontend:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Mở browser: `http://localhost:4000/login`

3. Đăng nhập với một trong các tài khoản ở trên

## ⚠️ Lưu ý Bảo Mật

- ⚠️ **Đây là mật khẩu mặc định cho môi trường development**
- 🔒 **Hãy đổi mật khẩu ngay sau khi đăng nhập trong production**
- 🗑️ **Không sử dụng các mật khẩu này trong môi trường production**

## 📝 Tạo Tài Khoản Mới

### Cách 1: Qua API (Nếu có quyền)

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@hrm.com",
    "password": "password123",
    "role": "employee"
  }'
```

### Cách 2: Sửa script createUsers.ts

Thêm user mới vào array `users` trong file `backend/scripts/createUsers.ts`:

```typescript
const users: UserData[] = [
  // ... các user hiện tại
  {
    email: 'newuser@hrm.com',
    password: 'password123',
    role: 'employee',
  },
];
```

Sau đó chạy lại:
```bash
npm run create-users
```

## 🔄 Xóa và Tạo Lại Tài Khoản

Nếu muốn xóa các tài khoản cũ và tạo lại:

1. Mở MongoDB Compass hoặc MongoDB Shell
2. Kết nối tới database `hrm_db`
3. Xóa collection `users`:
   ```javascript
   use hrm_db
   db.users.deleteMany({})
   ```
4. Chạy lại script:
   ```bash
   npm run create-users
   ```

## 🎭 Phân Quyền Chi Tiết

### Admin
- ✅ Toàn quyền truy cập
- ✅ Quản lý nhân viên (CRUD)
- ✅ Quản lý phòng ban (CRUD)
- ✅ Quản lý chức vụ (CRUD)
- ✅ Duyệt/từ chối đơn nghỉ phép
- ✅ Quản lý lương
- ✅ Xem dashboard và thống kê

### HR
- ✅ Xem tất cả nhân viên
- ✅ Quản lý nhân viên (CRUD)
- ✅ Quản lý phòng ban (CRUD)
- ✅ Quản lý chức vụ (CRUD)
- ✅ Duyệt/từ chối đơn nghỉ phép
- ✅ Quản lý lương
- ✅ Xem dashboard và thống kê

### Employee
- ✅ Xem thông tin của mình
- ✅ Tạo và xem đơn nghỉ phép của mình
- ✅ Xem bảng lương của mình
- ❌ Không thể xem/sửa thông tin người khác
- ❌ Không thể quản lý phòng ban, chức vụ
- ❌ Không thể duyệt đơn nghỉ phép

