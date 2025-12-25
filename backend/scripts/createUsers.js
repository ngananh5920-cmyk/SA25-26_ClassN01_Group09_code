require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model (cần compile TypeScript trước hoặc dùng JS version)
// Tạm thời định nghĩa schema ở đây
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'hr', 'manager', 'employee'], default: 'employee' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const users = [
  {
    email: 'admin@hrm.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'hr@hrm.com',
    password: 'hr1234',
    role: 'hr',
  },
  {
    email: 'manager@hrm.com',
    password: 'manager123',
    role: 'manager',
  },
  {
    email: 'employee@hrm.com',
    password: 'employee123',
    role: 'employee',
  },
  {
    email: 'test@hrm.com',
    password: 'test123',
    role: 'employee',
  },
];

async function createUsers() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_db';
    
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Đã kết nối MongoDB');

    // Xóa các user cũ nếu có (optional - comment nếu muốn giữ lại)
    // await User.deleteMany({ email: { $in: users.map(u => u.email) } });

    console.log('\n📝 Đang tạo các tài khoản mẫu...\n');

    for (const userData of users) {
      // Kiểm tra xem user đã tồn tại chưa
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  Tài khoản ${userData.email} đã tồn tại, bỏ qua...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Tạo user mới
      const user = await User.create({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });

      console.log(`✅ Đã tạo tài khoản: ${user.email} (Role: ${user.role})`);
    }

    console.log('\n📋 Danh sách tài khoản đã tạo:\n');
    console.log('┌─────────────────────┬──────────────┬─────────────┐');
    console.log('│ Email               │ Password     │ Role        │');
    console.log('├─────────────────────┼──────────────┼─────────────┤');
    users.forEach(user => {
      console.log(`│ ${user.email.padEnd(19)} │ ${user.password.padEnd(12)} │ ${user.role.padEnd(11)} │`);
    });
    console.log('└─────────────────────┴──────────────┴─────────────┘');
    
    console.log('\n💡 Lưu ý: Hãy đổi mật khẩu sau khi đăng nhập!\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB');
  }
}

createUsers();

