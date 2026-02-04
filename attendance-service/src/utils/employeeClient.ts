import axios from 'axios';

const baseURL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8002';
const serviceKey = process.env.SERVICE_KEY;

export const fetchEmployeeIdsByDepartment = async (departmentId: string): Promise<string[]> => {
  if (!departmentId) {
    return [];
  }

  const response = await axios.get(`${baseURL}/api/employees/by-department`, {
    params: { departmentId },
    headers: {
      ...(serviceKey ? { 'X-Service-Key': serviceKey } : {}),
    },
  });

  return response.data?.data || [];
};


