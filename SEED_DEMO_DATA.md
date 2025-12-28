# Hướng dẫn Tạo Dữ liệu Demo

Script này sẽ tạo dữ liệu demo cho 4 mục:
1. **Tuyển dụng** (Recruitment) - 3 tin tuyển dụng với ứng viên
2. **Đánh giá & KPI** - 5 bản đánh giá KPI cho nhân viên
3. **Đào tạo** (Training) - 4 khóa đào tạo với đăng ký
4. **Thông báo** (Announcements) - 5 thông báo nội bộ

## Yêu cầu

Trước khi chạy script, cần đảm bảo:
- ✅ Đã có dữ liệu cơ bản (departments, positions, employees, users)
- ✅ Có ít nhất 1 user với role `admin`
- ✅ Có ít nhất 1 user với role `hr`
- ✅ Có ít nhất 5 employees trong database

## Cách chạy

### 1. Từ thư mục backend:

```bash
npm run seed-demo
```

### 2. Hoặc chạy trực tiếp với ts-node:

```bash
npx ts-node scripts/seedDemoData.ts
```

## Dữ liệu sẽ được tạo

### 1. Tuyển dụng (3 tin)
- Tuyển dụng Nhân viên Kinh doanh (3 ứng viên)
- Tuyển dụng Lập trình viên Full-stack (1 ứng viên)
- Tuyển dụng Chuyên viên Nhân sự

### 2. Đánh giá & KPI (5 bản)
- KPI tháng trước cho 5 nhân viên
- Bao gồm: Doanh số, Khách hàng mới, Hài lòng khách hàng, Hoàn thành dự án
- Đã được đánh giá và có điểm số

### 3. Đào tạo (4 khóa)
- Đào tạo Kỹ năng Bán hàng (sắp tới)
- Khóa học React & Node.js Nâng cao (sắp tới)
- Workshop Quản lý Thời gian (đã hoàn thành)
- Đào tạo Excel Nâng cao (đang diễn ra)

### 4. Thông báo (5 thông báo)
- Thông báo Lịch nghỉ Tết (high priority)
- Tin tức Doanh thu kỷ lục
- Sự kiện Team Building
- Chính sách Làm việc từ xa (high priority)
- Thông báo khẩn Họp toàn công ty (urgent)

## Lưu ý

- Script sẽ không xóa dữ liệu cũ, chỉ thêm mới
- Nếu dữ liệu đã tồn tại, script sẽ bỏ qua hoặc tạo mới
- Đảm bảo MongoDB đang chạy và kết nối đúng

