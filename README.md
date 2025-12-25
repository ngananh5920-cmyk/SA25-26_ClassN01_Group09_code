# HRM System - Hệ thống Quản lý Nhân sự

Ứng dụng quản lý nhân sự chuyên nghiệp với đầy đủ backend và frontend.

## 🚀 Tính năng

- ✅ Quản lý nhân viên (CRUD)
- ✅ Quản lý phòng ban
- ✅ Quản lý chức vụ
- ✅ Quản lý nghỉ phép
- ✅ Quản lý lương
- ✅ **Quản lý chấm công (Check-in/Check-out)** 🆕
- ✅ Dashboard thống kê
- ✅ Authentication & Authorization (JWT)
- ✅ Phân quyền (Admin, HR, Employee)

## 📋 Yêu cầu hệ thống

- Node.js >= 18.x
- MongoDB >= 5.x
- npm hoặc yarn

## 🔧 Cài đặt

### Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` tự động (hoặc tạo thủ công):
```bash
npm run setup
```
Script này sẽ tạo file `.env` với cấu hình mặc định. Bạn có thể chỉnh sửa sau nếu cần.

4. **Đảm bảo MongoDB đang chạy** (kiểm tra bằng `mongosh --eval "db.version()"`)

5. Chạy server:
```bash
npm run dev
```

Backend sẽ chạy tại `http://localhost:8000`

### Seed dữ liệu mẫu (Tùy chọn)

Để tạo dữ liệu mẫu (phòng ban, nhân viên, lương):
```bash
npm run seed-data
```

Script này sẽ tạo:
- 5 phòng ban
- 15 chức vụ
- 15 nhân viên
- 45 bảng lương (3 tháng cho mỗi nhân viên)

### Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy development server:
```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:4000`

## 📁 Cấu trúc dự án

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình database
│   │   ├── controllers/     # Controllers xử lý logic
│   │   ├── middleware/      # Middleware (auth, validation)
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   └── server.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── contexts/        # Context providers
    │   ├── pages/           # Page components
    │   ├── utils/           # Utilities (api, auth)
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## 🔐 Authentication

Hệ thống sử dụng JWT để xác thực. Sau khi đăng nhập, token được lưu trong localStorage.

### Tạo user đầu tiên (Admin)

Bạn cần tạo user admin đầu tiên thông qua API hoặc MongoDB:

```bash
# Sử dụng MongoDB shell hoặc MongoDB Compass
# Tạo user với role admin
```

Hoặc gọi API register:
```bash
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Employees
- `GET /api/employees` - Lấy danh sách nhân viên
- `GET /api/employees/:id` - Lấy chi tiết nhân viên
- `POST /api/employees` - Tạo nhân viên mới (Admin/HR only)
- `PUT /api/employees/:id` - Cập nhật nhân viên (Admin/HR only)
- `DELETE /api/employees/:id` - Xóa nhân viên (Admin/HR only)
- `GET /api/employees/stats` - Thống kê nhân viên (Admin only)

### Departments
- `GET /api/departments` - Lấy danh sách phòng ban
- `GET /api/departments/:id` - Lấy chi tiết phòng ban
- `POST /api/departments` - Tạo phòng ban mới (Admin only)
- `PUT /api/departments/:id` - Cập nhật phòng ban (Admin only)
- `DELETE /api/departments/:id` - Xóa phòng ban (Admin only)

### Positions
- `GET /api/positions` - Lấy danh sách chức vụ
- `GET /api/positions/:id` - Lấy chi tiết chức vụ
- `POST /api/positions` - Tạo chức vụ mới (Admin only)
- `PUT /api/positions/:id` - Cập nhật chức vụ (Admin only)
- `DELETE /api/positions/:id` - Xóa chức vụ (Admin only)

### Leaves
- `GET /api/leaves` - Lấy danh sách đơn nghỉ phép
- `GET /api/leaves/:id` - Lấy chi tiết đơn nghỉ phép
- `POST /api/leaves` - Tạo đơn nghỉ phép
- `PUT /api/leaves/:id` - Cập nhật đơn nghỉ phép
- `PUT /api/leaves/:id/approve` - Duyệt/từ chối đơn (Admin/HR only)
- `DELETE /api/leaves/:id` - Xóa đơn nghỉ phép

### Salaries
- `GET /api/salaries` - Lấy danh sách bảng lương
- `GET /api/salaries/:id` - Lấy chi tiết bảng lương
- `POST /api/salaries` - Tạo bảng lương (Admin/HR only)
- `POST /api/salaries/process-payroll` - Xử lý lương hàng loạt (Admin only)
- `PUT /api/salaries/:id` - Cập nhật bảng lương (Admin/HR only)
- `DELETE /api/salaries/:id` - Xóa bảng lương (Admin/HR only)

### Attendance (Chấm công)
- `POST /api/attendances/check-in` - Check-in (Employee)
- `POST /api/attendances/check-out` - Check-out (Employee)
- `GET /api/attendances/today` - Lấy trạng thái chấm công hôm nay
- `GET /api/attendances` - Lấy danh sách chấm công
- `GET /api/attendances/stats` - Thống kê chấm công
- `GET /api/attendances/:id` - Lấy chi tiết chấm công
- `POST /api/attendances/create` - Tạo chấm công (Admin/HR only)
- `PUT /api/attendances/:id` - Cập nhật chấm công
- `DELETE /api/attendances/:id` - Xóa chấm công (Admin/HR only)

## 🛠️ Công nghệ sử dụng

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB với Mongoose
- JWT Authentication
- bcryptjs cho password hashing

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- React Query (TanStack Query)
- React Hook Form
- Tailwind CSS
- Lucide React (Icons)
- Axios

## 📝 Notes

- Đảm bảo MongoDB đang chạy trước khi khởi động backend
- Thay đổi JWT_SECRET trong production
- Backend và Frontend chạy trên các port khác nhau (8000 và 4000)
- Vite proxy được cấu hình để forward requests từ `/api` đến backend

## 🐛 Troubleshooting

1. **Lỗi kết nối MongoDB**: Kiểm tra MongoDB đang chạy và MONGODB_URI đúng
2. **Lỗi CORS**: Đảm bảo backend đã enable CORS middleware
3. **Lỗi authentication**: Kiểm tra token trong localStorage và JWT_SECRET

## 📄 License

ISC

