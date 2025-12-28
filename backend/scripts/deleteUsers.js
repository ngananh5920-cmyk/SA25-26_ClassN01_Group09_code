require('dotenv').config();
const mongoose = require('mongoose');

// Simple script to delete all users (for testing)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users`);
    
    await mongoose.connection.close();
    console.log('👋 Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });






