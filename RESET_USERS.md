# 🔄 Reset Users - Xóa và Tạo Lại User

## Vấn Đề

Nếu bạn đã tạo user với password cũ (ví dụ: `hr123` chỉ có 5 ký tự), bạn cần xóa và tạo lại.

## Giải Pháp Nhanh

### Option 1: Xóa Tất Cả User (Khuyến nghị)

```bash
cd backend
npm run delete-users
```

Sau đó tạo lại:
```bash
npm run create-users
```

### Option 2: Xóa User Cụ Thể Bằng MongoDB

```bash
mongosh hrm_db --eval "db.users.deleteOne({email: 'hr@hrm.com'})"
```

Sau đó tạo lại:
```bash
cd backend
npm run create-users
```

### Option 3: Xóa Toàn Bộ Collection Users

```bash
mongosh hrm_db --eval "db.users.deleteMany({})"
```

Sau đó tạo lại:
```bash
cd backend
npm run create-users
```

## Sau Khi Reset

1. **Chạy script tạo user:**
   ```bash
   cd backend
   npm run create-users
   ```

2. **Đăng nhập với:**
   - Email: `admin@hrm.com`
   - Password: `admin123`

## Danh Sách Tài Khoản Sau Reset

| Email              | Password      | Role      |
|--------------------|---------------|-----------|
| admin@hrm.com      | admin123      | admin     |
| hr@hrm.com         | **hr1234**    | hr        |
| employee@hrm.com   | employee123   | employee  |
| test@hrm.com       | test123       | employee  |

**Lưu ý:** Password `hr1234` có 6 ký tự (đáp ứng yêu cầu tối thiểu).


