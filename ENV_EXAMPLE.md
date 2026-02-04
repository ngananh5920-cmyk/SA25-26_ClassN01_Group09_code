# Environment Variables (Example)

Use the following values as a template for each service.
Replace `change_me` with a real secret shared across services.

## auth-service
```
PORT=8001
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=change_me
JWT_EXPIRE=7d
SERVICE_KEY=change_me
```

## employee-service
```
PORT=8002
MONGODB_URI=mongodb://localhost:27017/employee_db
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## leave-service
```
PORT=8003
MONGODB_URI=mongodb://localhost:27017/leave_db
EMPLOYEE_SERVICE_URL=http://localhost:8002
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## payroll-service
```
PORT=8004
MONGODB_URI=mongodb://localhost:27017/payroll_db
EMPLOYEE_SERVICE_URL=http://localhost:8002
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## recruitment-service
```
PORT=8005
MONGODB_URI=mongodb://localhost:27017/recruitment_db
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## training-kpi-service
```
PORT=8006
MONGODB_URI=mongodb://localhost:27017/training_kpi_db
EMPLOYEE_SERVICE_URL=http://localhost:8002
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## communication-service
```
PORT=8007
MONGODB_URI=mongodb://localhost:27017/communication_db
EMPLOYEE_SERVICE_URL=http://localhost:8002
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## attendance-service
```
PORT=8008
MONGODB_URI=mongodb://localhost:27017/attendance_db
EMPLOYEE_SERVICE_URL=http://localhost:8002
JWT_SECRET=change_me
SERVICE_KEY=change_me
```

## api-gateway
```
PORT=8000
AUTH_SERVICE_URL=http://localhost:8001
EMPLOYEE_SERVICE_URL=http://localhost:8002
LEAVE_SERVICE_URL=http://localhost:8003
PAYROLL_SERVICE_URL=http://localhost:8004
RECRUITMENT_SERVICE_URL=http://localhost:8005
TRAINING_SERVICE_URL=http://localhost:8006
COMMUNICATION_SERVICE_URL=http://localhost:8007
ATTENDANCE_SERVICE_URL=http://localhost:8008
```

## frontend
```
PORT=4000
```




