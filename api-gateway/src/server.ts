import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
app.use(cors());
// Do not parse bodies here; proxy should stream raw request to services.
app.use(morgan('dev'));

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
const EMPLOYEE_SERVICE_URL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8002';
const LEAVE_SERVICE_URL = process.env.LEAVE_SERVICE_URL || 'http://localhost:8003';
const PAYROLL_SERVICE_URL = process.env.PAYROLL_SERVICE_URL || 'http://localhost:8004';
const RECRUITMENT_SERVICE_URL = process.env.RECRUITMENT_SERVICE_URL || 'http://localhost:8005';
const TRAINING_SERVICE_URL = process.env.TRAINING_SERVICE_URL || 'http://localhost:8006';
const COMMUNICATION_SERVICE_URL = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:8007';
const ATTENDANCE_SERVICE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:8008';

const proxy = (target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path: string, req: Request) => req.originalUrl,
    onProxyReq: (proxyReq: any, req: Request) => {
      if (!req.body || Object.keys(req.body).length === 0) {
        return;
      }
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    },
  } as any);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', proxy(AUTH_SERVICE_URL));
app.use('/api/employees', proxy(EMPLOYEE_SERVICE_URL));
app.use('/api/departments', proxy(EMPLOYEE_SERVICE_URL));
app.use('/api/positions', proxy(EMPLOYEE_SERVICE_URL));
app.use('/api/contracts', proxy(EMPLOYEE_SERVICE_URL));
app.use('/api/work-shifts', proxy(EMPLOYEE_SERVICE_URL));
app.use('/api/dashboard', proxy(EMPLOYEE_SERVICE_URL));
app.use('/api/leaves', proxy(LEAVE_SERVICE_URL));
app.use('/api/holidays', proxy(LEAVE_SERVICE_URL));
app.use('/api/audit-logs', proxy(LEAVE_SERVICE_URL));
app.use('/api/salaries', proxy(PAYROLL_SERVICE_URL));
app.use('/api/audit-logs/payroll', proxy(PAYROLL_SERVICE_URL));
app.use('/api/recruitment', proxy(RECRUITMENT_SERVICE_URL));
app.use('/api/training', proxy(TRAINING_SERVICE_URL));
app.use('/api/kpis', proxy(TRAINING_SERVICE_URL));
app.use('/api/audit-logs/training', proxy(TRAINING_SERVICE_URL));
app.use('/api/audit-logs/kpi', proxy(TRAINING_SERVICE_URL));

app.use('/api/announcements', proxy(COMMUNICATION_SERVICE_URL));
app.use('/api/settings', proxy(COMMUNICATION_SERVICE_URL));
app.use('/api/attendance', proxy(ATTENDANCE_SERVICE_URL));

app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('Service URLs:');
  console.log(`- Auth: ${AUTH_SERVICE_URL}`);
  console.log(`- Employee: ${EMPLOYEE_SERVICE_URL}`);
  console.log(`- Leave: ${LEAVE_SERVICE_URL}`);
  console.log(`- Payroll: ${PAYROLL_SERVICE_URL}`);
  console.log(`- Recruitment: ${RECRUITMENT_SERVICE_URL}`);
  console.log(`- Training: ${TRAINING_SERVICE_URL}`);
  console.log(`- Communication: ${COMMUNICATION_SERVICE_URL}`);
  console.log(`- Attendance: ${ATTENDANCE_SERVICE_URL}`);
});
