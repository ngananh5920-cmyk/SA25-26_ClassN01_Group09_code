import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_db';

    console.log('Connecting to MongoDB (employee-service)...');
    console.log(`URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected (employee-service): ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error: any) {
    console.error('Database connection error (employee-service):');
    console.error(`   ${error.message}`);
    console.error('\nHints:');
    console.error('   1. Ensure MongoDB is running');
    console.error('   2. Check MONGODB_URI in your .env');
    console.error('   3. Start MongoDB: mongod (or MongoDB service)');
    console.error('   4. Windows: net start MongoDB or Services (services.msc)');
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Reconnecting...');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
