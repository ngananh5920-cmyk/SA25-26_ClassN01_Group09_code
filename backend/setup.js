const fs = require('fs');
const path = require('path');

const envContent = `PORT=8000
MONGODB_URI=mongodb://localhost:27017/hrm_db
JWT_SECRET=hrm_secret_key_2024_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

try {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ File .env đã được tạo thành công!');
    console.log('📝 Bạn có thể chỉnh sửa file .env để thay đổi cấu hình.');
  } else {
    console.log('⚠️  File .env đã tồn tại. Không ghi đè.');
    console.log('📝 Nếu muốn tạo lại, hãy xóa file .env và chạy lại script này.');
  }
} catch (error) {
  console.error('❌ Lỗi khi tạo file .env:', error.message);
  process.exit(1);
}

