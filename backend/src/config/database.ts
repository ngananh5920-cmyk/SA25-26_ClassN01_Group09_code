import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_db';
    
    console.log('🔄 Đang kết nối tới MongoDB...');
    console.log(`📍 URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Ẩn thông tin đăng nhập nếu có
    
    const conn = await mongoose.connect(mongoURI, {
      // Các options để kết nối ổn định hơn
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error: any) {
    console.error('❌ Database connection error:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Hướng dẫn:');
    console.error('   1. Đảm bảo MongoDB đang chạy');
    console.error('   2. Kiểm tra MONGODB_URI trong file .env');
    console.error('   3. Chạy MongoDB: mongod (hoặc service MongoDB)');
    console.error('   4. Windows: net start MongoDB hoặc Services (services.msc)');
    process.exit(1);
  }
};

// Xử lý lỗi kết nối sau khi đã kết nối
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Đang thử kết nối lại...');
});

// Xử lý khi ứng dụng tắt
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;

