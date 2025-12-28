import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database';

// Import routes
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import employeeRoutes from './routes/employeeRoutes';
import leaveRoutes from './routes/leaveRoutes';
import positionRoutes from './routes/positionRoutes';
import salaryRoutes from './routes/salaryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import contractRoutes from './routes/contractRoutes';
import workShiftRoutes from './routes/workShiftRoutes';
import recruitmentRoutes from './routes/recruitmentRoutes';
import kpiRoutes from './routes/kpiRoutes';
import trainingRoutes from './routes/trainingRoutes';
import announcementRoutes from './routes/announcementRoutes';
import systemSettingsRoutes from './routes/systemSettingsRoutes';
import holidayRoutes from './routes/holidayRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging middleware

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HRM API is running',
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Test endpoint works',
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const User = require('./models/User').default;
    const userCount = await User.countDocuments();
    res.status(200).json({
      status: 'OK',
      message: 'Database connection works',
      userCount: userCount,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'Error',
      message: error.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/work-shifts', workShiftRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/holidays', holidayRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  console.error('Error Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
