import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8002';

export const fetchEmployeesByIds = async (
  ids: string[],
  authHeader?: string
): Promise<Record<string, any>> => {
  if (ids.length === 0) {
    return {};
  }

  // Read SERVICE_KEY at call time so it picks up value from dotenv.config()
  const serviceKey = process.env.SERVICE_KEY;
  if (!serviceKey) {
    console.warn(
      'leave-service: SERVICE_KEY is not set; calling employee-service without X-Service-Key'
    );
  }

  const response = await axios.post(
    `${baseURL}/api/employees/batch`,
    { ids },
    {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(serviceKey ? { 'X-Service-Key': serviceKey } : {}),
      },
    }
  );

  const employees = response.data?.data || [];
  const map: Record<string, any> = {};
  for (const employee of employees) {
    map[employee._id] = employee;
  }
  return map;
};

