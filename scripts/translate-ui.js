const fs = require('fs');
const path = require('path');

const replacements = new Map([
  ['Đang tải dữ liệu...', 'Loading data...'],
  ['Thao tác thất bại', 'Action failed'],
  ['Xóa thất bại', 'Delete failed'],
  ['Xác nhận xóa', 'Confirm delete'],
  ['Bạn có chắc muốn xóa', 'Are you sure you want to delete'],
  ['Bạn có chắc chắn muốn xóa', 'Are you sure you want to delete'],
  ['Đang lưu...', 'Saving...'],
  ['Cập nhật', 'Update'],
  ['Tạo', 'Create'],
  ['Thêm', 'Add'],
  ['Sửa', 'Edit'],
  ['Xóa', 'Delete'],
  ['Hủy', 'Cancel'],
  ['Đang tải...', 'Loading...'],
  ['Đang đăng...', 'Publishing...'],
  ['Đang xử lý...', 'Processing...'],
  ['Tất cả', 'All'],
  ['Trạng thái', 'Status'],
  ['Hoạt động', 'Active'],
  ['Không hoạt động', 'Inactive'],
  ['Tìm kiếm', 'Search'],
  ['Đặt lại', 'Reset'],
  ['Xuất CSV', 'Export CSV'],
  ['Xuất file CSV thành công', 'CSV exported successfully'],
  ['Chưa có', 'No'],
  ['Không tìm thấy', 'No'],
  ['Trước', 'Prev'],
  ['Sau', 'Next'],
  ['Đăng nhập', 'Sign in'],
  ['Đăng xuất', 'Sign out'],
  ['Mật khẩu', 'Password'],
  ['Đang đăng nhập...', 'Signing in...'],
  ['Đăng nhập vào hệ thống', 'Sign in to the system'],
  ['Tài khoản demo', 'Demo accounts'],
  ['Nhân viên', 'Employees'],
  ['Phòng ban', 'Departments'],
  ['Chức vụ', 'Positions'],
  ['Nghỉ phép', 'Leaves'],
  ['Lương', 'Salaries'],
  ['Tuyển dụng', 'Recruitment'],
  ['Đánh giá & KPI', 'Reviews & KPI'],
  ['Đào tạo', 'Training'],
  ['Thông báo', 'Announcements'],
  ['Đang tuyển', 'Open'],
  ['Đã đóng', 'Closed'],
  ['Đã đủ', 'Filled'],
  ['Chưa có thông báo nào', 'No announcements yet'],
  ['Thông báo & Nội bộ', 'Announcements & Internal'],
  ['Tạo Thông báo', 'Create announcement'],
  ['Sửa Thông báo', 'Edit announcement'],
  ['Đăng thông báo', 'Publish announcement'],
  ['Tiêu đề', 'Title'],
  ['Nội dung', 'Content'],
  ['Loại', 'Type'],
  ['Thông báo công ty', 'Company announcement'],
  ['Tin tức', 'News'],
  ['Sự kiện', 'Event'],
  ['Chính sách', 'Policy'],
  ['Độ ưu tiên', 'Priority'],
  ['Khẩn cấp', 'Urgent'],
  ['Bình thường', 'Normal'],
  ['Thấp', 'Low'],
  ['Cao', 'High'],
  ['Ngày đăng', 'Publish date'],
  ['Ngày hết hạn', 'Expiry date'],
  ['Nháp', 'Draft'],
  ['Đã đăng', 'Published'],
  ['Đã lưu trữ', 'Archived'],
]);

const root = path.resolve(__dirname, '../frontend/src');

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
};

walk(root);
console.log('UI translation pass completed.');






