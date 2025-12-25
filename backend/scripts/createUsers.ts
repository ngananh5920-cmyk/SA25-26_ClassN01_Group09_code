import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';

dotenv.config();

interface UserData {
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
}

const users: UserData[] = [
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

    console.log('\n📝 Đang tạo các tài khoản mẫu...\n');

    for (const userData of users) {
      // Kiểm tra xem user đã tồn tại chưa
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  Tài khoản ${userData.email} đã tồn tại, bỏ qua...`);
        continue;
      }

      // Hash password (User model sẽ tự động hash trong pre-save hook)
      const user = await User.create({
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });

      console.log(`✅ Đã tạo tài khoản: ${user.email} (Role: ${user.role})`);
    }

    console.log('\n📋 Danh sách tài khoản:\n');
    console.log('┌─────────────────────┬──────────────┬─────────────┐');
    console.log('│ Email               │ Password     │ Role        │');
    console.log('├─────────────────────┼──────────────┼─────────────┤');
    users.forEach(user => {
      console.log(`│ ${user.email.padEnd(19)} │ ${user.password.padEnd(12)} │ ${user.role.padEnd(11)} │`);
    });
    console.log('└─────────────────────┴──────────────┴─────────────┘');
    
    console.log('\n💡 Lưu ý: Hãy đổi mật khẩu sau khi đăng nhập!\n');
    console.log('🌐 Đăng nhập tại: http://localhost:4000/login\n');

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB');
  }
}

createUsers();

