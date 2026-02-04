import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database';
import attendanceRoutes from './routes/attendanceRoutes';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Attendance service is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/attendance', attendanceRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
  });
});

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

const PORT = process.env.PORT || 8008;

app.listen(PORT, () => {
  console.log('attendance-service is running on port ' + PORT);
  console.log('API endpoint: http://localhost:' + PORT + '/api');
  console.log('Health check: http://localhost:' + PORT + '/api/health');
});



