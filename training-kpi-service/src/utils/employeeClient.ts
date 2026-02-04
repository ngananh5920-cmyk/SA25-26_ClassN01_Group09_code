import axios from 'axios';

const baseURL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8002';
const serviceKey = process.env.SERVICE_KEY;

export const fetchEmployeesByIds = async (
  ids: string[],
  authHeader?: string
): Promise<Record<string, any>> => {
  if (ids.length === 0) {
    return {};
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

