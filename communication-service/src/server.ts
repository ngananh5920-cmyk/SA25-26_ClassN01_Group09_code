import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database';
import announcementRoutes from './routes/announcementRoutes';
import systemSettingsRoutes from './routes/systemSettingsRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Communication service is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', systemSettingsRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
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
const PORT = process.env.PORT || 8007;

app.listen(PORT, () => {
  console.log('communication-service is running on port ' + PORT);
  console.log('API endpoint: http://localhost:' + PORT + '/api');
  console.log('Health check: http://localhost:' + PORT + '/api/health');
});
